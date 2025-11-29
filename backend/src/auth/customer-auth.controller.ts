import { Controller, Post, Get, Body, Query, Res, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { CustomerAuthService, RegisterDto, LoginDto } from './customer-auth.service';
import { SmsService } from './sms.service';
import { Public } from './decorators/public.decorator';

function getOAuthCookieOptions(frontendUrl: string) {
  let domain = process.env.OAUTH_COOKIE_DOMAIN;

  if (!domain) {
    try {
      const url = new URL(frontendUrl);
      const hostname = url.hostname.replace(/^www\./, '');
      const isLocalHost = hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
      
      if (isLocalHost) {
        domain = undefined; // localhost cookies work without domain
      } else {
        // For production domains, use dot-prefixed domain for subdomain support
        // e.g., pornopizza.sk -> .pornopizza.sk (works for www.pornopizza.sk too)
        domain = hostname.startsWith('.') ? hostname : `.${hostname}`;
      }
    } catch (error) {
      console.error('Error parsing frontend URL for cookie domain:', error);
      domain = undefined;
    }
  } else {
    // If OAUTH_COOKIE_DOMAIN is set, ensure it starts with dot if not already
    if (domain && !domain.startsWith('.') && !domain.includes('localhost')) {
      domain = `.${domain}`;
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = isProduction || frontendUrl.startsWith('https://');

  const options = {
    httpOnly: false, // Frontend needs to read oauth_user_data
    secure: isSecure,
    sameSite: 'lax' as const,
    path: '/',
    ...(domain ? { domain } : {}),
  };

  console.log('OAuth cookie options:', {
    domain,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
    frontendUrl,
    isProduction,
  });

  return options;
}

@Controller('auth/customer')
export class CustomerAuthController {
  constructor(
    private customerAuthService: CustomerAuthService,
    private smsService: SmsService,
  ) {}

  /**
   * Check if email exists
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 checks per minute
  @Post('check-email')
  async checkEmail(@Body() body: { email: string }) {
    try {
      if (!body?.email) {
        return { exists: false };
      }
      const exists = await this.customerAuthService.checkEmailExists(body.email);
      return { exists };
    } catch (error: unknown) {
      console.error('[CustomerAuthController] Error checking email:', error);
      // Return false on error to allow registration flow to continue
      // This prevents blocking users if there's a database issue
      return { exists: false };
    }
  }

  /**
   * Register customer with email and password
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 registrations per minute
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.customerAuthService.registerWithEmail(registerDto);

    // Set HttpOnly cookies in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
      });

      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }

    return result;
  }

  /**
   * Login customer with email and password
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 login attempts per minute
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.customerAuthService.loginWithEmail(loginDto);

    // Set HttpOnly cookies in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
      });

      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }

    return result;
  }

  /**
   * Google OAuth redirect
   */
  @Public()
  @Get('google')
  async googleRedirect(
    @Res() res: Response, 
    @Query('returnUrl') returnUrl?: string,
    @Query('state') state?: string,
  ) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    // Use frontend URL as redirect URI (Google will redirect to frontend, not backend)
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${frontendUrl}/auth/google/callback`;

    if (!clientId) {
      return res.status(400).json({
        message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in environment variables.',
        error: 'Not Configured',
        statusCode: 400,
      });
    }

    if (!redirectUri) {
      console.error('Google OAuth redirect URI not configured. BACKEND_URL or GOOGLE_REDIRECT_URI must be set.');
      return res.status(500).json({
        message: 'Google OAuth redirect URI is not configured. Please set BACKEND_URL or GOOGLE_REDIRECT_URI in environment variables.',
        error: 'Configuration Error',
        statusCode: 500,
      });
    }

    // Log redirect URI for debugging (important for fixing redirect_uri_mismatch errors)
    console.log('🔐 Google OAuth redirect URI:', redirectUri);
    console.log('🔐 Google OAuth config:', {
      redirectUri,
      frontendUrl,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
      FRONTEND_URL: process.env.FRONTEND_URL,
      NODE_ENV: process.env.NODE_ENV,
    });

    // Warn if using localhost in production
    if (process.env.NODE_ENV === 'production' && redirectUri.includes('localhost')) {
      console.error('⚠️ WARNING: Google OAuth redirect URI contains localhost in production!', {
        redirectUri,
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
        FRONTEND_URL: process.env.FRONTEND_URL,
      });
    }

    // Use state from query if provided, otherwise generate from returnUrl
    let stateParam = state;
    if (!stateParam && returnUrl) {
      stateParam = Buffer.from(JSON.stringify({ returnUrl })).toString('base64');
    }

    const scopes = ['openid', 'email', 'profile'];
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      (stateParam ? `state=${encodeURIComponent(stateParam)}&` : '') +
      `access_type=offline&` +
      `prompt=consent`;

    console.log('🔐 Redirecting to Google OAuth with redirect_uri:', redirectUri);
    res.redirect(googleAuthUrl);
  }

  /**
   * Google OAuth exchange endpoint (for frontend callback)
   * Frontend receives code from Google and sends it here to exchange for tokens
   */
  @Public()
  @Post('google/exchange')
  async googleExchange(
    @Body() body: { code: string; state?: string },
    @Res() res: Response,
  ) {
    const { code, state } = body;

    if (!code) {
      return res.status(400).json({
        message: 'Code is required',
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    try {
      const { OAuth2Client } = require('google-auth-library');
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      
      // Use the SAME redirect URI as in googleRedirect method
      // This must match exactly what was sent to Google in the initial redirect
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
        `${frontendUrl}/auth/google/callback`;

      console.log('🔐 Google OAuth exchange - using redirect URI:', redirectUri);

      if (!clientId || !clientSecret) {
        return res.status(500).json({
          message: 'Google OAuth is not configured',
          error: 'Not Configured',
          statusCode: 500,
        });
      }

      const client = new OAuth2Client(clientId, clientSecret, redirectUri);

      // Exchange code for tokens
      const { tokens: googleTokens } = await client.getToken(code);
      const idToken = googleTokens.id_token;

      if (!idToken) {
        return res.status(400).json({
          message: 'No ID token received from Google',
          error: 'Bad Request',
          statusCode: 400,
        });
      }

      // Login with Google (reuse existing service method)
      const result = await this.customerAuthService.loginWithGoogle(idToken);

      // Return tokens to frontend
      return res.json({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user: result.user,
        needsSmsVerification: result.needsSmsVerification,
      });
    } catch (error: any) {
      console.error('Google OAuth exchange error:', error);
      return res.status(500).json({
        message: error.message || 'Failed to exchange code for tokens',
        error: 'Internal Server Error',
        statusCode: 500,
      });
    }
  }

  /**
   * Google OAuth callback (legacy - kept for backward compatibility)
   */
  @Public()
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login?error=no_code`);
    }

    try {
      const { OAuth2Client } = require('google-auth-library');
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const backendUrl = process.env.BACKEND_URL || process.env.API_URL;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
        (backendUrl ? `${backendUrl}/api/auth/customer/google/callback` : undefined);

      if (!clientId || !clientSecret) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login?error=not_configured`);
      }

      if (!redirectUri) {
        console.error('Google OAuth callback: redirect URI not configured. BACKEND_URL or GOOGLE_REDIRECT_URI must be set.');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        return res.redirect(`${frontendUrl}/auth/login?error=redirect_uri_not_configured`);
      }

      // Warn if using localhost in production
      if (process.env.NODE_ENV === 'production' && redirectUri.includes('localhost')) {
        console.error('⚠️ WARNING: Google OAuth callback redirect URI contains localhost in production!', {
          redirectUri,
          backendUrl,
          GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
          BACKEND_URL: process.env.BACKEND_URL,
          API_URL: process.env.API_URL,
        });
      }

      const client = new OAuth2Client(clientId, clientSecret, redirectUri);

      // Exchange code for tokens
      const { tokens: googleTokens } = await client.getToken(code);
      const idToken = googleTokens.id_token;

      if (!idToken) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login?error=no_token`);
      }

      // Login with Google
      const result = await this.customerAuthService.loginWithGoogle(idToken);

      // Set HttpOnly cookies in production
      if (process.env.NODE_ENV === 'production') {
        res.cookie('access_token', result.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 60 * 60 * 1000, // 1 hour
          path: '/',
        });

        res.cookie('refresh_token', result.refresh_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        });
      }

        // Parse returnUrl from state if provided
        let returnUrl: string | undefined;
        let tenant: string | undefined;
        if (state) {
          try {
            const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
            if (decoded.returnUrl) {
              returnUrl = decoded.returnUrl;
            }
            if (decoded.tenant) {
              tenant = decoded.tenant;
            }
          } catch (e) {
            // Invalid state, use default
          }
        }

        // Always redirect to oauth-callback to store tokens, then redirect to appropriate page
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        
        // Always use URL params for better cross-domain compatibility
        // Cookies don't work well when backend and frontend are on different domains
        // (e.g., pizza-system-web.onrender.com -> p0rnopizza.sk)
        const useUrlParams = true;
        
        console.log('OAuth callback mode:', {
          frontendUrl,
          useUrlParams: true,
          NODE_ENV: process.env.NODE_ENV,
          reason: 'Using URL params for cross-domain compatibility'
        });
        
        if (useUrlParams) {
          // Development: Store tokens in localStorage via JavaScript redirect
          // Use the same format as the working commit (587f43e)
          const tokens = {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            user: result.user,
            needsSmsVerification: result.needsSmsVerification,
          };
          
          // Encode tokens for URL (will be stored in localStorage on frontend)
          const tokensParam = Buffer.from(JSON.stringify(tokens)).toString('base64');
          
          let redirectUrl: string;
          if (result.needsSmsVerification) {
            // If SMS verification needed, redirect to verify-phone page
            const verifyUrl = `/auth/verify-phone?userId=${result.user.id}`;
            if (returnUrl) {
              redirectUrl = `${verifyUrl}&returnUrl=${encodeURIComponent(returnUrl)}`;
            } else if (tenant) {
              redirectUrl = `${verifyUrl}&tenant=${tenant}`;
            } else {
              redirectUrl = verifyUrl;
            }
          } else {
            // Redirect to returnUrl if exists, otherwise to account page
            if (returnUrl) {
              redirectUrl = returnUrl;
            } else {
              const accountTenant = tenant || 'pornopizza';
              redirectUrl = `/account?tenant=${accountTenant}`;
            }
          }
          
          console.log('Google OAuth callback (dev) - redirecting to oauth-callback with redirect:', redirectUrl, 'needsSmsVerification:', result.needsSmsVerification);
          
          // Redirect to a page that will store tokens in localStorage and then redirect
          res.redirect(`${frontendUrl}/auth/oauth-callback?tokens=${encodeURIComponent(tokensParam)}&redirect=${encodeURIComponent(redirectUrl)}`);
        } else {
          // Production: Use cookies with proper domain settings
          const oauthCookieOptions = getOAuthCookieOptions(frontendUrl);

          console.log('Setting OAuth cookies with options:', oauthCookieOptions);

          res.cookie('oauth_access_token', result.access_token, {
            ...oauthCookieOptions,
            httpOnly: false, // Frontend needs to read this
            maxAge: 60 * 60 * 1000, // 1 hour
          });

          res.cookie('oauth_refresh_token', result.refresh_token, {
            ...oauthCookieOptions,
            httpOnly: false, // Frontend needs to read this
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });

          // Store user data in a short-lived cookie (frontend needs to read this)
          const userData = {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            needsSmsVerification: result.needsSmsVerification,
          };
          res.cookie('oauth_user_data', JSON.stringify(userData), {
            ...oauthCookieOptions,
            httpOnly: false, // Frontend needs to read this
            maxAge: 5 * 60 * 1000, // 5 minutes - short lived
          });

          console.log('OAuth cookies set successfully');
          
          let redirectUrl: string;
          if (result.needsSmsVerification) {
            // If SMS verification needed, redirect to verify-phone page
            const verifyUrl = `/auth/verify-phone?userId=${result.user.id}`;
            if (returnUrl) {
              redirectUrl = `${verifyUrl}&returnUrl=${encodeURIComponent(returnUrl)}`;
            } else if (tenant) {
              redirectUrl = `${verifyUrl}&tenant=${tenant}`;
            } else {
              redirectUrl = verifyUrl;
            }
          } else {
            // Redirect to returnUrl if exists, otherwise to account page
            if (returnUrl) {
              redirectUrl = returnUrl;
            } else {
              const accountTenant = tenant || 'pornopizza';
              redirectUrl = `/account?tenant=${accountTenant}`;
            }
          }
          
          const oauthCallbackUrl = `${frontendUrl}/auth/oauth-callback?redirect=${encodeURIComponent(redirectUrl)}`;
          console.log('Google OAuth callback (prod) - redirecting to oauth-callback:', {
            oauthCallbackUrl,
            redirectUrl,
            frontendUrl,
            cookieDomain: oauthCookieOptions.domain,
            cookieSecure: oauthCookieOptions.secure,
            cookieSameSite: oauthCookieOptions.sameSite,
            userEmail: result.user.email,
            needsSmsVerification: result.needsSmsVerification,
          });
          res.redirect(oauthCallbackUrl);
        }
    } catch (error: any) {
      console.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent(error.message || 'oauth_failed')}`);
    }
  }

  /**
   * Apple OAuth redirect
   */
  @Public()
  @Get('apple')
  async appleRedirect(
    @Res() res: Response,
    @Query('returnUrl') returnUrl?: string,
    @Query('tenant') tenant?: string,
    @Query('state') state?: string,
  ) {
    const clientId = process.env.APPLE_CLIENT_ID || process.env.APPLE_SERVICE_ID;
    const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3000';
    const redirectUri = process.env.APPLE_REDIRECT_URI || 
      `${backendUrl}/api/auth/customer/apple/callback`;

    if (!clientId) {
      return res.status(400).json({
        message: 'Apple OAuth is not configured. Please set APPLE_CLIENT_ID or APPLE_SERVICE_ID in environment variables.',
        error: 'Not Configured',
        statusCode: 400,
      });
    }

    // Use state from query if provided, otherwise generate from returnUrl and tenant
    let stateParam = state;
    if (!stateParam) {
      const stateData: { returnUrl?: string; tenant?: string } = {};
      if (returnUrl) stateData.returnUrl = returnUrl;
      if (tenant) stateData.tenant = tenant;
      if (Object.keys(stateData).length > 0) {
        stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');
      }
    }

    const scopes = ['name', 'email'];
    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `response_mode=form_post&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      (stateParam ? `state=${encodeURIComponent(stateParam)}&` : '');

    res.redirect(appleAuthUrl);
  }

  /**
   * Apple OAuth callback
   * Note: Apple uses POST for callback, not GET
   */
  @Public()
  @Post('apple/callback')
  async appleCallback(
    @Body() body: { code?: string; state?: string; user?: string; id_token?: string },
    @Res() res: Response,
  ) {
    const { code, state: stateParam, user: userParam, id_token } = body;

    if (!code && !id_token) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login?error=no_code`);
    }

    try {
      const clientId = process.env.APPLE_CLIENT_ID || process.env.APPLE_SERVICE_ID;
      const teamId = process.env.APPLE_TEAM_ID;
      const keyId = process.env.APPLE_KEY_ID;
      const privateKey = process.env.APPLE_PRIVATE_KEY;
      const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3000';
      const redirectUri = process.env.APPLE_REDIRECT_URI || 
        `${backendUrl}/api/auth/customer/apple/callback`;

      if (!clientId || !teamId || !keyId || !privateKey) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login?error=not_configured`);
      }

      let idToken = id_token;

      // If we have code, exchange it for tokens
      if (code && !idToken) {
        // Generate client secret (JWT)
        const jwt = require('jsonwebtoken');
        // Note: jsonwebtoken needs to be installed: npm install jsonwebtoken @types/jsonwebtoken
        const clientSecret = jwt.sign(
          {
            iss: teamId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            aud: 'https://appleid.apple.com',
            sub: clientId,
          },
          privateKey.replace(/\\n/g, '\n'),
          {
            algorithm: 'ES256',
            keyid: keyId,
          }
        );

        // Exchange code for tokens
        const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          console.error('Apple token exchange error:', error);
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login?error=token_exchange_failed`);
        }

        const tokenData = await tokenResponse.json();
        idToken = tokenData.id_token;

        if (!idToken) {
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login?error=no_token`);
        }
      }

      // Parse user info from userParam if provided (only on first login)
      let userInfo: { name?: { firstName?: string; lastName?: string }; email?: string } | null = null;
      if (userParam) {
        try {
          userInfo = JSON.parse(userParam);
        } catch (e) {
          console.warn('Failed to parse Apple user parameter:', e);
        }
      }

      // Login with Apple using id_token and user info
      const result = await this.customerAuthService.loginWithApple(idToken, userInfo);

      // Parse returnUrl from state if provided
      let returnUrl: string | undefined;
      let tenant: string | undefined;
      if (stateParam) {
        try {
          const decoded = JSON.parse(Buffer.from(stateParam, 'base64').toString());
          if (decoded.returnUrl) {
            returnUrl = decoded.returnUrl;
          }
          if (decoded.tenant) {
            tenant = decoded.tenant;
          }
        } catch (e) {
          // Invalid state, use default
        }
      }

      // Always redirect to oauth-callback to store tokens, then redirect to appropriate page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      
      // Always use URL params for better cross-domain compatibility
      // Cookies don't work well when backend and frontend are on different domains
      // (e.g., pizza-system-web.onrender.com -> p0rnopizza.sk)
      const useUrlParams = true;
      
      console.log('Apple OAuth callback mode:', {
        frontendUrl,
        useUrlParams: true,
        NODE_ENV: process.env.NODE_ENV,
        reason: 'Using URL params for cross-domain compatibility'
      });
      
      if (useUrlParams) {
        // Use the same format as Google OAuth for consistency
        const tokens = {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          user: result.user,
          needsSmsVerification: result.needsSmsVerification,
        };
        
        // Encode tokens for URL (will be stored in localStorage on frontend)
        const tokensParam = Buffer.from(JSON.stringify(tokens)).toString('base64');
        
        let redirectUrl: string;
        if (result.needsSmsVerification) {
          // If SMS verification needed, redirect to verify-phone page
          const verifyUrl = `/auth/verify-phone?userId=${result.user.id}`;
          if (returnUrl) {
            redirectUrl = `${verifyUrl}&returnUrl=${encodeURIComponent(returnUrl)}`;
          } else if (tenant) {
            redirectUrl = `${verifyUrl}&tenant=${tenant}`;
          } else {
            redirectUrl = verifyUrl;
          }
        } else {
          // Redirect to returnUrl if exists, otherwise to account page
          if (returnUrl) {
            redirectUrl = returnUrl;
          } else {
            const accountTenant = tenant || 'pornopizza';
            redirectUrl = `/account?tenant=${accountTenant}`;
          }
        }
        
        console.log('Apple OAuth callback - redirecting to oauth-callback with redirect:', redirectUrl, 'needsSmsVerification:', result.needsSmsVerification);
        
        // Redirect to a page that will store tokens in localStorage and then redirect
        res.redirect(`${frontendUrl}/auth/oauth-callback?tokens=${encodeURIComponent(tokensParam)}&redirect=${encodeURIComponent(redirectUrl)}`);
      } else {
        // Production: Use cookies with proper domain settings
        const oauthCookieOptions = getOAuthCookieOptions(frontendUrl);

        console.log('Setting OAuth cookies with options:', oauthCookieOptions);
        
        // Store tokens in cookies the frontend can read (short-lived, re-stored in localStorage)
        res.cookie('oauth_access_token', result.access_token, {
          ...oauthCookieOptions,
          httpOnly: false, // Frontend needs to read this
          maxAge: 60 * 60 * 1000, // 1 hour
        });

        res.cookie('oauth_refresh_token', result.refresh_token, {
          ...oauthCookieOptions,
          httpOnly: false, // Frontend needs to read this
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Store user data in a short-lived cookie (frontend needs to read this)
        const userData = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          needsSmsVerification: result.needsSmsVerification,
        };
        res.cookie('oauth_user_data', JSON.stringify(userData), {
          ...oauthCookieOptions,
          httpOnly: false, // Frontend needs to read this
          maxAge: 5 * 60 * 1000, // 5 minutes - short lived
        });

        console.log('OAuth cookies set successfully');
      
      let redirectUrl: string;
      if (result.needsSmsVerification) {
        // If SMS verification needed, redirect to verify-phone page
        const verifyUrl = `/auth/verify-phone?userId=${result.user.id}`;
        if (returnUrl) {
          redirectUrl = `${verifyUrl}&returnUrl=${encodeURIComponent(returnUrl)}`;
        } else if (tenant) {
          redirectUrl = `${verifyUrl}&tenant=${tenant}`;
        } else {
          redirectUrl = verifyUrl;
        }
      } else {
        // Redirect to returnUrl if exists, otherwise to checkout
        if (returnUrl) {
          redirectUrl = returnUrl;
        } else {
          const checkoutTenant = tenant || 'pornopizza';
          redirectUrl = `/checkout?tenant=${checkoutTenant}`;
        }
      }
      
      console.log('Apple OAuth callback - redirecting to oauth-callback with redirect:', redirectUrl, 'needsSmsVerification:', result.needsSmsVerification);
      
      // Redirect to oauth-callback which will read cookies and store in localStorage
      res.redirect(`${frontendUrl}/auth/oauth-callback?redirect=${encodeURIComponent(redirectUrl)}`);
      }
    } catch (error: any) {
      console.error('Apple OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent(error.message || 'oauth_failed')}`);
    }
  }

  /**
   * Send SMS verification code for customer
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 SMS requests per minute
  @Post('send-sms-code')
  async sendSmsCode(@Body() body: { phone: string; userId: string }) {
    const { phone, userId } = body;
    return await this.smsService.sendVerificationCode(phone, userId);
  }

  /**
   * Verify SMS code and complete customer registration/login
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 verification attempts per minute
  @Post('verify-sms')
  async verifySms(@Body() body: { phone: string; code: string; userId: string }, @Res({ passthrough: true }) res: Response) {
    const { phone, code, userId } = body;

    const result = await this.customerAuthService.verifySmsAndComplete(phone, code, userId);

    // Set HttpOnly cookies in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
      });

      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }

    return result;
  }

  /**
   * Set password using token (for account setup after guest checkout)
   */
  @Public()
  @Post('set-password')
  async setPassword(@Body() body: { token: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const { token, password } = body;

    if (!token || !password) {
      throw new BadRequestException('Token a heslo sú povinné');
    }

    if (password.length < 6) {
      throw new BadRequestException('Heslo musí mať aspoň 6 znakov');
    }

    const result = await this.customerAuthService.setPasswordWithToken(token, password);

    // Set HttpOnly cookies in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
      });

      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }

    return result;
  }
}

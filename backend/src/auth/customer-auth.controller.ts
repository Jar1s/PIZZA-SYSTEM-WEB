import { Controller, Post, Get, Body, Query, Res, BadRequestException, UnauthorizedException, Req, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CustomerAuthService } from './customer-auth.service';
import { RegisterDto, LoginDto } from './dto/customer-auth.dto';
import { SmsService } from './sms.service';
import { Public } from './decorators/public.decorator';
import { TenantsService } from '../tenants/tenants.service';

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
      new Logger('CustomerAuthController').warn(`Failed to parse frontend URL for cookie domain: ${error instanceof Error ? error.message : error}`);
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

  return options;
}

function decodeState(state?: string): { returnUrl?: string; tenant?: string } {
  if (!state) return {};
  try {
    return JSON.parse(Buffer.from(state, 'base64').toString());
  } catch (e) {
    return {};
  }
}

function extractCookieValue(req: Request, cookieName: string): string | undefined {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return undefined;

  const match = cookieHeader
    .split(';')
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith(`${cookieName}=`));

  if (!match) return undefined;
  const value = match.slice(cookieName.length + 1);
  if (!value) return undefined;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

@Controller('auth/customer')
export class CustomerAuthController {
  private readonly logger = new Logger(CustomerAuthController.name);

  constructor(
    private customerAuthService: CustomerAuthService,
    private smsService: SmsService,
    private tenantsService: TenantsService,
  ) {}

  private async resolveTenant(req: Request, options: { stateTenant?: string; queryTenant?: string } = {}) {
    const headerTenant = (req.headers['x-tenant'] as string | undefined)?.toString();
    const host = (req.headers['host'] || '').toString().split(':')[0];
    const hostTenant = host ? await this.tenantsService.findTenantByDomain(host) : null;

    const tenantCandidates = [options.stateTenant, options.queryTenant, headerTenant]
      .map((candidate) => candidate?.trim())
      .filter((candidate): candidate is string => Boolean(candidate));

    for (const candidateSlug of tenantCandidates) {
      try {
        return await this.tenantsService.getTenantBySlug(candidateSlug);
      } catch (e) {
        // Try the next candidate before falling back to host resolution.
      }
    }

    if (hostTenant) {
      return hostTenant;
    }

    throw new BadRequestException('Tenant not provided');
  }

  /**
   * Check if email exists
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 checks per minute
  @Post('check-email')
  async checkEmail(@Req() req: Request, @Body() body: { email: string }) {
    try {
      if (!body?.email) {
        return { exists: false };
      }
      const tenantData = await this.resolveTenant(req);
      const exists = await this.customerAuthService.checkEmailExists(body.email, tenantData.id);
      return { exists };
    } catch (error: unknown) {
      this.logger.error('Error checking email existence', error instanceof Error ? error.stack : String(error));
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
  async register(@Req() req: Request, @Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tenantData = await this.resolveTenant(req);
    const result = await this.customerAuthService.registerWithEmail(registerDto, tenantData.id);

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
  async login(@Req() req: Request, @Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tenantData = await this.resolveTenant(req);
    const result = await this.customerAuthService.loginWithEmail(loginDto, tenantData.id);

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
   * Refresh access token using refresh token
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refresh attempts per minute
  @Post('refresh')
  async refresh(@Req() req: Request, @Body() body: { refresh_token?: string }, @Res({ passthrough: true }) res: Response) {
    const refreshToken = body?.refresh_token || extractCookieValue(req, 'refresh_token');
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const result = await this.customerAuthService.refreshToken(refreshToken);
    
    // Update HttpOnly cookie in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
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
    @Req() req: Request,
    @Res() res: Response, 
    @Query('returnUrl') returnUrl?: string,
    @Query('tenant') queryTenant?: string,
    @Query('state') state?: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const stateData = decodeState(state);
    const tenantData = await this.resolveTenant(req, { stateTenant: stateData.tenant, queryTenant });
    const theme: any = tenantData?.theme || {};
    const googleCfg = theme.googleOAuthConfig;
    const tenantFrontend = tenantData?.domain ? `https://${tenantData.domain}` : frontendUrl;

    if (!googleCfg?.enabled || !googleCfg.clientId || !googleCfg.clientSecret) {
      return res.status(400).json({
        message: 'Google OAuth is not configured for this tenant.',
        error: 'Not Configured',
        statusCode: 400,
      });
    }

    const clientId = googleCfg.clientId;
    // Use frontend URL as redirect URI (Google will redirect to frontend, not backend)
    const redirectUri = googleCfg.redirectUri || `${tenantFrontend}/auth/google/callback`;

    if (!redirectUri) {
      this.logger.error('Google OAuth redirect URI not configured. BACKEND_URL or GOOGLE_REDIRECT_URI must be set.');
      return res.status(500).json({
        message: 'Google OAuth redirect URI is not configured. Please set BACKEND_URL or GOOGLE_REDIRECT_URI in environment variables.',
        error: 'Configuration Error',
        statusCode: 500,
      });
    }

    // Log redirect URI for debugging (important for fixing redirect_uri_mismatch errors)
    this.logger.debug(`Google OAuth redirect URI: ${redirectUri}`);

    // Warn if using localhost in production
    if (process.env.NODE_ENV === 'production' && redirectUri.includes('localhost')) {
      this.logger.warn(`Google OAuth redirect URI contains localhost in production: ${redirectUri}`);
    }

    // Use state from query if provided, otherwise generate from returnUrl
    let stateParam = state;
    if (!stateParam) {
      const payload: any = {};
      if (returnUrl || stateData.returnUrl) payload.returnUrl = returnUrl || stateData.returnUrl;
      payload.tenant = tenantData.slug;
      stateParam = Buffer.from(JSON.stringify(payload)).toString('base64');
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

    res.redirect(googleAuthUrl);
  }

  /**
   * Google OAuth exchange endpoint (for frontend callback)
   * Frontend receives code from Google and sends it here to exchange for tokens
   */
  @Public()
  @Post('google/exchange')
  async googleExchange(
    @Req() req: Request,
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
      const stateData = decodeState(state);
      const tenantData = await this.resolveTenant(req, { stateTenant: stateData.tenant });
      const theme: any = tenantData?.theme || {};
      const googleCfg = theme.googleOAuthConfig;
      if (!googleCfg?.enabled || !googleCfg.clientId || !googleCfg.clientSecret) {
        return res.status(400).json({
          message: 'Google OAuth is not configured for this tenant',
          error: 'Not Configured',
          statusCode: 400,
        });
      }

      const { OAuth2Client } = require('google-auth-library');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const tenantFrontend = tenantData?.domain ? `https://${tenantData.domain}` : frontendUrl;
      
      // Use the SAME redirect URI as in googleRedirect method
      // This must match exactly what was sent to Google in the initial redirect
      const redirectUri = googleCfg.redirectUri || `${tenantFrontend}/auth/google/callback`;

      this.logger.debug(`Google OAuth exchange - using redirect URI: ${redirectUri}`);

      if (!googleCfg.clientId || !googleCfg.clientSecret) {
        return res.status(500).json({
          message: 'Google OAuth is not configured',
          error: 'Not Configured',
          statusCode: 500,
        });
      }

      const client = new OAuth2Client(googleCfg.clientId, googleCfg.clientSecret, redirectUri);

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
      const result = await this.customerAuthService.loginWithGoogle(idToken, googleCfg.clientId, tenantData.id);

      // Return tokens to frontend
      return res.json({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user: result.user,
        needsSmsVerification: result.needsSmsVerification,
      });
    } catch (error: any) {
      this.logger.error(`Google OAuth exchange error: ${error?.message}`, error?.stack);
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
    @Req() req: Request,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login?error=no_code`);
    }

    try {
      const stateData = decodeState(state);
      const tenantData = await this.resolveTenant(req, { stateTenant: stateData.tenant });
      const theme: any = tenantData?.theme || {};
      const googleCfg = theme.googleOAuthConfig;

      if (!googleCfg?.enabled || !googleCfg.clientId || !googleCfg.clientSecret) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login?error=not_configured`);
      }

      const { OAuth2Client } = require('google-auth-library');
      const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const hostHeader = (req.headers['x-forwarded-host'] as string) || (req.headers['host'] as string);
      const hostUrl = hostHeader ? `${protocol}://${hostHeader}` : undefined;
      const backendUrl = process.env.BACKEND_URL || process.env.API_URL || hostUrl;
      const redirectUri = googleCfg.redirectUri || 
        (backendUrl ? `${backendUrl}/api/auth/customer/google/callback` : undefined);

      if (!redirectUri) {
        this.logger.error('Google OAuth callback: redirect URI not configured. BACKEND_URL or GOOGLE_REDIRECT_URI must be set.');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        return res.redirect(`${frontendUrl}/auth/login?error=redirect_uri_not_configured`);
      }

      // Warn if using localhost in production
      if (process.env.NODE_ENV === 'production' && redirectUri.includes('localhost')) {
        this.logger.warn(`Google OAuth callback redirect URI contains localhost in production: ${redirectUri}`);
      }

      const client = new OAuth2Client(googleCfg.clientId, googleCfg.clientSecret, redirectUri);

      // Exchange code for tokens
      const { tokens: googleTokens } = await client.getToken(code);
      const idToken = googleTokens.id_token;

      if (!idToken) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login?error=no_token`);
      }

      // Login with Google
      const result = await this.customerAuthService.loginWithGoogle(idToken, googleCfg.clientId, tenantData.id);

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
          
          // Redirect to a page that will store tokens in localStorage and then redirect
          res.redirect(`${frontendUrl}/auth/oauth-callback?tokens=${encodeURIComponent(tokensParam)}&redirect=${encodeURIComponent(redirectUrl)}`);
        } else {
          // Production: Use cookies with proper domain settings
          const oauthCookieOptions = getOAuthCookieOptions(frontendUrl);

          // Short-lived handoff cookie: the frontend moves it to localStorage
          // immediately on /auth/oauth-callback.
          res.cookie('oauth_access_token', result.access_token, {
            ...oauthCookieOptions,
            httpOnly: false, // Frontend needs to read this
            maxAge: 5 * 60 * 1000, // 5 minutes - handoff only
          });

          // Refresh token must never be readable from JS: HttpOnly cookie
          // consumed by POST /refresh (same pattern as the email login flow).
          res.cookie('refresh_token', result.refresh_token, {
            ...oauthCookieOptions,
            httpOnly: true,
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
          res.redirect(oauthCallbackUrl);
        }
    } catch (error: any) {
      this.logger.error(`Google OAuth callback error: ${error?.message}`, error?.stack);
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
    @Req() req: Request,
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
          this.logger.error(`Apple token exchange failed: ${tokenResponse.status} ${error}`);
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
          this.logger.warn(`Failed to parse Apple user parameter: ${e instanceof Error ? e.message : e}`);
        }
      }

      const stateData = decodeState(stateParam);
      const tenantData = await this.resolveTenant(req, { stateTenant: stateData.tenant });

      // Login with Apple using id_token and user info
      const result = await this.customerAuthService.loginWithApple(idToken, tenantData.id, userInfo);

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
        
        // Redirect to a page that will store tokens in localStorage and then redirect
        res.redirect(`${frontendUrl}/auth/oauth-callback?tokens=${encodeURIComponent(tokensParam)}&redirect=${encodeURIComponent(redirectUrl)}`);
      } else {
        // Production: Use cookies with proper domain settings
        const oauthCookieOptions = getOAuthCookieOptions(frontendUrl);

        // Short-lived handoff cookie: the frontend moves it to localStorage
        // immediately on /auth/oauth-callback.
        res.cookie('oauth_access_token', result.access_token, {
          ...oauthCookieOptions,
          httpOnly: false, // Frontend needs to read this
          maxAge: 5 * 60 * 1000, // 5 minutes - handoff only
        });

        // Refresh token must never be readable from JS: HttpOnly cookie
        // consumed by POST /refresh (same pattern as the email login flow).
        res.cookie('refresh_token', result.refresh_token, {
          ...oauthCookieOptions,
          httpOnly: true,
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
      
      // Redirect to oauth-callback which will read cookies and store in localStorage
      res.redirect(`${frontendUrl}/auth/oauth-callback?redirect=${encodeURIComponent(redirectUrl)}`);
      }
    } catch (error: any) {
      this.logger.error(`Apple OAuth callback error: ${error?.message}`, error?.stack);
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

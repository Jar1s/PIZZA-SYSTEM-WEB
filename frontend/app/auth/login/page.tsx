'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTenant, checkEmailExists } from '@/lib/api';
import { Tenant } from '@pizza-ecosystem/shared';
import Image from 'next/image';
import { validateReturnUrl } from '@/lib/validate-return-url';
import { withTenantThemeDefaults, getTenantSlug } from '@/lib/tenant-utils';

type Step = 'email' | 'password' | 'register';

export default function CustomerLoginPage() {
  const { t } = useLanguage();
  const { register, login, loginWithGoogle } = useCustomerAuth();
  const router = useRouter();
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const tenantSlug = getTenantSlug();

        // Get tenant and returnUrl from URL params (works for all environments)
        const params = new URLSearchParams(window.location.search);
        const urlParam = params.get('returnUrl');
        if (urlParam) {
          // Validate returnUrl to prevent open redirect attacks
          const validatedUrl = validateReturnUrl(urlParam);
          if (validatedUrl) {
            setReturnUrl(validatedUrl);
            // Write validated returnUrl to sessionStorage.oauth_requested_returnUrl
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('oauth_requested_returnUrl', validatedUrl);
            }
          } else {
            console.warn('Invalid returnUrl ignored:', urlParam);
            // Clear the key if invalid
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('oauth_requested_returnUrl');
            }
          }
        }

        const tenantData = await getTenant(tenantSlug);
        setTenant(tenantData);
      } catch (error) {
        console.error('Failed to load tenant:', error);
      }
    };

    loadTenant();
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const exists = await checkEmailExists(email);
      
      if (exists) {
        setStep('password');
      } else {
        setStep('register');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check email');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await login(email, password);
      
      if (result.needsSmsVerification) {
        const verifyUrl = `/auth/verify-phone?userId=${result.userId}`;
        const currentTenant = tenant?.slug || 'pornopizza';
        // Add returnUrl to verify-phone if it exists
        const verifyParams = new URLSearchParams({ tenant: currentTenant });
        if (returnUrl) {
          verifyParams.set('returnUrl', returnUrl);
        }
        router.push(`${verifyUrl}&${verifyParams.toString()}`);
      } else {
        // Ensure user is stored in localStorage before redirect
        // The login function already does this, but we verify it here
        const storedUser = localStorage.getItem('customer_auth_user');
        const storedToken = localStorage.getItem('customer_auth_token');
        
        if (!storedUser || !storedToken) {
          console.error('Login succeeded but user data not found in localStorage');
          setError('Prihlásenie bolo úspešné, ale nepodarilo sa uložiť údaje. Skúste to znova.');
          setLoading(false);
          return;
        }
        
        // Dispatch custom event to notify context that user was just logged in
        // This helps context reload user state after redirect
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('customerAuthUpdate'));
        }
        
        // Small delay to ensure localStorage is written and event is dispatched
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to returnUrl if exists and valid, otherwise to checkout
        const validatedReturnUrl = returnUrl ? validateReturnUrl(returnUrl) : null;
        const redirectUrl = validatedReturnUrl || `/checkout?tenant=${tenant?.slug || 'pornopizza'}`;
        // Use window.location for full page reload to ensure state is loaded
        window.location.href = redirectUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Match the backend RegisterDto rule (min 8 chars) so the user gets a clear
    // message instead of a generic server validation error.
    if (password.length < 8) {
      setError('Heslo musí mať aspoň 8 znakov');
      setLoading(false);
      return;
    }

    try {
      const result = await register(email, password, name);
      
      if (result.needsSmsVerification) {
        const verifyUrl = `/auth/verify-phone?userId=${result.userId}`;
        const currentTenant = tenant?.slug || 'pornopizza';
        // Add returnUrl to verify-phone if it exists
        const verifyParams = new URLSearchParams({ tenant: currentTenant });
        if (returnUrl) {
          verifyParams.set('returnUrl', returnUrl);
        }
        router.push(`${verifyUrl}&${verifyParams.toString()}`);
      } else {
        // Redirect to returnUrl if exists and valid, otherwise to checkout
        const validatedReturnUrl = returnUrl ? validateReturnUrl(returnUrl) : null;
        const redirectUrl = validatedReturnUrl || `/checkout?tenant=${tenant?.slug || 'pornopizza'}`;
        // Use window.location for full page reload to ensure state is loaded
        window.location.href = redirectUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Pass sanitized returnUrl to loginWithGoogle
    loginWithGoogle(returnUrl || undefined);
  };

  useEffect(() => {
    if (!tenant) return;
    const layout = tenant.theme?.layout || {};
    if (layout.useCustomBackground && layout.customBackgroundClass === 'porno-bg') {
      document.body.classList.add('bg-porno-vibe');
      return () => {
        document.body.classList.remove('bg-porno-vibe');
      };
    }
  }, [tenant]);

  if (!tenant) {
    return (
      <div className="min-h-screen bg-porno-vibe flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4"
            style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="mt-4 text-lg text-white">{t.loading}</p>
        </div>
      </div>
    );
  }

  const normalizedTenant = withTenantThemeDefaults(tenant);
  if (!normalizedTenant) return null;
  const layout = normalizedTenant.theme?.layout || {};
  const isDark = layout.headerStyle === 'dark';
  const secondaryColor = normalizedTenant.theme?.secondaryColor || (isDark ? '#0f172a' : '#f8fafc');
  const primaryColor = normalizedTenant.theme?.primaryColor || '#FF6B00';
  const heroImage = normalizedTenant.theme?.heroImage;
  const isSecondaryDark = (() => {
    const hex = secondaryColor.replace('#', '');
    if (hex.length !== 6 && hex.length !== 3) return false;
    const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  })();
  
  const inputClasses = isDark
    ? 'w-full rounded-2xl px-4 py-3 bg-white/10 border border-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30'
    : 'w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400';


  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundColor: secondaryColor,
        color: isSecondaryDark ? '#fff' : '#0f172a',
        backgroundImage: heroImage ? `linear-gradient(180deg, ${secondaryColor}ee, ${secondaryColor}dd), url(${heroImage})` : undefined,
        backgroundSize: heroImage ? 'cover' : undefined,
        backgroundPosition: heroImage ? 'center' : undefined,
      }}
    >
      {/* Left: Login Form */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 ${isDark ? 'relative z-10' : ''}`}>
        <div className={`w-full max-w-md ${isDark ? 'login-card-dark' : ''}`}>
          {/* Back Button */}
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              const tenantSlug = params.get('tenant') || tenant?.slug || 'pornopizza';
              // Always redirect to main page
              router.push(`/?tenant=${tenantSlug}`);
            }}
            className={`mb-6 flex items-center gap-2 transition-colors ${
              isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">{t.back}</span>
          </button>

          {/* Logo */}
          <div className="mb-8">
            {(() => {
              const normalizedTenant = withTenantThemeDefaults(tenant);
              return normalizedTenant?.theme?.logo ? (
              <div className="mb-6">
                <Image
                    src={normalizedTenant.theme.logo}
                    alt={normalizedTenant.name}
                  width={200}
                  height={60}
                  className="h-12 w-auto mb-4"
                    unoptimized={normalizedTenant.theme.logo.includes(' ') || normalizedTenant.theme.logo.includes('%20')}
                    onError={(e) => {
                      console.error('Logo failed to load:', normalizedTenant.theme.logo);
                    }}
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">
                    {(normalizedTenant?.name || tenant.name).charAt(0).toUpperCase()}
                </span>
              </div>
              );
            })()}
            <h1 className="text-2xl font-bold">
              {t.customerLoginTitle} {withTenantThemeDefaults(tenant)?.name || tenant.name}
            </h1>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className={`w-full rounded-2xl px-4 py-3 mb-6 flex items-center justify-center gap-3 transition-colors ${
              isDark ? 'bg-white text-gray-900' : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{t.loginWithGoogle}</span>
          </button>

          {/* Separator */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-gray-300'}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${isDark ? 'bg-transparent text-gray-300' : 'bg-white text-gray-500'}`}>{t.orEnterEmail}</span>
            </div>
          </div>

          {/* Email Form */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t.yourEmail}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                  placeholder={t.emailPlaceholder}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full font-semibold py-3 rounded-2xl disabled:opacity-50 transition-colors ${
                  isDark ? 'text-white' : 'text-black'
                }`}
                style={{ backgroundColor: primaryColor, color: '#fff' }}
              >
                {loading ? t.checking : t.next}
              </button>
            </form>
          )}

          {/* Password Form (Login) */}
          {step === 'password' && (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t.password}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                  placeholder={t.passwordPlaceholder}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full font-semibold py-3 rounded-2xl disabled:opacity-50 transition-colors mb-2 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
                style={{ backgroundColor: primaryColor, color: '#fff' }}
              >
                {loading ? t.loggingIn : t.login}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className={`w-full text-sm ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
              >
                {t.back}
              </button>
            </form>
          )}

          {/* Registration Form */}
          {step === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t.name}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses}
                  placeholder={t.namePlaceholder}
                />
              </div>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t.password}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                  placeholder={t.passwordPlaceholder}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full font-semibold py-3 rounded-2xl disabled:opacity-50 transition-colors mb-2 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
                style={{ backgroundColor: primaryColor, color: '#fff' }}
              >
                {loading ? t.registering : t.register}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className={`w-full text-sm ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
              >
                {t.back}
              </button>
            </form>
          )}

          {error && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              isDark ? 'bg-red-500/10 border border-red-500/40 text-red-200' : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right: Benefits */}
      <div
        className="hidden lg:flex w-1/2 items-center justify-center p-12"
        style={{
          backgroundColor: secondaryColor,
          color: isSecondaryDark ? '#fff' : '#0f172a',
        }}
      >
        <div className="max-w-md space-y-6">
          <h2 className="text-3xl font-black mb-4" style={{ color: isSecondaryDark ? '#fff' : '#0f172a' }}>
            {t.registrationBenefits}
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎁</div>
              <div>
                <h3 className="font-semibold mb-1">{t.loyaltyProgram}</h3>
                <p className="text-sm" style={{ color: isSecondaryDark ? '#d1d5db' : '#4b5563' }}>{t.loyaltyProgramDesc}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">🛍️</div>
              <div>
                <h3 className="font-semibold mb-1">{t.fasterPayment}</h3>
                <p className="text-sm" style={{ color: isSecondaryDark ? '#d1d5db' : '#4b5563' }}>{t.fasterPaymentDesc}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">✨</div>
              <div>
                <h3 className="font-semibold mb-1">{t.additionalFeatures}</h3>
                <p className="text-sm" style={{ color: isSecondaryDark ? '#d1d5db' : '#4b5563' }}>{t.additionalFeaturesDesc}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">🕐</div>
              <div>
                <h3 className="font-semibold mb-1">{t.orderHistory}</h3>
                <p className="text-sm" style={{ color: isSecondaryDark ? '#d1d5db' : '#4b5563' }}>{t.orderHistoryDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

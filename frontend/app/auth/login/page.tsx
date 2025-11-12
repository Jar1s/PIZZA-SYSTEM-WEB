'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTenant, checkEmailExists } from '@/lib/api';
import { Tenant } from '@/shared';
import Image from 'next/image';

type Step = 'email' | 'password' | 'register';

export default function CustomerLoginPage() {
  const { t } = useLanguage();
  const { register, login, loginWithGoogle, loginWithApple } = useCustomerAuth();
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
        const hostname = window.location.hostname;
        let tenantSlug = 'pornopizza';
        
        if (hostname.includes('pornopizza')) {
          tenantSlug = 'pornopizza';
        } else if (hostname.includes('pizzavnudzi')) {
          tenantSlug = 'pizzavnudzi';
        } else if (hostname.includes('localhost')) {
          const params = new URLSearchParams(window.location.search);
          tenantSlug = params.get('tenant') || 'pornopizza';
          const url = params.get('returnUrl');
          if (url) {
            setReturnUrl(url);
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
        // Always add tenant to verify URL, redirect to checkout after verification
        const currentTenant = tenant?.slug || 'pornopizza';
        router.push(`${verifyUrl}&tenant=${currentTenant}`);
      } else {
        // Always redirect to checkout after successful login
        const currentTenant = tenant?.slug || 'pornopizza';
        // Use window.location for full page reload to ensure state is loaded
        window.location.href = `/checkout?tenant=${currentTenant}`;
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
    
    try {
      const result = await register(email, password, name);
      
      if (result.needsSmsVerification) {
        const verifyUrl = `/auth/verify-phone?userId=${result.userId}`;
        // Always add tenant to verify URL, redirect to checkout after verification
        const currentTenant = tenant?.slug || 'pornopizza';
        router.push(`${verifyUrl}&tenant=${currentTenant}`);
      } else {
        // Always redirect to checkout after successful login
        const currentTenant = tenant?.slug || 'pornopizza';
        // Use window.location for full page reload to ensure state is loaded
        window.location.href = `/checkout?tenant=${currentTenant}`;
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const handleAppleLogin = () => {
    loginWithApple();
  };

  if (!tenant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">{t.loading}</div>
        </div>
      </div>
    );
  }

  const primaryColor = tenant.theme?.primaryColor || '#FFD700';
  const isPornopizza = tenant.slug === 'pornopizza' || tenant.subdomain === 'pornopizza';

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            {tenant.theme?.logo ? (
              <div className="mb-6">
                <Image
                  src={tenant.theme.logo}
                  alt={tenant.name}
                  width={200}
                  height={60}
                  className="h-12 w-auto mb-4"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">
                  {tenant.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h1 className="text-2xl font-bold">
              {t.customerLoginTitle} {tenant.name}
            </h1>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center font-bold text-sm">
              G
            </div>
            <span>{t.loginWithGoogle}</span>
          </button>

          {/* Apple Login */}
          <button
            onClick={handleAppleLogin}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span>{t.loginWithApple}</span>
          </button>

          {/* Separator */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t.orEnterEmail}</span>
            </div>
          </div>

          {/* Email Form */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.yourEmail}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder={t.emailPlaceholder}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full text-black font-semibold py-3 rounded-lg disabled:opacity-50 transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? t.checking : t.next}
              </button>
            </form>
          )}

          {/* Password Form (Login) */}
          {step === 'password' && (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.password}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder={t.passwordPlaceholder}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full text-black font-semibold py-3 rounded-lg disabled:opacity-50 transition-colors mb-2"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? t.loggingIn : t.login}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                {t.back}
              </button>
            </form>
          )}

          {/* Registration Form */}
          {step === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.name}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder={t.namePlaceholder}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.password}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder={t.passwordPlaceholder}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full text-black font-semibold py-3 rounded-lg disabled:opacity-50 transition-colors mb-2"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? t.registering : t.register}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                {t.back}
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right: Benefits */}
      <div className="hidden lg:flex w-1/2 bg-gray-50 items-center justify-center p-12">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-8">{t.registrationBenefits}</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎁</div>
              <div>
                <h3 className="font-semibold mb-1">{t.loyaltyProgram}</h3>
                <p className="text-gray-600 text-sm">{t.loyaltyProgramDesc}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">🛍️</div>
              <div>
                <h3 className="font-semibold mb-1">{t.fasterPayment}</h3>
                <p className="text-gray-600 text-sm">{t.fasterPaymentDesc}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">✨</div>
              <div>
                <h3 className="font-semibold mb-1">{t.additionalFeatures}</h3>
                <p className="text-gray-600 text-sm">{t.additionalFeaturesDesc}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">🕐</div>
              <div>
                <h3 className="font-semibold mb-1">{t.orderHistory}</h3>
                <p className="text-gray-600 text-sm">{t.orderHistoryDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sendCustomerSmsCode } from '@/lib/api';
import { validateReturnUrl } from '@/lib/validate-return-url';

export default function VerifyPhonePage() {
  const { t } = useLanguage();
  const { verifyPhone } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const returnUrl = searchParams.get('returnUrl');
  
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (!userId) {
      router.push('/auth/login');
    }
  }, [userId, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone || !userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await sendCustomerSmsCode(phone, userId);
      setCodeSent(true);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send SMS code');
    } finally {
      setLoading(false);
    }
  };

  // Get tenant from URL for redirect after verification
  const getTenantFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tenant') || 'pornopizza';
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !phone || !userId) return;

    setLoading(true);
    setError(null);

    try {
      await verifyPhone(phone, code, userId);
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      // Decode returnUrl if it's encoded
      let finalReturnUrl = returnUrl;
      if (returnUrl) {
        try {
          finalReturnUrl = decodeURIComponent(returnUrl);
        } catch (e) {
          // If decoding fails, use original
          finalReturnUrl = returnUrl;
        }
      }
      // Validate returnUrl to prevent open redirect attacks
      const validatedReturnUrl = finalReturnUrl ? validateReturnUrl(finalReturnUrl) : null;
      // Redirect to returnUrl if exists and valid, otherwise to account page (not checkout)
      const tenant = getTenantFromUrl();
      const redirectUrl = validatedReturnUrl || `/account?tenant=${tenant}`;
      console.log('SMS verification successful - redirecting to:', redirectUrl);
      // Clear any OAuth redirect flags that might interfere
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('oauth_redirect');
      }
      // Use window.location for full page reload to ensure state is loaded
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message || 'Invalid SMS code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await handleSendCode();
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Orange Banner */}
        <div className="bg-orange-500 text-white text-center py-3 mb-8 rounded-t-lg">
          <h2 className="font-bold text-lg">{t.completeRegistration}</h2>
        </div>

        {/* Main Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          {/* Phone Icon */}
          <div className="text-center mb-6">
            <div className="text-8xl mb-4">📱</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.phone}</h1>
            <p className="text-gray-600">{t.phoneDescription}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                {error}
              </div>
            )}

            {!codeSent ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.phoneNumber}
                </label>
                <div className="flex gap-2">
                  <select 
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    defaultValue="+421"
                  >
                    <option value="+421">🇸🇰 +421</option>
                  </select>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder={t.phonePlaceholder}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || !phone}
                  className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {loading ? t.sending : t.sendCode}
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.enterCode}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="000000"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  {t.codeSentTo} {phone}
                </p>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {loading ? t.verifying : t.verify}
                </button>
                {countdown > 0 ? (
                  <p className="text-sm text-center text-gray-500 mt-2">
                    {t.resendCodeIn} {countdown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium mt-2"
                  >
                    {t.resendCode}
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}


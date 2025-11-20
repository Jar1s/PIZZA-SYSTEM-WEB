'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useToastContext } from '@/contexts/ToastContext';

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToastContext();
  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Chýba token. Skontrolujte odkaz v emaili.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Chýba token. Skontrolujte odkaz v emaili.');
      return;
    }

    if (password.length < 6) {
      setError('Heslo musí mať aspoň 6 znakov');
      return;
    }

    if (password !== confirmPassword) {
      setError('Heslá sa nezhodujú');
      return;
    }

    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/auth/customer/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Nepodarilo sa nastaviť heslo');
      }

      // Save tokens
      if (data.access_token) {
        localStorage.setItem('customer_auth_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('customer_refresh_token', data.refresh_token);
      }
      if (data.user) {
        localStorage.setItem('customer_auth_user', JSON.stringify(data.user));
      }

      toast.success('Heslo bolo úspešne nastavené!');
      
      // Redirect to account page
      setTimeout(() => {
        router.push('/account');
      }, 1500);
    } catch (error: any) {
      console.error('Set password error:', error);
      const errorMessage = error.message || 'Nepodarilo sa nastaviť heslo. Skúste to znova.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Nastavte si heslo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Váš účet bol vytvorený. Nastavte si heslo pre prihlásenie.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nové heslo
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Zadajte heslo (min. 6 znakov)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Potvrďte heslo
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Zadajte heslo znova"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !token}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading ? 'Nastavujem...' : 'Nastaviť heslo'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Po nastavení hesla budete automaticky prihlásení a presmerovaní na stránku účtu.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


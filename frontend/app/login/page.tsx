'use client';

import React, { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to admin if already logged in (but check logout flag first)
  useEffect(() => {
    if (!authLoading) {
      const loggedOut = sessionStorage.getItem('admin_logged_out');
      // Only redirect if user is logged in AND not explicitly logged out
      if (user && loggedOut !== 'true') {
        router.push('/admin');
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(username, password);
      // Clear logout flag and wait for state update
      sessionStorage.removeItem('admin_logged_out');
      // Use replace to prevent back navigation to login
      setTimeout(() => {
        window.location.href = '/admin';
      }, 200);
    } catch (err: any) {
      const message = String(err?.message || '');
      setError(
        /401|unauthori|invalid|credential|nesprávn/i.test(message)
          ? 'Nesprávne meno alebo heslo.'
          : message || 'Prihlásenie zlyhalo. Skús to znova.',
      );
      setLoading(false);
    }
  };

  const inputClass =
    'mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[15px] text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10';

  return (
    // relative + z-index: the storefront paints a fixed gradient overlay on
    // <body> for the PornoPizza domain – this page must sit above it and paint
    // its own ground, the same way the admin shell does.
    <div
      className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-zinc-950"
      // --color-primary drives the global focus outline; the admin is brand-neutral.
      style={{ backgroundColor: '#111827', ['--color-primary' as string]: '#09090b' } as React.CSSProperties}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(255,255,255,0.08), transparent 70%), linear-gradient(180deg, #111827 0%, #0B0F19 100%)',
        }}
      />

      <div className="relative w-full max-w-[400px]">
        <div className="mb-6 text-center text-white">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-gray-400">Administrácia</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Pizza HQ</h1>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] sm:p-7">
          <h2 className="text-lg font-black tracking-tight">Prihlásenie</h2>
          <p className="mt-0.5 text-sm text-zinc-500">Prístup majú len administrátori a operátori.</p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Používateľské meno
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="meno"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Heslo
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-20`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 mt-[3px] -translate-y-1/2 rounded-lg px-2 py-1 text-[12px] font-bold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Skryť' : 'Zobraziť'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Prihlasujem…' : 'Prihlásiť sa'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[12px] text-gray-500">
          © {new Date().getFullYear()} Pizza HQ · interný systém
        </p>
      </div>
    </div>
  );
}

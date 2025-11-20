'use client';

import { Tenant } from '@pizza-ecosystem/shared';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';
import { PornoPizzaLogo } from './PornoPizzaLogo';

interface HeaderProps {
  tenant: Tenant;
}

export function Header({ tenant }: HeaderProps) {
  const { items, openCart } = useCart();
  const { t } = useLanguage();
  const { user } = useCustomerAuth();
  const router = useRouter();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Get tenant from URL or use prop
  const getTenantSlug = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tenant') || tenant.slug || 'pornopizza';
    }
    return tenant.slug || 'pornopizza';
  };

  const tenantSlug = getTenantSlug();

  // Get layout config from tenant theme (replaces hardcoded isPornopizza)
  const layout = tenant.theme?.layout || {};
  const headerStyle = layout.headerStyle || 'light';
  const useCustomLogo = layout.useCustomLogo || false;
  const customLogoComponent = layout.customLogoComponent || '';
  const isDarkTheme = headerStyle === 'dark';

  const navItems = [
    { id: 'hero', label: t.home },
    { id: 'menu', label: t.menu },
  ];

  const scrollToSection = (targetId: string) => {
    if (typeof window === 'undefined') return;

    if (targetId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const section = document.getElementById(targetId);
    if (section) {
      const headerOffset = 80;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: sectionTop - headerOffset,
        behavior: 'smooth',
      });
    }
  };

  const headerClasses = isDarkTheme
    ? 'bg-black/70 border-white/10 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl supports-[backdrop-filter]:bg-black/50'
    : 'bg-white/90 border-gray-100 text-gray-900 backdrop-blur supports-[backdrop-filter]:bg-white/70';

  return (
    <header
      className={`site-header sticky top-0 z-50 border-b relative overflow-hidden ${headerClasses}`}
    >
      {isDarkTheme && (
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-primary)]/70 to-transparent" />
        </div>
      )}
      <div className="mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-4 min-w-0">
          {useCustomLogo && customLogoComponent === 'PornoPizzaLogo' ? (
            <PornoPizzaLogo className="h-12 w-auto max-w-[180px]" width={180} height={48} />
          ) : tenant.theme.logo ? (
            <Image
              src={tenant.theme.logo}
              alt={tenant.name}
              width={200}
              height={60}
              className="h-10 w-auto"
              priority
            />
          ) : (
            <h1
              className={`truncate text-xl font-semibold ${
                isDarkTheme ? 'text-[#ff9900]' : 'text-[var(--color-primary)]'
              }`}
            >
              {tenant.name}
            </h1>
          )}

          <nav className="hidden lg:flex items-center gap-4 text-sm font-semibold">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`group relative px-3 py-1 rounded-full transition-colors ${
                  isDarkTheme
                    ? 'text-gray-300 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-label={item.label}
              >
                {isDarkTheme && (
                  <span className="pointer-events-none absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden />
                )}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          {user ? (
            <button
              type="button"
              onClick={() => router.push(`/account?tenant=${tenantSlug}`)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                isDarkTheme
                  ? 'border-[#2c2c2c] text-white hover:bg-[#1c1c1c]'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              title={t.myAccount || 'Moje konto'}
              aria-label={t.myAccount || 'Moje konto'}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const returnUrl = `/account?tenant=${tenantSlug}`;
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('oauth_requested_returnUrl', returnUrl);
                }
                router.push(`/auth/login?tenant=${tenantSlug}&returnUrl=${encodeURIComponent(returnUrl)}`);
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                isDarkTheme
                  ? 'border-[#2c2c2c] text-white hover:bg-[#1c1c1c]'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              title={t.customerLogin || 'Prihlásiť sa'}
              aria-label={t.customerLogin || 'Prihlásiť sa'}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              console.log('🛒 Cart button clicked, calling openCart()');
              openCart();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            className={`relative z-50 flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-white transition-colors shadow-lg ${
              isDarkTheme
                ? 'bg-gradient-to-r from-[#ff5e00] via-[#ff0066] to-[#ff2d55] hover:brightness-110'
                : 'bg-red-600 hover:bg-red-700'
            }`}
            aria-label={t.cart}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="hidden sm:inline">{t.cart}</span>
            {itemCount > 0 && (
              <span className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
                isDarkTheme ? 'bg-white/20 border border-white/40 backdrop-blur' : 'bg-red-600'
              }`}>
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

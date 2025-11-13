'use client';

import { Tenant } from '@/shared';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  tenant: Tenant;
}

export function Header({ tenant }: HeaderProps) {
  const { items, openCart, isOpen } = useCart();
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
  
  // Check if PornoPizza for skin tone background - use tenant data directly
  const isPornopizza = tenant.slug === 'pornopizza' || tenant.subdomain === 'pornopizza' || tenant.name?.toLowerCase().includes('pornopizza');
  
  const headerClass = isPornopizza ? 'bg-skin-tone relative' : 'bg-white';
  
  return (
    <header 
      className={`sticky top-0 z-[100] shadow-md ${headerClass}`}
      style={{ position: 'sticky', zIndex: 100 }}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between relative" style={{ zIndex: 100 }}>
        <div className="flex items-center gap-4">
          {tenant.theme.logo && (
            <Image
              src={tenant.theme.logo}
              alt={tenant.name}
              width={200}
              height={60}
              className="h-10 w-auto"
            />
          )}
          {!tenant.theme.logo && (
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {tenant.name}
            </h1>
          )}
        </div>
        
        <div className="flex items-center gap-4 relative z-50">
          <LanguageSwitcher />
          
          {/* User Account Button */}
          {user ? (
            <button
              onClick={() => {
                router.push(`/account?tenant=${tenantSlug}`);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:opacity-90 cursor-pointer bg-white border border-gray-200"
              style={{ 
                zIndex: 1000,
                position: 'relative',
                pointerEvents: 'auto'
              }}
              title="Moje konto"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#333' }}
              >
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
              onClick={() => {
                const returnUrl = `/account?tenant=${tenantSlug}`;
                // Store returnUrl in sessionStorage.oauth_requested_returnUrl BEFORE pushing
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('oauth_requested_returnUrl', returnUrl);
                }
                router.push(`/auth/login?tenant=${tenantSlug}&returnUrl=${encodeURIComponent(returnUrl)}`);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:opacity-90 cursor-pointer bg-white border border-gray-200"
              style={{ 
                zIndex: 1000,
                position: 'relative',
                pointerEvents: 'auto'
              }}
              title="Prihlásiť sa"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#333' }}
              >
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Cart button clicked, isOpen before:', isOpen);
              openCart();
              console.log('openCart called');
            }}
            className="relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:opacity-90 cursor-pointer"
            style={{ 
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              zIndex: 1000,
              position: 'relative',
              pointerEvents: 'auto'
            }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="font-semibold">{t.cart}</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}



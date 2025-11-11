'use client';

import { Tenant } from '@/shared';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  tenant: Tenant;
}

export function Header({ tenant }: HeaderProps) {
  const { items, openCart, isOpen } = useCart();
  const { t } = useLanguage();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
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



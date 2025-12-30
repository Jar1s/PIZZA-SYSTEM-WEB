'use client';

import { usePathname } from 'next/navigation';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  
  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname === '/admin/orders') return 'Orders';
    if (pathname === '/admin/products') return 'Products';
    if (pathname === '/admin/brands') return 'Brands';
    if (pathname === '/admin/analytics') return 'Analytics';
    if (pathname === '/admin/customers') return 'Customers';
    return 'Admin';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex-shrink-0 z-10" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-1 flex-shrink-0"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <h2 className="text-base lg:text-lg font-semibold text-gray-900 truncate" style={{ color: '#111827' }}>{getPageTitle()}</h2>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
          <div className="hidden sm:block text-sm text-gray-500 whitespace-nowrap" style={{ color: '#6b7280' }}>
            {new Date().toLocaleDateString('sk-SK', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { TenantSelector } from './TenantSelector';

interface HeaderProps {
  selectedTenant: 'all' | string;
  onTenantChange: (tenant: 'all' | string) => void;
}

export function Header({ selectedTenant, onTenantChange }: HeaderProps) {
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
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0 z-10" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900" style={{ color: '#111827' }}>{getPageTitle()}</h2>
        <div className="flex items-center gap-4">
          <TenantSelector 
            selectedTenant={selectedTenant} 
            onTenantChange={onTenantChange} 
          />
          <div className="text-sm text-gray-500" style={{ color: '#6b7280' }}>
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


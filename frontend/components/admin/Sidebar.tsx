'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  
  // Base links available to all users
  const baseLinks = [
    { href: '/admin', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'OPERATOR'] },
    { href: '/admin/orders', label: 'Orders', icon: '🍕', roles: ['ADMIN', 'OPERATOR'] },
  ];

  // Admin-only links
  const adminLinks = [
    { href: '/admin/products', label: 'Products', icon: '📦', roles: ['ADMIN'] },
    { href: '/admin/brands', label: 'Brands', icon: '🏢', roles: ['ADMIN'] },
    { href: '/admin/customers', label: 'Customers', icon: '👥', roles: ['ADMIN'] },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈', roles: ['ADMIN'] },
  ];

  // Filter links based on user role
  const allLinks = [...baseLinks, ...adminLinks];
  const visibleLinks = allLinks.filter(link => 
    !user || link.roles.includes(user.role)
  );
  
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl lg:text-2xl font-bold">Pizza HQ</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white p-1"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {user && (
          <div className="mt-2 text-sm text-gray-400">
            <div>{user.name}</div>
            <div className="text-xs mt-1">
              {user.role === 'ADMIN' ? '👑 Admin' : '👤 Operator'}
            </div>
          </div>
        )}
      </div>
      
      <nav className="mt-4 lg:mt-6 flex-1 overflow-y-auto">
        {visibleLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={`block px-4 lg:px-6 py-2 lg:py-3 hover:bg-gray-800 transition-colors ${
              pathname === link.href ? 'bg-gray-800 border-l-4 border-orange-500' : ''
            }`}
          >
            <span className="mr-3">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Logout button */}
      {user && (
        <div className="p-4 lg:p-6 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}


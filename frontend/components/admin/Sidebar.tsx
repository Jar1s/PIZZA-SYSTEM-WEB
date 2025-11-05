'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  
  const links = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/orders', label: 'Orders', icon: '🍕' },
    { href: '/admin/products', label: 'Products', icon: '📦' },
    { href: '/admin/brands', label: 'Brands', icon: '🏢' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  ];
  
  return (
    <div className="w-64 bg-gray-900 text-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Pizza HQ</h1>
      </div>
      
      <nav className="mt-6">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-6 py-3 hover:bg-gray-800 ${
              pathname === link.href ? 'bg-gray-800 border-l-4 border-orange-500' : ''
            }`}
          >
            <span className="mr-3">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}


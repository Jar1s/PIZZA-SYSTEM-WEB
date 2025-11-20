'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { getTenantSlug } from '@/lib/tenant-utils';
import { AdminContextProvider } from '@/app/admin/admin-context';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedTenant, setSelectedTenant] = useState<'all' | string>(() => getTenantSlug());

  useEffect(() => {
    // Check if user explicitly logged out
    const loggedOut = sessionStorage.getItem('admin_logged_out');
    
    // If not loading and no user (or logged out), redirect to login
    if (!loading) {
      if (!user || loggedOut === 'true') {
        router.push('/login');
        return;
      }
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user or logged out, don't render admin layout
  const loggedOut = sessionStorage.getItem('admin_logged_out');
  if (!user || loggedOut === 'true') {
    return null;
  }

  return (
    <AdminContextProvider selectedTenant={selectedTenant}>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            selectedTenant={selectedTenant} 
            onTenantChange={setSelectedTenant} 
          />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </AdminContextProvider>
  );
}


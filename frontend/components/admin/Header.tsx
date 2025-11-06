'use client';

import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('sk-SK', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">
                  {user.role === 'ADMIN' ? '👑 Admin' : '👤 Operator'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


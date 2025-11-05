'use client';

export function Header() {
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
          
          <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Admin User
          </button>
        </div>
      </div>
    </header>
  );
}


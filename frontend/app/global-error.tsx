'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="sk">
      <body style={{ background: '#0a0a0a', margin: 0, padding: 0 }}>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="card-sexy rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 
              className="text-3xl font-black mb-4"
              style={{ 
                color: '#DC143C',
                textShadow: '0 0 20px rgba(220, 20, 60, 0.5)',
                letterSpacing: '-0.02em'
              }}
            >
              Something went wrong!
            </h2>
            <p className="mb-6" style={{ color: '#b0b0b0' }}>
              {error.message || 'An unexpected error occurred'}
            </p>
            {error.digest && (
              <p className="mb-4 text-xs" style={{ color: '#808080' }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={() => reset()}
              className="btn-sexy px-6 py-3 text-white rounded-xl font-black uppercase transition-all"
              style={{ 
                background: 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)',
                boxShadow: '0 4px 15px rgba(220, 20, 60, 0.4)',
                letterSpacing: '0.1em'
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}


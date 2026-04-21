'use client';

import { useEffect, useState } from 'react';

export default function TestSentryPage() {
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    const testSentry = async () => {
      const newResults: string[] = [];
      
      // Check if Sentry is initialized
      if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
        newResults.push('❌ NEXT_PUBLIC_SENTRY_DSN not set');
        setResults(newResults);
        return;
      }

      newResults.push('✅ Sentry DSN configured');
      newResults.push(`📊 DSN: ${process.env.NEXT_PUBLIC_SENTRY_DSN.substring(0, 50)}...`);
      newResults.push('⚠️ Sentry client import is currently disabled in this build.');
      newResults.push('ℹ️ This page now only verifies env wiring.');
      setResults(newResults);
    };

    testSentry();
  }, []);

  const triggerError = () => {
    throw new Error('Manual test error triggered by button click');
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Sentry Test Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="font-mono text-sm">
                {result}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Manual Test:</h2>
          <button
            onClick={triggerError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Trigger Error (will be caught by error boundary)
          </button>
        </div>
      </div>
    </div>
  );
}






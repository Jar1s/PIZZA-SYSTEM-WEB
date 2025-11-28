'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Component, ReactNode, useEffect } from 'react';

// Hook to suppress Vercel Analytics/Speed Insights console warnings
// These are non-critical and often blocked by adblockers
function useSuppressVercelWarnings() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Suppress Vercel Analytics warnings
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (
        message.includes('Vercel') && 
        (message.includes('Analytics') || message.includes('Speed Insights') || 
         message.includes('insights/script.js') || message.includes('speed-insights/script.js'))
      ) {
        // Silently ignore Vercel Analytics warnings
        return;
      }
      originalError.apply(console, args);
    };
    
    // Suppress Vercel Analytics warnings in console.warn too
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (
        message.includes('Vercel') && 
        (message.includes('Analytics') || message.includes('Speed Insights') || 
         message.includes('insights/script.js') || message.includes('speed-insights/script.js'))
      ) {
        // Silently ignore Vercel Analytics warnings
        return;
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
}

// Simple Error Boundary for Analytics
class AnalyticsErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Silently catch errors - don't block page load
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Silently fail - don't log to avoid console noise
    // Analytics failures shouldn't break the site
  }

  render() {
    if (this.state.hasError) {
      // Silently fail - return null so page still loads
      return null;
    }

    return this.props.children;
  }
}

export function SafeAnalytics() {
  // Suppress Vercel Analytics warnings
  useSuppressVercelWarnings();
  
  // Wrap Analytics and SpeedInsights in ErrorBoundary to prevent blocking
  // if they fail to load (e.g., blocked by adblocker)
  return (
    <AnalyticsErrorBoundary>
      <Analytics />
      <SpeedInsights />
    </AnalyticsErrorBoundary>
  );
}


'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Component, ReactNode } from 'react';

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
    // Log error but don't throw - analytics failures shouldn't break the site
    console.warn('Analytics failed to load (possibly blocked by adblocker):', error);
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
  // Wrap Analytics and SpeedInsights in ErrorBoundary to prevent blocking
  // if they fail to load (e.g., blocked by adblocker)
  return (
    <AnalyticsErrorBoundary>
      <Analytics />
      <SpeedInsights />
    </AnalyticsErrorBoundary>
  );
}


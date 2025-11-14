'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CookieSettings {
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_SETTINGS: CookieSettings = {
  necessary: true,
  analytics: false,
  marketing: false,
};

/**
 * Get current user ID from localStorage (customer or admin)
 */
function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try customer auth first
  const customerUser = localStorage.getItem('customer_auth_user');
  if (customerUser) {
    try {
      const user = JSON.parse(customerUser);
      return user.id || null;
    } catch {
      // Ignore parse errors
    }
  }
  
  // Try admin auth
  const adminUser = localStorage.getItem('auth_user');
  if (adminUser) {
    try {
      const user = JSON.parse(adminUser);
      return user.id || null;
    } catch {
      // Ignore parse errors
    }
  }
  
  return null;
}

/**
 * Get storage key for cookie settings (per user)
 */
function getCookieStorageKey(key: string): string {
  const userId = getCurrentUserId();
  if (userId) {
    return `${key}_${userId}`;
  }
  // Fallback to global if no user
  return key;
}

/**
 * Hook for managing cookie settings
 * Reads from localStorage and provides methods to update settings
 * Settings are stored per user to avoid conflicts between different accounts
 */
export function useCookieSettings() {
  const [settings, setSettings] = useState<CookieSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Load settings from localStorage on mount and when user changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const currentUserId = getCurrentUserId();
      setUserId(currentUserId);

      const analyticsKey = getCookieStorageKey('cookie_analytics');
      const marketingKey = getCookieStorageKey('cookie_marketing');
      
      const analytics = localStorage.getItem(analyticsKey) === 'true';
      const marketing = localStorage.getItem(marketingKey) === 'true';

      setSettings({
        necessary: true, // Always true
        analytics,
        marketing,
      });
    } catch (error) {
      console.error('Failed to load cookie settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Reload settings when user changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return;

    const reloadSettings = () => {
      const currentUserId = getCurrentUserId();
      
      // If user changed, reload settings
      if (currentUserId !== userId) {
        const analyticsKey = getCookieStorageKey('cookie_analytics');
        const marketingKey = getCookieStorageKey('cookie_marketing');
        
        const analytics = localStorage.getItem(analyticsKey) === 'true';
        const marketing = localStorage.getItem(marketingKey) === 'true';

        setSettings({
          necessary: true,
          analytics,
          marketing,
        });
        setUserId(currentUserId);
      }
    };

    // Initial check
    reloadSettings();

    // Listen for localStorage changes (user login/logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customer_auth_user' || e.key === 'auth_user') {
        // Delay to ensure localStorage is fully updated
        setTimeout(reloadSettings, 200);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Poll for user changes (since storage event doesn't fire for same-tab changes)
    // Check more frequently to catch new logins
    const interval = setInterval(reloadSettings, 300);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isLoaded, userId]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<CookieSettings>) => {
    if (typeof window === 'undefined') return;

    try {
      const updated = {
        ...settings,
        ...newSettings,
        necessary: true, // Always true
      };

      const analyticsKey = getCookieStorageKey('cookie_analytics');
      const marketingKey = getCookieStorageKey('cookie_marketing');

      localStorage.setItem(analyticsKey, String(updated.analytics));
      localStorage.setItem(marketingKey, String(updated.marketing));

      setSettings(updated);
    } catch (error) {
      console.error('Failed to update cookie settings:', error);
    }
  }, [settings]);

  // Check if analytics cookies are allowed
  const isAnalyticsAllowed = useCallback(() => {
    return settings.analytics;
  }, [settings.analytics]);

  // Check if marketing cookies are allowed
  const isMarketingAllowed = useCallback(() => {
    return settings.marketing;
  }, [settings.marketing]);

  return {
    settings,
    isLoaded,
    updateSettings,
    isAnalyticsAllowed,
    isMarketingAllowed,
  };
}


'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Language, translations } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.sk;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to Slovak for SSR, will be updated on client mount
  const [language, setLanguageState] = useState<Language>('sk');
  const [isMounted, setIsMounted] = useState(false);

  // Load language from localStorage on mount (client-side only)
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'sk' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []); // Empty dependency array - only run once on mount

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Use current language to get translations
  // During SSR, use Slovak as default to avoid hydration mismatch
  const t = useMemo(() => {
    return translations[isMounted ? language : 'sk'];
  }, [isMounted, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}


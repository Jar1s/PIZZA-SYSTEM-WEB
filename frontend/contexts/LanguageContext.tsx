'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.sk;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to Slovak, but check localStorage immediately
  const getInitialLanguage = (): Language => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language') as Language;
      if (saved && (saved === 'sk' || saved === 'en')) {
        return saved;
      }
    }
    return 'sk';
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Load language from localStorage on mount (for SSR compatibility)
  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'sk' || saved === 'en')) {
      if (saved !== language) {
        setLanguageState(saved);
      }
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Use current language to get translations
  const t = translations[language];

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


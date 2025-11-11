'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/translations';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 border-2 border-gray-200">
      <button
        onClick={() => setLanguage('sk')}
        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
          language === 'sk'
            ? 'text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
        style={language === 'sk' ? { backgroundColor: 'var(--color-primary)' } : {}}
      >
        SK
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
          language === 'en'
            ? 'text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
        style={language === 'en' ? { backgroundColor: 'var(--color-primary)' } : {}}
      >
        EN
      </button>
    </div>
  );
}


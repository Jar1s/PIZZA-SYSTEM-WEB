'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/translations';
import { useTenant } from '@/contexts/TenantContext';
import { isDarkTheme } from '@/lib/tenant-utils';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { tenant } = useTenant();
  const isDark = isDarkTheme(tenant);

  const activeClass = isDark
    ? 'bg-gradient-to-r from-[#ff5e00] via-[#ff0066] to-[#ff2d55] text-white shadow-lg'
    : 'bg-[var(--color-primary)] text-white shadow';

  return (
    <div 
      className={`flex items-center gap-1 rounded-full p-1 border ${
        isDark ? 'bg-white/5 border-white/15' : 'bg-white border-gray-200'
      }`}
    >
      <button
        onClick={() => setLanguage('sk')}
        className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
          language === 'sk'
            ? activeClass
            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:bg-gray-200'
        }`}
      >
        SK
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
          language === 'en'
            ? activeClass
            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:bg-gray-200'
        }`}
      >
        EN
      </button>
    </div>
  );
}

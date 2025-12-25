'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/translations';
import { useTenant } from '@/contexts/TenantContext';
import { isDarkTheme } from '@/lib/tenant-utils';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { tenant } = useTenant();
  const isDark = isDarkTheme(tenant);
  const primary = tenant?.theme?.primaryColor || 'var(--color-primary)';
  const secondary = tenant?.theme?.secondaryColor || 'transparent';

  return (
    <div 
      className={`flex items-center gap-1 rounded-full p-1 border ${
        isDark ? 'bg-white/5 border-white/15' : 'bg-white'
      }`}
      style={{ borderColor: isDark ? undefined : secondary }}
    >
      <button
        onClick={() => setLanguage('sk')}
        className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
          language === 'sk'
            ? 'text-white shadow'
            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:bg-gray-200'
        }`}
        style={language === 'sk' ? { backgroundColor: primary } : { backgroundColor: 'transparent' }}
      >
        SK
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
          language === 'en'
            ? 'text-white shadow'
            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:bg-gray-200'
        }`}
        style={language === 'en' ? { backgroundColor: primary } : { backgroundColor: 'transparent' }}
      >
        EN
      </button>
    </div>
  );
}

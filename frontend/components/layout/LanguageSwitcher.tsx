'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/translations';
import { useTenant } from '@/contexts/TenantContext';
import { isDarkTheme, withTenantThemeDefaults } from '@/lib/tenant-utils';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { tenant } = useTenant();
  const normalizedTenant = withTenantThemeDefaults(tenant);
  const isDark = isDarkTheme(normalizedTenant);

  const primaryColor = normalizedTenant?.theme?.primaryColor || 'var(--color-primary)';

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
            ? 'text-white shadow'
            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:bg-gray-200'
        }`}
        style={language === 'sk' ? { backgroundColor: primaryColor } : undefined}
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
        style={language === 'en' ? { backgroundColor: primaryColor } : undefined}
      >
        EN
      </button>
    </div>
  );
}

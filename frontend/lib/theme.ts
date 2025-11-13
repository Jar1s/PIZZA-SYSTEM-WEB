import { TenantTheme } from '@/shared';

export function applyTheme(theme: TenantTheme) {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primaryColor);
  root.style.setProperty('--color-secondary', theme.secondaryColor);
  root.style.setProperty('--font-family', theme.fontFamily);
}














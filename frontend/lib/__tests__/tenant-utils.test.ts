import { describe, it, expect } from 'vitest';
import {
  isDarkTheme,
  getBackgroundClass,
  getSectionShellClass,
  getButtonGradientClass,
  getButtonStyle,
  withTenantThemeDefaults,
} from '../tenant-utils';
import { Tenant } from '@pizza-ecosystem/shared';

describe('tenant-utils', () => {
  const mockPornopizzaTenant: Tenant = {
    id: '1',
    slug: 'pornopizza',
    name: 'PornoPizza',
    theme: {
      primaryColor: '#FF6B00',
      secondaryColor: '#FF0066',
      layout: {
        headerStyle: 'dark',
        backgroundStyle: 'black',
        useCustomLogo: true,
        customLogoComponent: 'PornoPizzaLogo',
        useCustomBackground: true,
        customBackgroundClass: 'porno-bg',
      },
    },
  };

  const mockLightTenant: Tenant = {
    id: '2',
    slug: 'pizzavnudzi',
    name: 'Pizza v Núdzi',
    theme: {
      primaryColor: '#DC143C',
      layout: {
        headerStyle: 'light',
        backgroundStyle: 'white',
        useCustomLogo: false,
      },
    },
  };

  describe('isDarkTheme', () => {
    it('should return true for PornoPizza dark theme', () => {
      expect(isDarkTheme(mockPornopizzaTenant)).toBe(true);
    });

    it('should return false for light theme tenant', () => {
      expect(isDarkTheme(mockLightTenant)).toBe(false);
    });

    it('should return false for null tenant', () => {
      expect(isDarkTheme(null)).toBe(false);
    });

    it('should return true if headerStyle is dark', () => {
      const tenant: Tenant = {
        id: '3',
        slug: 'test',
        name: 'Test',
        theme: {
          layout: {
            headerStyle: 'dark',
            backgroundStyle: 'white',
          },
        },
      };
      expect(isDarkTheme(tenant)).toBe(true);
    });
  });

  describe('getBackgroundClass', () => {
    it('should return custom background class for PornoPizza', () => {
      const result = getBackgroundClass(mockPornopizzaTenant);
      expect(result).toContain('porno-bg');
    });

    it('should return gray-50 for light theme', () => {
      const result = getBackgroundClass(mockLightTenant);
      expect(result).toBe('bg-gray-50');
    });

    it('should return default for null tenant', () => {
      const result = getBackgroundClass(null);
      expect(result).toBe('bg-gray-50');
    });
  });

  describe('getSectionShellClass', () => {
    it('should return glass-panel for dark theme', () => {
      const result = getSectionShellClass(mockPornopizzaTenant);
      expect(result).toContain('glass-panel');
      expect(result).toContain('border-white/10');
    });

    it('should return bg-white for light theme', () => {
      const result = getSectionShellClass(mockLightTenant);
      expect(result).toContain('bg-white');
      expect(result).toContain('shadow-xl');
    });
  });

  describe('getButtonGradientClass', () => {
    it('should return gradient for dark theme', () => {
      const result = getButtonGradientClass(mockPornopizzaTenant);
      expect(result).toContain('bg-gradient-to-r');
      expect(result).toContain('from-[#ff5e00]');
    });

    it('should return text-white for light theme', () => {
      const result = getButtonGradientClass(mockLightTenant);
      expect(result).toBe('text-white');
    });
  });

  describe('getButtonStyle', () => {
    it('should return backgroundColor for light theme', () => {
      const result = getButtonStyle(mockLightTenant, false);
      expect(result).toEqual({ backgroundColor: '#DC143C' });
    });

    it('should return undefined for dark theme', () => {
      const result = getButtonStyle(mockPornopizzaTenant, true);
      expect(result).toBeUndefined();
    });
  });

  describe('withTenantThemeDefaults', () => {
    it('should add default layout config for PornoPizza', () => {
      const tenantWithoutLayout: Tenant = {
        ...mockPornopizzaTenant,
        theme: { primaryColor: '#FF6B00' },
      };
      
      const result = withTenantThemeDefaults(tenantWithoutLayout);
      
      expect(result?.theme?.layout?.headerStyle).toBe('dark');
      expect(result?.theme?.layout?.useCustomLogo).toBe(true);
      expect(result?.theme?.layout?.customLogoComponent).toBe('PornoPizzaLogo');
    });

    it('should preserve existing layout config', () => {
      const result = withTenantThemeDefaults(mockPornopizzaTenant);
      expect(result?.theme?.layout?.headerStyle).toBe('dark');
      expect(result?.theme?.layout?.useCustomLogo).toBe(true);
    });

    it('should return null for null tenant', () => {
      const result = withTenantThemeDefaults(null);
      expect(result).toBeNull();
    });

    it('should not modify non-PornoPizza tenants', () => {
      const result = withTenantThemeDefaults(mockLightTenant);
      expect(result?.theme?.layout?.headerStyle).toBe('light');
    });
  });
});

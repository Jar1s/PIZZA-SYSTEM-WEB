# Tenant Theme Configuration

## Overview

Tenant-specific styling has been moved from hardcoded `isPornopizza` checks to tenant theme configuration. This allows for flexible styling without code changes.

## Configuration Structure

```typescript
{
  "theme": {
    "primaryColor": "#FF6B00",
    "secondaryColor": "#FF0066",
    "logo": "https://example.com/logo.png",
    "layout": {
      "headerStyle": "dark",           // 'dark' | 'light'
      "backgroundStyle": "black",       // 'black' | 'white' | 'gradient'
      "useCustomLogo": true,            // Use custom logo component
      "customLogoComponent": "PornoPizzaLogo",  // Component name
      "useCustomBackground": true,      // Use custom background
      "customBackgroundClass": "porno-bg"  // CSS class name
    }
  }
}
```

## Example: Pornopizza Configuration

To configure Pornopizza with dark theme and custom logo:

```json
{
  "theme": {
    "primaryColor": "#FF6B00",
    "secondaryColor": "#FF0066",
    "logo": "",
    "layout": {
      "headerStyle": "dark",
      "backgroundStyle": "black",
      "useCustomLogo": true,
      "customLogoComponent": "PornoPizzaLogo",
      "useCustomBackground": true,
      "customBackgroundClass": "porno-bg"
    }
  }
}
```

## Example: Light Theme Tenant

For a tenant with light theme:

```json
{
  "theme": {
    "primaryColor": "#DC143C",
    "secondaryColor": "#FF6B00",
    "logo": "https://example.com/logo.png",
    "layout": {
      "headerStyle": "light",
      "backgroundStyle": "white",
      "useCustomLogo": false
    }
  }
}
```

## Migration Guide

### Before (Hardcoded)
```typescript
const isPornopizza = 
  tenant.slug === 'pornopizza' ||
  tenant.subdomain === 'pornopizza';

{isPornopizza ? (
  <PornoPizzaLogo />
) : (
  <Image src={tenant.theme.logo} />
)}
```

### After (Configuration-Based)
```typescript
const layout = tenant.theme?.layout || {};
const useCustomLogo = layout.useCustomLogo || false;
const customLogoComponent = layout.customLogoComponent || '';

{useCustomLogo && customLogoComponent === 'PornoPizzaLogo' ? (
  <PornoPizzaLogo />
) : (
  <Image src={tenant.theme.logo} />
)}
```

## Benefits

1. **Flexibility**: Add new tenants with different styles without code changes
2. **Maintainability**: All styling configuration in one place (database)
3. **Scalability**: Easy to add new layout options
4. **Admin Control**: Admins can change styling via admin panel (future feature)

## Database Update

To update existing tenants, run:

```sql
UPDATE tenants 
SET theme = jsonb_set(
  theme,
  '{layout}',
  '{
    "headerStyle": "dark",
    "backgroundStyle": "black",
    "useCustomLogo": true,
    "customLogoComponent": "PornoPizzaLogo",
    "useCustomBackground": true,
    "customBackgroundClass": "porno-bg"
  }'::jsonb
)
WHERE slug = 'pornopizza';
```


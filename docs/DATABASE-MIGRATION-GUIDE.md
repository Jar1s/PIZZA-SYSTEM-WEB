# Database Migration Guide - Tenant Theme Layout

## Overview

This guide explains how to update existing tenants in the database to use the new layout configuration system.

## What Changed

The tenant theme structure has been extended with a `layout` configuration object:

```typescript
{
  theme: {
    // Existing fields
    primaryColor: '#FF6B00',
    secondaryColor: '#000000',
    logo: '/logos/pornopizza.svg',
    // ... other fields
    
    // NEW: Layout configuration
    layout: {
      headerStyle: 'dark' | 'light',
      backgroundStyle: 'black' | 'white' | 'gradient',
      useCustomLogo: boolean,
      customLogoComponent?: string,
      useCustomBackground?: boolean,
      customBackgroundClass?: string,
    }
  }
}
```

## Migration Options

### Option 1: TypeScript Migration Script (Recommended)

Run the migration script:

```bash
cd backend
npm run prisma:migrate-theme
```

This script will:
- Update Pornopizza with dark theme layout
- Update Pizza v Núdzi with light theme layout
- Update any other tenants with default light theme

### Option 2: SQL Migration

Run the SQL migration directly:

```bash
cd backend
psql $DATABASE_URL -f prisma/migrations/20250120000000_update_tenant_theme_layout/migration.sql
```

Or using Prisma:

```bash
cd backend
npx prisma migrate deploy
```

### Option 3: Manual Update via Admin Panel

If you have an admin panel, you can manually update tenant themes through the UI.

## Verification

After running the migration, verify the update:

```sql
SELECT slug, theme->'layout' as layout FROM tenants;
```

Expected output:
- `pornopizza`: Should have `headerStyle: "dark"` and `useCustomLogo: true`
- `pizzavnudzi`: Should have `headerStyle: "light"` and `useCustomLogo: false`

## Rollback

If you need to rollback, you can remove the layout configuration:

```sql
UPDATE tenants
SET theme = theme - 'layout'
WHERE slug IN ('pornopizza', 'pizzavnudzi');
```

## Seed Script

The seed script (`backend/prisma/seed.ts`) has been updated to include the new layout configuration. New tenants created via seed will automatically have the correct layout configuration.

## Troubleshooting

### Issue: Migration script fails with "Cannot find module"

**Solution**: Make sure you're in the `backend` directory and have installed dependencies:
```bash
cd backend
npm install
```

### Issue: SQL migration fails with JSONB error

**Solution**: Make sure your PostgreSQL version supports JSONB operations (PostgreSQL 9.4+).

### Issue: Layout configuration not applied

**Solution**: Check if the theme already has a layout object:
```sql
SELECT theme->'layout' FROM tenants WHERE slug = 'pornopizza';
```

If it returns `null`, the migration should work. If it returns an object, you may need to manually merge the configuration.


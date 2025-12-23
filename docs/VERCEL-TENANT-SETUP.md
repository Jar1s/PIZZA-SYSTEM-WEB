# Vercel Tenant Setup Guide

This guide explains how to set up a new Vercel project for a cloned tenant (brand).

## Overview

Each tenant (brand) has its own Vercel project with its own domain. All projects track the same Git repository (main branch) but have different environment variables and domains configured.

## Prerequisites

1. Tenant must be created in the admin panel first
2. Access to Vercel dashboard
3. Domain ready for configuration (DNS access)

## Step-by-Step Setup

### 1. Clone Tenant in Admin Panel

1. Go to **Admin → Brands**
2. Click **"Clone Brand"** on the master tenant (PornoPizza)
3. Fill in the cloning wizard:
   - **Basic Info**: Name, Slug, Domain, Subdomain
   - **Design**: Colors, Logo (optional - can be added later)
   - **Email Configuration**: SMTP settings for tenant-specific emails
   - **Wolt Credentials**: API Key and Pickup Address
4. Click **"Clone Brand"** to create the tenant in the database

### 2. Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"** or **"New Project"**
3. **Import from Git**:
   - Select your Git provider (GitHub, GitLab, Bitbucket)
   - Select the repository containing the frontend code
   - Click **"Import"**

### 3. Configure Project Settings

1. **Project Name**: `<tenant-slug>-frontend` (e.g., `partypizza-frontend`)
2. **Framework Preset**: Next.js (should auto-detect)
3. **Root Directory**: `frontend` (if frontend is in a subdirectory)
4. **Build Command**: 
   - If root directory is `frontend`: `cd frontend && npm run build`
   - If root is project root: `npm run build` (adjust based on your package.json)
5. **Output Directory**: `.next` (Next.js default)
6. **Install Command**: `npm install` (or `cd frontend && npm install` if root is frontend)

### 4. Add Domain

1. After project is created, go to **Settings → Domains**
2. Click **"Add Domain"**
3. Enter your domain: `<tenant-domain>` (e.g., `partypizza.sk`)
4. Vercel will provide DNS configuration instructions:
   - **A Record**: Point to Vercel's IP addresses
   - **CNAME Record**: Point to Vercel's domain (if using subdomain)
5. Configure DNS at your domain registrar as instructed
6. Wait for DNS propagation (can take up to 48 hours, usually much faster)

### 5. Configure Environment Variables

Go to **Settings → Environment Variables** and add:

#### Required Variables

- **`NEXT_PUBLIC_TENANT_SLUG`**: `<tenant-slug>` (e.g., `partypizza`)
  - Used as fallback for tenant resolution in middleware
  - Important for preview deployments and development

- **`NEXT_PUBLIC_API_URL`**: `<backend-api-url>` (e.g., `https://api.p0rnopizza.sk`)
  - Backend API endpoint
  - Should be the same for all tenants (shared backend)

#### Optional Variables (if needed)

- **`NEXT_PUBLIC_BASE_URL`**: Full URL of the frontend (auto-detected, but can be overridden)
- Any other environment variables used by your application

#### Environment-Specific Variables

You can set different values for:
- **Production**: Live domain
- **Preview**: Preview deployments (branch-based)
- **Development**: Local development

For production, ensure `NEXT_PUBLIC_TENANT_SLUG` matches the tenant slug exactly.

### 6. Deploy

#### Automatic Deployment

- **Default**: Vercel automatically deploys when you push to the `main` branch
- All Vercel projects tracking the same repo will deploy simultaneously
- Each project uses its own environment variables and domain

#### Manual Deployment

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Or trigger a new deployment from a specific branch/commit

### 7. Verify Deployment

1. **Check Domain**: Visit `<tenant-domain>` and verify it loads correctly
2. **Check Tenant Resolution**: 
   - Middleware should resolve tenant from domain
   - If domain not configured yet, it will use `NEXT_PUBLIC_TENANT_SLUG` fallback
3. **Check Analytics**: If analytics are configured, verify scripts load in browser DevTools
4. **Test Functionality**: 
   - Browse products
   - Test checkout flow
   - Verify tenant-specific branding (colors, logo)

## Architecture Notes

### How Tenant Resolution Works

1. **Middleware** (`frontend/middleware.ts`) runs on every request
2. **Resolution Priority**:
   - First: `NEXT_PUBLIC_TENANT_SLUG` environment variable (for preview/dev)
   - Second: Backend API call to `/api/tenants/resolve?domain=<domain>`
   - Third: Query parameter `?tenant=<slug>` (for localhost/Vercel preview)
3. **Result**: Tenant slug is passed to app via `x-tenant` header

### Shared Backend

- All tenants share the same backend API
- Backend handles multi-tenancy via tenant slug in requests
- Each tenant has its own:
  - Email configuration (`emailConfig`)
  - Wolt API credentials (`deliveryConfig`)
  - Payment gateway config (`paymentConfig`)
  - Theme and branding (`theme`)
  - Analytics tracking (`theme.analyticsConfig`)

### Product Data

- **Shared Products**: `tenantId = null` - visible to all tenants
- **Tenant-Specific Products**: `tenantId = <tenant-id>` - only visible to that tenant
- **Product Overrides**: Shared products can have per-tenant overrides (names, images, descriptions)

## Troubleshooting

### Domain Not Resolving Tenant

**Problem**: Domain returns 404 or wrong tenant

**Solutions**:
1. Check `NEXT_PUBLIC_TENANT_SLUG` environment variable is set correctly
2. Verify domain is added in Vercel project settings
3. Check backend `/api/tenants/resolve?domain=<domain>` endpoint returns correct tenant
4. Verify tenant exists in database with correct `domain` or `subdomain` field

### Analytics Not Loading

**Problem**: Tracking scripts don't appear on pages

**Solutions**:
1. Verify analytics are configured in Admin → Brands → Edit Brand → Analytics & Tracking
2. Check `tenant.theme.analyticsConfig` in database
3. Verify scripts are enabled and IDs are correct
4. Check browser console for script loading errors

### Products Not Showing

**Problem**: Products don't appear for tenant

**Solutions**:
1. Verify products exist in database
2. Check if products are shared (`tenantId = null`) or tenant-specific (`tenantId = <tenant-id>`)
3. Verify tenant slug matches exactly (case-sensitive)
4. Check backend logs for product query errors

### Build Failures

**Problem**: Vercel build fails

**Solutions**:
1. Check build logs in Vercel dashboard
2. Verify `Root Directory` is set correctly (`frontend` if frontend is in subdirectory)
3. Check `Build Command` matches your package.json scripts
4. Verify all environment variables are set
5. Check for TypeScript/compilation errors

## Best Practices

1. **Naming Convention**: Use consistent naming: `<tenant-slug>-frontend` for project names
2. **Environment Variables**: Keep a checklist of required env vars for easy setup
3. **Domain Setup**: Set up domains before going live to avoid DNS propagation delays
4. **Testing**: Test on preview deployments before merging to main
5. **Monitoring**: Set up Vercel monitoring/alerts for each project
6. **Backups**: Keep database backups before major sync operations

## Quick Reference

### Required Environment Variables

```bash
NEXT_PUBLIC_TENANT_SLUG=partypizza
NEXT_PUBLIC_API_URL=https://api.p0rnopizza.sk
```

### Vercel Project Settings

- **Framework**: Next.js
- **Root Directory**: `frontend` (if applicable)
- **Build Command**: `npm run build` (or `cd frontend && npm run build`)
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### API Endpoints

- **Tenant Resolution**: `GET /api/tenants/resolve?domain=<domain>`
- **Get Tenant**: `GET /api/tenants/<slug>`
- **Get Products**: `GET /api/<tenant-slug>/products`

## Support

For issues or questions:
1. Check backend logs for API errors
2. Check Vercel deployment logs for build/runtime errors
3. Verify database tenant configuration
4. Test tenant resolution endpoint manually

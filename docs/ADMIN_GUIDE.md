# Admin Panel User Guide

## Overview

This guide explains how to use the admin panel to manage multiple pizza brands, clone websites, configure Wolt delivery, and synchronize updates.

## Accessing Admin Panel

**URL**: `https://your-domain.com/admin/brands`

**Default Credentials** (for development):
- Username: `admin`
- Password: (check your setup docs)

## Managing Brands

### View All Brands

The main brands page shows all tenants (websites) in your system:
- Active/Inactive status
- Theme colors preview
- Subdomain and custom domain
- Quick actions (Edit, Clone, Toggle Active)

### Edit Brand Settings

Click "Edit Brand" on any tenant card to configure:

1. **Active Status**: Toggle website on/off
2. **Payment on Delivery**: Enable cash or card payment
3. **Wolt Delivery Settings**:
   - Wolt API Key (from drive.wolt.com)
   - Pickup Address (kitchen location)
   - Kitchen Phone
   - GPS Coordinates (lat/lng)
   - Special instructions for courier

**How to get Wolt API Key:**
1. Register at https://drive.wolt.com/
2. Create merchant account
3. Get API key from dashboard
4. Paste into admin panel

**How to find GPS coordinates:**
1. Open Google Maps
2. Right-click on your kitchen location
3. Click on coordinates to copy (e.g., 48.1486, 17.1077)
4. Paste lat/lng into admin panel

## Cloning a Brand

### When to Clone

Clone a brand when you want to create a new pizza website that:
- Has the same menu items (products)
- Uses the same delivery structure
- Has different branding (colors, logo, name)
- Has its own email service
- Has its own Wolt credentials
- Has its own payment gateway

### How to Clone

1. **Click "Clone Brand"** on the source tenant (usually PornoPizza)

2. **Step 1: Basic Info**
   - Enter new brand name (e.g., "Pizza Express")
   - Slug is auto-generated (e.g., "pizza-express")
   - Set subdomain (e.g., "pizzaexpress")
   - Optional: Add custom domain (e.g., "pizzaexpress.sk")

3. **Step 2: Design**
   - Choose primary color (brand color)
   - Choose secondary color (accent color)
   - Optional: Add logo URL

4. **Step 3: Email Configuration**
   - **From Email** (required): noreply@your-domain.com
   - Optional SMTP settings if using different email server:
     - SMTP Host (e.g., smtp.gmail.com)
     - SMTP Port (587 for TLS, 465 for SSL)
     - SMTP User
     - SMTP Password
     - SSL/TLS checkbox

5. **Step 4: Wolt Delivery**
   - Wolt API Key (separate key for this brand)
   - Pickup address (kitchen location)
   - Kitchen phone
   - GPS coordinates
   - Courier instructions

6. **Click "Clone Brand"** to create the new website

### What Gets Cloned

✅ **Copied from source**:
- All products (menu items)
- All delivery zones
- Product mappings (Storyous integration)

❌ **NOT copied** (must be configured individually):
- Payment gateway credentials
- Wolt API key (must provide your own)
- Email SMTP settings

## Synchronizing from Master

### What is Master Tenant?

**PornoPizza** is the designated master tenant. When you implement new features or update products on PornoPizza, you can synchronize those changes to all other brands.

### What Gets Synchronized

✅ **Updates all tenants with**:
- New or modified products
- Updated delivery zones
- Product mappings
- Storyous configuration

❌ **Does NOT change**:
- Brand theme (colors, logo)
- Email configuration
- Wolt API credentials
- Payment gateway settings

### How to Sync

1. **Click "Sync All from Master"** button in page header

2. **Confirm the operation**:
   - Read the confirmation message
   - Understand that products will be updated
   - Individual branding will be preserved

3. **Wait for sync to complete**:
   - Progress will be shown
   - Success/error messages for each tenant

4. **Review results**:
   - Check which tenants were synced
   - Check for any errors

### When to Sync

Sync from master when:
- You add new products to PornoPizza menu
- You update product prices on PornoPizza
- You change delivery zones structure
- You update Storyous integration

**Warning**: Sync operation will replace products on all tenants. Individual product customizations (if any) will be lost.

## Troubleshooting

### Wolt Delivery Not Working

1. **Check API Key**:
   - Go to Edit Brand → Wolt Delivery Settings
   - Verify API key is correct
   - Test connection (if test button available)

2. **Check Pickup Address**:
   - Verify street, city, postal code are correct
   - Verify GPS coordinates are accurate
   - Check kitchen phone number is valid

3. **Check Wolt Dashboard**:
   - Login to drive.wolt.com
   - Verify merchant account is active
   - Check API key permissions

### Emails Not Sending

1. **Check Email Config**:
   - Go to Edit Brand
   - Verify "From Email" is set
   - If using custom SMTP, verify all settings

2. **Test Email** (if available):
   - Click "Send Test Email" button
   - Check inbox (and spam folder)
   - Review error messages

3. **Common Issues**:
   - SMTP password incorrect
   - SMTP port wrong (587 for TLS, 465 for SSL)
   - Firewall blocking SMTP connection
   - Email provider requires app-specific password

### Clone Failed

1. **Check slug uniqueness**:
   - Slug must be unique
   - Try different slug if conflict

2. **Check required fields**:
   - Name is required
   - From Email is required
   - Slug must be lowercase, alphanumeric + hyphens

3. **Check database connection**:
   - Verify backend is running
   - Check database is accessible

## Best Practices

### Before Cloning

1. Configure PornoPizza fully first (master tenant)
2. Test all features on PornoPizza
3. Have Wolt API keys ready for new brand
4. Have email credentials ready
5. Have payment gateway credentials ready

### After Cloning

1. Test the new website immediately
2. Place a test order
3. Verify emails are sent
4. Test Wolt delivery creation
5. Check payment processing

### Regular Maintenance

1. **Weekly**: Review all tenants are active
2. **After menu changes**: Sync from master
3. **Monthly**: Review audit logs (if enabled)
4. **Quarterly**: Review and update Wolt credentials if expired

## Security Notes

- API keys and passwords are stored securely
- Only admin users can access brands management
- All changes are logged (if audit logging enabled)
- Backups are created before sync operations (if enabled)

## Support

If you encounter issues not covered in this guide:
1. Check backend logs for detailed error messages
2. Review Prisma migration status
3. Contact technical support

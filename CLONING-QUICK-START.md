# 🚀 Quick Start Guide - Tenant Cloning

## Implementation Status: ✅ COMPLETE

All code is ready! Just need to run the database migration.

## Step 1: Run Database Migration

### Option A: Direct SQL (Recommended if Prisma CLI has issues)

```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration SQL
\i backend/prisma/migrations/20250115000001_add_email_config_and_audit/migration.sql

# Verify tables were created
\dt audit_logs
\dt tenant_backups
\d tenants  # Should show emailConfig column
```

### Option B: Using Prisma (if CLI works)

```bash
cd backend
npx prisma migrate deploy
```

## Step 2: Restart Backend

```bash
cd backend
npm run start:dev
```

Verify backend starts without errors and shows:
```
✅ SMTP connection verified successfully
✅ Server running on http://localhost:3000
```

## Step 3: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend should start on http://localhost:3001

## Step 4: Test the Features

### Test 1: Edit Brand with Wolt Credentials

1. Open http://localhost:3001/admin/brands
2. Click "Edit Brand" on PornoPizza
3. Scroll to "🚚 Wolt Delivery Settings"
4. Fill in:
   - Wolt API Key: `your_wolt_test_key`
   - Street: `Obchodná 1`
   - City: `Bratislava`
   - Postal Code: `81106`
   - Kitchen Phone: `+421900000000`
   - Latitude: `48.1486`
   - Longitude: `17.1077`
5. Click "Save Changes"
6. Verify saved (refresh page and check values are loaded)

### Test 2: Clone a Brand

1. Go to http://localhost:3001/admin/brands
2. Click "Clone Brand" on PornoPizza
3. **Step 1 - Basic Info**:
   - Name: `Pizza Express`
   - Slug: `pizza-express` (auto-generated)
   - Subdomain: `pizzaexpress`
   - Domain: (leave empty or add test domain)
   - Click "Next"

4. **Step 2 - Design**:
   - Primary Color: `#FF4500` (orange-red)
   - Secondary Color: `#1A1A1A` (dark gray)
   - Logo URL: (leave empty for now)
   - Click "Next"

5. **Step 3 - Email**:
   - From Email: `noreply@pizzaexpress.test`
   - SMTP settings: (leave empty to use global)
   - Click "Next"

6. **Step 4 - Wolt Delivery**:
   - Wolt API Key: `test_key_pizza_express`
   - Pickup Address:
     - Street: `Test Street 5`
     - City: `Bratislava`
     - Postal Code: `82105`
     - Phone: `+421911222333`
     - Lat: `48.1500`
     - Lng: `17.1100`
   - Click "Clone Brand"

7. **Verify**:
   - New tenant card appears in brands list
   - Orange-red color in header
   - Name is "Pizza Express"
   - Subdomain is "pizzaexpress"

### Test 3: Verify Independence

1. Click "Edit Brand" on Pizza Express
2. Verify Wolt API Key is `test_key_pizza_express` (different from PornoPizza)
3. Verify pickup address is "Test Street 5" (different from PornoPizza)
4. Verify theme colors are orange-red (different from PornoPizza)

### Test 4: Sync from Master

1. Add a new product to PornoPizza (via database or API)
2. Go to http://localhost:3001/admin/brands
3. Click "Sync All from Master"
4. Confirm the operation
5. Wait for success message
6. **Verify**:
   - Pizza Express now has the new product
   - Pizza Express still has its own Wolt API key
   - Pizza Express still has orange-red colors
   - Pizza Express still has its own pickup address

## Expected Results

After successful testing:

✅ **Cloning Works**:
- New tenant created instantly
- All products copied from source
- Individual Wolt credentials
- Individual email config
- Individual theme colors

✅ **Wolt Admin Works**:
- Can edit Wolt API key per tenant
- Can edit pickup address per tenant
- Settings are saved and persisted
- Settings load correctly when editing

✅ **Email Config Works**:
- Tenant-specific fromEmail used
- Falls back to global SMTP if not configured
- No errors in email sending

✅ **Sync Works**:
- Products synchronized from master
- Individual settings preserved (Wolt, email, theme)
- Success/error reporting works

## Troubleshooting

### Migration Failed

If migration fails:
1. Check database connection: `psql $DATABASE_URL -c "SELECT 1"`
2. Check if tables already exist: `\dt audit_logs`
3. If emailConfig column exists, skip that line in migration
4. Re-run migration

### Clone Button Not Showing

1. Check browser console for errors
2. Verify CloneBrandModal is imported in brands/page.tsx
3. Hard refresh (Cmd+Shift+R)

### Wolt Section Not Showing in Edit Modal

1. Check if EditBrandModal has Wolt state variables
2. Verify deliveryConfig is loaded in useEffect
3. Check browser console for errors

### Sync Button Not Working

1. Check browser console for errors
2. Verify backend is running (http://localhost:3000)
3. Check backend logs for sync operation errors
4. Verify PornoPizza tenant exists

## Debug Tips

### Backend Logs
```bash
cd backend
npm run start:dev

# Watch for:
# [TenantsService] Cloning tenant pornopizza to pizza-express
# [TenantsService] Created new tenant: cuid_...
# [TenantsService] Cloned 45 products
# [TenantsService] Successfully cloned tenant
```

### Frontend Console
```javascript
// Open browser console (F12)
// You should see:
console.log('[BrandsPage] Fetching tenants...')
console.log('[BrandsPage] Fetched 2 tenants:', [...])
```

### Database Queries
```sql
-- Check emailConfig was added
SELECT id, slug, name, "emailConfig" FROM tenants;

-- Check audit logs (after operations)
SELECT * FROM audit_logs ORDER BY "createdAt" DESC LIMIT 10;

-- Check cloned tenant
SELECT id, slug, name FROM tenants WHERE slug = 'pizza-express';

-- Check cloned products
SELECT COUNT(*) FROM products WHERE "tenantId" = (
  SELECT id FROM tenants WHERE slug = 'pizza-express'
);
```

## Success Criteria

You'll know it works when:

1. ✅ Clone button appears on all tenant cards
2. ✅ Clicking Clone opens 4-step wizard
3. ✅ Cloning creates new tenant in ~5 seconds
4. ✅ New tenant appears in brands list
5. ✅ New tenant has independent Wolt credentials
6. ✅ Sync updates products without changing individual settings
7. ✅ No errors in console or logs

---

**Need help?** Check `docs/ADMIN_GUIDE.md` for detailed documentation.

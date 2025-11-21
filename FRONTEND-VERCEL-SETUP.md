# Frontend Vercel Environment Variables Setup

## 🔴 Critical: NEXT_PUBLIC_API_URL Required

The frontend requires `NEXT_PUBLIC_API_URL` environment variable to connect to the backend API. Without it, you'll see "Tenant not found" errors.

## 📋 Required Environment Variables

### Frontend (Vercel)

1. **NEXT_PUBLIC_API_URL** (REQUIRED)
   - Backend API URL
   - Format: `https://your-backend.vercel.app` or `https://api.yourdomain.com`
   - Example: `https://backend-154h0efpm-jbs-projects-de137bda.vercel.app`
   
   **⚠️ Important**: 
   - Must start with `https://` (not `http://`)
   - Must NOT end with trailing slash (`/`)
   - Must be the full backend URL (not just domain)

## 🚀 How to Set on Vercel

### Step 1: Find Your Backend URL

1. Go to your **Backend** Vercel project
2. Navigate to **Deployments**
3. Copy the **Production** deployment URL (e.g., `https://backend-xxx.vercel.app`)

### Step 2: Add to Frontend Project

1. Go to your **Frontend** Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Click **"Create new"**
4. Fill in:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend.vercel.app` (your actual backend URL)
   - **Environments**: Select **Production**, **Preview**, **Development**
5. Click **Save**

### Step 3: Redeploy Frontend

After adding the environment variable:
1. Go to **Deployments**
2. Find the latest deployment
3. Click **"..."** → **Redeploy**
4. Or push a new commit to trigger automatic redeploy

## ✅ Verification

After setting `NEXT_PUBLIC_API_URL` and redeploying:

1. Open your frontend URL
2. Check browser console (F12) - should NOT see "Tenant not found" errors
3. Check Vercel function logs - should NOT see "Failed to load tenant data" errors
4. Frontend should load tenant data successfully

## 🔍 Troubleshooting

### Error: "Tenant not found"

**Possible causes:**
1. `NEXT_PUBLIC_API_URL` is not set
2. `NEXT_PUBLIC_API_URL` points to wrong URL
3. Backend is not accessible (CORS or network issues)
4. Backend database is empty (no tenants seeded)

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL` is set in Vercel dashboard
2. Verify backend URL is correct (test in browser: `https://your-backend.vercel.app/api/health`)
3. Check backend logs for errors
4. Ensure backend has tenant data (run seed script)

### Error: "Failed to fetch"

**Possible causes:**
1. Backend URL is incorrect
2. CORS not configured on backend
3. Backend is down

**Solution:**
1. Test backend URL directly: `curl https://your-backend.vercel.app/api/health`
2. Check backend CORS configuration
3. Verify backend is deployed and running

### Error: Network timeout

**Possible causes:**
1. Backend is slow to respond
2. Backend database connection issues

**Solution:**
1. Check backend logs for slow queries
2. Verify database connection is working
3. Check backend function timeout settings

## 📝 Example Configuration

```bash
# Frontend Environment Variables (Vercel)
NEXT_PUBLIC_API_URL=https://backend-154h0efpm-jbs-projects-de137bda.vercel.app
```

## 🔗 Related Documentation

- Backend setup: `backend/VERCEL-ENV-SETUP.md`
- CORS configuration: See backend `api/index.ts`


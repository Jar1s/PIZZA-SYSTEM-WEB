# Vercel Environment Variables Setup

## 🔴 Critical: DATABASE_URL Required

The backend requires `DATABASE_URL` environment variable to connect to PostgreSQL database. Without it, you'll see `PrismaClientInitializationError`.

## 📋 Required Environment Variables

### Backend (Vercel)

1. **DATABASE_URL** (REQUIRED)
   - PostgreSQL connection string
   - Format: `postgresql://user:password@host:port/database?schema=public`
   - Example: `postgresql://postgres:password@db.example.com:5432/pizza_db?schema=public`

2. **JWT_SECRET** (REQUIRED)
   - Secret key for JWT token signing
   - Generate: `openssl rand -base64 32`

3. **JWT_REFRESH_SECRET** (REQUIRED)
   - Secret key for refresh tokens
   - Generate: `openssl rand -base64 32`

4. **ALLOWED_ORIGINS** (Optional)
   - Comma-separated list of allowed CORS origins
   - Example: `https://pornopizza.sk,https://pizzavnudzi.sk`

5. **SENTRY_DSN** (Optional)
   - Sentry DSN for error monitoring
   - Get from: https://sentry.io

6. **NODE_ENV** (Optional)
   - Set to `production` for production deployments

### Frontend (Vercel)

1. **NEXT_PUBLIC_API_URL** (REQUIRED)
   - Backend API URL
   - Example: `https://backend-xxx.vercel.app` or `https://api.pornopizza.sk`

## 🚀 How to Set Environment Variables on Vercel

### Via Vercel Dashboard

1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string
   - **Environment**: Select `Production`, `Preview`, and/or `Development`
4. Click **Save**
5. **Redeploy** your project for changes to take effect

### Via Vercel CLI

```bash
# Set DATABASE_URL
vercel env add DATABASE_URL production

# Set JWT_SECRET
vercel env add JWT_SECRET production

# Set JWT_REFRESH_SECRET
vercel env add JWT_REFRESH_SECRET production

# Set NEXT_PUBLIC_API_URL (for frontend)
vercel env add NEXT_PUBLIC_API_URL production
```

### Via Vercel API

```bash
# Get your Vercel token from: https://vercel.com/account/tokens

# Add environment variable
curl -X POST "https://api.vercel.com/v10/projects/{project-id}/env" \
  -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "DATABASE_URL",
    "value": "postgresql://user:password@host:port/database",
    "type": "encrypted",
    "target": ["production", "preview"]
  }'
```

## 🗄️ Database Options for Vercel

### Option 1: Supabase (Recommended)
- Free tier available
- PostgreSQL database
- Connection string format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### Option 2: Neon
- Serverless PostgreSQL
- Free tier available
- Auto-scaling

### Option 3: Railway
- PostgreSQL hosting
- Simple setup
- Pay-as-you-go

### Option 4: AWS RDS / Google Cloud SQL
- Enterprise-grade
- More complex setup
- Better for high traffic

## ✅ Verification

After setting environment variables:

1. **Redeploy** your backend on Vercel
2. Check Vercel function logs for errors
3. Test health endpoint:
   ```bash
   curl https://your-backend.vercel.app/api/health
   ```
4. Should return `200 OK` instead of `PrismaClientInitializationError`

## 🔍 Troubleshooting

### Error: `PrismaClientInitializationError`

**Cause**: `DATABASE_URL` is missing or invalid

**Solution**:
1. Check Vercel dashboard → Settings → Environment Variables
2. Verify `DATABASE_URL` is set for correct environment (Production/Preview)
3. Verify connection string format is correct
4. Test connection string locally:
   ```bash
   psql "postgresql://user:password@host:port/database"
   ```
5. Redeploy after adding environment variable

### Error: Connection timeout

**Cause**: Database firewall blocking Vercel IPs

**Solution**:
1. Allow Vercel IP ranges in database firewall
2. Or use connection pooling (recommended for serverless)
3. Add `?pgbouncer=true` to connection string if using PgBouncer

### Error: SSL required

**Cause**: Database requires SSL connection

**Solution**:
Add `?sslmode=require` to connection string:
```
postgresql://user:password@host:port/database?sslmode=require
```

## 📝 Example .env for Local Development

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/pizza_ecosystem?schema=public"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"

# CORS
ALLOWED_ORIGINS="http://localhost:3001,http://pornopizza.localhost:3001"

# Sentry (optional)
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# Environment
NODE_ENV="development"
```

## 🔐 Security Notes

- **Never commit** `.env` files to Git
- Use Vercel's encrypted environment variables
- Rotate secrets regularly
- Use different secrets for production/preview/development
- Consider using Vercel's secret management for sensitive data


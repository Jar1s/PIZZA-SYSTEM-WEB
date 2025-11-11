# Deployment Guide

## Prerequisites
- GitHub account
- Vercel account
- Fly.io account
- PostgreSQL database (Supabase/Railway/Neon)
- Domain names configured

## Frontend Deployment (Vercel)

### 1. Initial Setup
```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

### 2. Configure Domain
- Go to Vercel dashboard → Settings → Domains
- Add custom domains:
  - pornopizza.sk
  - pizzavnudzi.sk
  - maydaypizza.sk

### 3. Environment Variables
In Vercel dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL=https://pizza-ecosystem-api.fly.dev
```

### 4. Multi-Domain Setup
Each domain automatically gets its own deployment. Middleware handles tenant routing.

## Backend Deployment (Fly.io)

### 1. Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### 2. Create App
```bash
cd backend
fly launch
# Follow prompts, choose region (Amsterdam recommended for EU)
```

### 3. Create PostgreSQL Database
```bash
fly postgres create
# Name: pizza-ecosystem-db
# Region: ams (same as app)

fly postgres attach --app pizza-ecosystem-api pizza-ecosystem-db
```

This automatically sets DATABASE_URL secret.

### 4. Set Secrets
```bash
fly secrets set \
  ADYEN_API_KEY="your_key" \
  ADYEN_MERCHANT_ACCOUNT="your_account" \
  ADYEN_HMAC_KEY="your_hmac" \
  WOLT_API_KEY_PORNOPIZZA="your_wolt_key" \
  WOLT_API_KEY_PIZZAVNUDZI="your_wolt_key" \
  NODE_ENV="production"
```

### 5. Run Migrations
```bash
fly ssh console
npx prisma migrate deploy
npx prisma db seed
exit
```

### 6. Deploy
```bash
fly deploy
```

Your API is now live at: https://pizza-ecosystem-api.fly.dev

## Database Options

### Option 1: Fly.io Postgres (Recommended)
- Integrated with Fly.io
- Automatic backups
- Easy scaling

### Option 2: Supabase
- Free tier available
- Built-in backups
- Database URL: `postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres`

### Option 3: Railway
- Easy setup
- Auto backups
- Good free tier

### Option 4: Neon
- Serverless Postgres
- Branch databases
- Free tier

## Redis (Optional - for caching)

### Upstash Redis (Free tier)
```bash
# Create at https://upstash.com
# Add to Fly secrets:
fly secrets set REDIS_URL="your_upstash_url"
```

## Monitoring

### Sentry Setup
1. Create project at https://sentry.io
2. Get DSN
3. Add to environment variables:
```bash
# Backend
fly secrets set SENTRY_DSN="your_dsn"

# Frontend (Vercel)
NEXT_PUBLIC_SENTRY_DSN=your_dsn
```

### Logtail (optional)
1. Create account at https://logtail.com
2. Add source token to Fly secrets

## CI/CD

### GitHub Secrets
Add these to GitHub repository → Settings → Secrets:

**Frontend:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `API_URL`

**Backend:**
- `FLY_API_TOKEN`

### Automatic Deployments
- Push to `main` → auto deploy
- Pull requests → preview deployments (Vercel only)

## DNS Configuration

### For Each Domain (pornopizza.sk, etc.)

**Vercel (Frontend):**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Fly.io (Backend - API subdomain):**
```
Type: CNAME
Name: api
Value: pizza-ecosystem-api.fly.dev
```

Then in Vercel, add domains:
- pornopizza.sk
- www.pornopizza.sk

## Health Checks

### Backend
```bash
curl https://pizza-ecosystem-api.fly.dev/api/health
```

### Frontend
```bash
curl https://pornopizza.sk
```

## Scaling

### Frontend (Vercel)
Auto-scales automatically. No configuration needed.

### Backend (Fly.io)
```bash
# Scale vertically (more resources)
fly scale vm shared-cpu-1x --memory 512

# Scale horizontally (more instances)
fly scale count 2
```

### Database
```bash
# Fly Postgres
fly volumes extend [volume-id] --size 20 # GB
```

## Backups

### Database (Fly.io)
Automatic daily backups. To restore:
```bash
fly postgres backup restore --app pizza-ecosystem-db [backup-id]
```

### Manual Backup
```bash
fly ssh console -a pizza-ecosystem-db
pg_dump > backup.sql
```

## Rollback

### Frontend (Vercel)
Vercel dashboard → Deployments → Previous deployment → Promote

### Backend (Fly.io)
```bash
fly releases
fly releases rollback [version]
```

## Cost Estimation

**Free Tier:**
- Vercel: Free (Hobby plan)
- Fly.io: ~$5-10/month (3 shared-cpu VMs)
- Database: ~$2-5/month
- **Total: ~$7-15/month**

**Production:**
- Vercel Pro: $20/month
- Fly.io: ~$30/month (dedicated VMs)
- Database: ~$15/month (production tier)
- **Total: ~$65/month**

## Support

### Logs
```bash
# Backend logs
fly logs

# Frontend logs
vercel logs
```

### SSH Access
```bash
fly ssh console
```

## Security Checklist

- [ ] All secrets set via environment variables
- [ ] HTTPS enforced
- [ ] CORS configured
- [ ] Webhook signatures verified
- [ ] Database backups enabled
- [ ] Monitoring active
- [ ] Rate limiting configured
- [ ] Error tracking (Sentry) active










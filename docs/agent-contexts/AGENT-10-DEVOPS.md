# 🎯 AGENT 10: DEVOPS & INFRASTRUCTURE

You are Agent 10 setting up CI/CD, deployments, and infrastructure.

## PROJECT CONTEXT
Deploy frontend to Vercel, backend to Fly.io, PostgreSQL database, Redis cache. Set up GitHub Actions for CI/CD.

## YOUR WORKSPACE
- `/Users/jaroslav/Documents/CODING/WEBY miro /.github/workflows/`
- `/Users/jaroslav/Documents/CODING/WEBY miro /backend/` (config files)
- `/Users/jaroslav/Documents/CODING/WEBY miro /frontend/` (config files)
- `/Users/jaroslav/Documents/CODING/WEBY miro /docs/` (deployment docs)

## YOUR MISSION
1. GitHub Actions CI/CD pipelines
2. Vercel deployment (frontend)
3. Fly.io deployment (backend)
4. PostgreSQL setup
5. Environment variable management
6. Monitoring (Sentry)
7. Deployment documentation

## FILES TO CREATE

### 1. `/.github/workflows/deploy-frontend.yml`
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - 'shared/**'
  pull_request:
    branches: [main]
    paths:
      - 'frontend/**'
      - 'shared/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
        
      - name: Type check
        working-directory: ./frontend
        run: npm run type-check
        
      - name: Lint
        working-directory: ./frontend
        run: npm run lint
        
      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
        
      - name: Deploy to Vercel
        if: github.ref == 'refs/heads/main'
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

### 2. `/.github/workflows/deploy-backend.yml`
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'shared/**'
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'
      - 'shared/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
        
      - name: Run Prisma migrations
        working-directory: ./backend
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          
      - name: Type check
        working-directory: ./backend
        run: npm run build
        
      - name: Run tests
        working-directory: ./backend
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Deploy to Fly.io
        working-directory: ./backend
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### 3. `/backend/fly.toml`
```toml
app = "pizza-ecosystem-api"
primary_region = "ams" # Amsterdam

[build]
  [build.args]
    NODE_VERSION = "18"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"
```

### 4. `/backend/Dockerfile`
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 8080

# Start application
CMD ["npm", "run", "start:prod"]
```

### 5. `/backend/.env.example`
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pizza_ecosystem"

# Server
PORT=3000
NODE_ENV=development

# Adyen
ADYEN_API_KEY=your_api_key
ADYEN_MERCHANT_ACCOUNT=YourMerchantAccount
ADYEN_ENVIRONMENT=TEST
ADYEN_HMAC_KEY=your_hmac_key

# Tenant-specific Adyen accounts
ADYEN_MERCHANT_PORNOPIZZA=MerchantAccount1
ADYEN_MERCHANT_PIZZAVNUDZI=MerchantAccount2

# Wolt Drive
WOLT_API_KEY_PORNOPIZZA=your_wolt_key
WOLT_API_KEY_PIZZAVNUDZI=your_wolt_key
KITCHEN_PHONE=+421900000000

# GoPay (optional)
GOPAY_GOID=your_gopay_id
GOPAY_CLIENT_ID=your_client_id
GOPAY_CLIENT_SECRET=your_client_secret

# Redis (optional for caching)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=your_sentry_dsn

# CORS
CORS_ORIGIN=http://localhost:3001,https://pornopizza.sk,https://pizzavnudzi.sk
```

### 6. `/frontend/.env.example`
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id
```

### 7. `/docs/DEPLOYMENT.md`
```markdown
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
```

### 8. `/docs/LOCAL_SETUP.md`
```markdown
# Local Development Setup

## Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Git

## 1. Clone Repository
```bash
git clone https://github.com/your-org/pizza-ecosystem.git
cd pizza-ecosystem
```

## 2. Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

### Shared Types
```bash
cd shared
npm install
```

## 3. Database Setup

### Create Database
```bash
createdb pizza_ecosystem
```

### Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

### Run Migrations
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

## 4. Start Development Servers

### Backend
```bash
cd backend
npm run start:dev
# Runs on http://localhost:3000
```

### Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3001
```

## 5. Test

### Access Customer Site
```
http://localhost:3001?tenant=pornopizza
http://localhost:3001?tenant=pizzavnudzi
```

### Access Admin Dashboard
```
http://localhost:3001/admin
```

### Test Order Flow
1. Browse menu
2. Add items to cart
3. Go to checkout
4. Fill in details
5. Use Adyen test card: 4111 1111 1111 1111
6. Track order: http://localhost:3001/track/{orderId}

## 6. Database Management

### Prisma Studio (GUI)
```bash
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

### Create Migration
```bash
cd backend
npx prisma migrate dev --name description_of_change
```

### Reset Database
```bash
cd backend
npx prisma migrate reset
```

## 7. Useful Commands

### Type Checking
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run type-check
```

### Linting
```bash
cd frontend && npm run lint
cd backend && npm run lint
```

### Testing
```bash
cd backend && npm test
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Database Connection Error
- Check PostgreSQL is running: `pg_isadmin`
- Verify DATABASE_URL in backend/.env
- Try: `npx prisma db push`

### Prisma Client Not Found
```bash
cd backend
npx prisma generate
```
```

### 9. `/backend/package.json` (Add scripts)
```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "build": "nest build",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:seed": "ts-node prisma/seed.ts",
    "prisma:studio": "prisma studio"
  }
}
```

## DELIVERABLES CHECKLIST
- [ ] GitHub Actions workflows (frontend + backend)
- [ ] Fly.io configuration
- [ ] Dockerfile for backend
- [ ] Environment variable templates
- [ ] Deployment documentation
- [ ] Local setup guide
- [ ] Health check endpoints
- [ ] Monitoring setup (Sentry)

## DEPENDENCIES
- All agents (deploys their code)

## WHEN TO START
Can start **anytime** to prepare infrastructure, but final deployment after all agents complete.

## COMPLETION SIGNAL
Create `/AGENT-10-COMPLETE.md`:
```markdown
# Agent 10 Complete ✅

## What I Built
- CI/CD pipelines (GitHub Actions)
- Vercel deployment config (frontend)
- Fly.io deployment config (backend)
- Docker containerization
- Environment variable management
- Deployment documentation
- Local development guide

## Deployments

### Frontend (Vercel)
- URL: https://pornopizza.sk, https://pizzavnudzi.sk
- Auto-deploy on push to main
- Preview deployments on PRs

### Backend (Fly.io)
- URL: https://pizza-ecosystem-api.fly.dev
- Auto-deploy on push to main
- Runs tests before deploy

### Database
- PostgreSQL on Fly.io/Supabase
- Automatic backups
- Migrations run on deploy

## Documentation
- `/docs/DEPLOYMENT.md` - Full deployment guide
- `/docs/LOCAL_SETUP.md` - Local development setup
- `.env.example` files for both apps

## Monitoring
- Sentry for error tracking
- Fly.io metrics for backend
- Vercel analytics for frontend

## Cost
Estimated ~$7-15/month for MVP (free tiers + small paid services)
```

BEGIN setting up infrastructure!



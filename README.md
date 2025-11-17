# 🍕 Multi-Tenant Pizza Platform

Professional pizza ordering platform supporting multiple brands with shared backend infrastructure.

## 🚀 Features

- **Multi-Tenant Architecture** - One platform, multiple pizza brands
- **Complete Menu Management** - 67 products (pizzas, drinks, sides, desserts, sauces)
- **Admin Dashboard** - Unified management for all brands
- **Order Tracking** - Real-time order status updates
- **Payment Integration** - Adyen & GoPay support
- **Delivery Integration** - Wolt Drive API
- **Email Notifications** - Order confirmations and updates
- **Responsive Design** - Mobile-first approach
- **Beautiful UI/UX** - Modern design with animations

## 📦 Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **PostgreSQL** - Relational database
- **Prisma** - Next-generation ORM
- **TypeScript** - Type-safe development

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe frontend
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animations
- **Zustand** - State management

### Infrastructure
- **Docker** - Containerization
- **Fly.io** - Backend deployment
- **Vercel** - Frontend deployment

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js 14)          │
│  - PornoPizza (pornopizza.localhost)   │
│  - Pizza v Núdzi (pizzavnudzi.localhost)│
│  - Admin Dashboard (/admin)             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Backend API (NestJS)               │
│  - Multi-tenant endpoints               │
│  - Orders, Products, Tenants            │
│  - Payments, Delivery, Email            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      PostgreSQL Database                 │
│  - Tenants, Products, Orders             │
│  - Multi-tenant data isolation          │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (automatically managed via `.nvmrc`)
- PostgreSQL 14+
- fnm (Fast Node Manager) - automatically installed by setup script

### ⚡ Fast Setup (Recommended)

```bash
# Prvýkrát - automatický setup
chmod +x setup.sh start.sh
./setup.sh

# Každý deň - jednoduché spustenie
./start.sh
```

**To je všetko!** Skript automaticky:
- ✅ Prepne na správnu Node verziu (20.19.5)
- ✅ Spustí backend a frontend
- ✅ Počká, kým servery bežia

Pozri [QUICK_START.md](./QUICK_START.md) pre detailné inštrukcie.

### 📋 Manual Setup (Alternative)

1. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Set up database**
```bash
# Create .env file in backend/
DATABASE_URL="postgresql://user:password@localhost:5432/pizza_platform"

# Run migrations
cd backend
npx prisma migrate dev
```

3. **Start development servers**
```bash
# Backend (Terminal 1)
cd backend
npm run start:dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### 🌐 Access the application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001/admin

## 📊 Menu Overview

### PornoPizza Menu (67 items)
- 🍕 **Pizzas**: 28 items (Classic: 13, Premium: 15)
- 🍟 **Sides**: 12 items (Garlic bread, wings, salads, fries)
- 🥤 **Drinks**: 15 items (Sodas, water, beer, wine, juice)
- 🍰 **Desserts**: 8 items (Tiramisu, ice cream, cakes)
- 🧂 **Sauces**: 6 items (Garlic, BBQ, hot, ranch, ketchup)

## 🎯 Project Structure

```
.
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── orders/      # Order management
│   │   ├── products/    # Product management
│   │   ├── tenants/     # Tenant management
│   │   ├── payments/    # Payment processing
│   │   ├── delivery/    # Delivery integration
│   │   └── email/       # Email service
│   └── prisma/          # Database schema & migrations
│
├── frontend/            # Next.js frontend
│   ├── app/             # App Router pages
│   │   ├── admin/       # Admin dashboard
│   │   ├── order/       # Order pages
│   │   └── track/       # Tracking pages
│   ├── components/      # React components
│   └── lib/             # Utilities
│
├── shared/              # Shared TypeScript types
│   └── types/           # Common types
│
└── docs/                # Documentation
    └── agent-contexts/  # Agent context files
```

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://..."
PORT=3000
JWT_SECRET="your-secret-key"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-password"
WOLT_API_KEY="your-wolt-key"
ADYEN_API_KEY="your-adyen-key"
GOPAY_API_KEY="your-gopay-key"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## 📚 Documentation

- [Local Setup Guide](docs/LOCAL_SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Multi-Agent Summary](docs/MULTI_AGENT_SUMMARY.md)
- [Quick Start](docs/QUICK_START.md)

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Backend (Fly.io)
```bash
cd backend
flyctl deploy
```

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

## 📝 License

This project is proprietary software.

## 👥 Contributors

Built with multi-agent development approach.

## 🎉 Status

✅ **Production Ready**
- Complete menu system
- Admin dashboard
- Order tracking
- Payment integration ready
- Delivery integration ready

---

**Built with ❤️ for pizza lovers**

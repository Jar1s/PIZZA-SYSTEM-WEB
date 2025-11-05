# 🍕 Multi-Brand Pizza Ordering System

A scalable multi-tenant platform powering multiple pizza brands (PornoPizza, Pizza v Núdzi, etc.) with unified management.

---

## 🚀 **Quick Start**

```bash
# 1. Install dependencies (DONE ✅)
cd backend && npm install
cd ../frontend && npm install

# 2. Setup database & environment files
# See: COMPLETE_SETUP_GUIDE.md

# 3. Run migrations
cd backend
npx prisma migrate dev
npx prisma db seed

# 4. Start backend
npm run start:dev

# 5. Start frontend (new terminal)
cd ../frontend
npm run dev

# 6. Visit http://localhost:3001?tenant=pornopizza
```

---

## 📁 **Project Structure**

```
├── backend/              # NestJS API
│   ├── src/
│   │   ├── tenants/     # Multi-tenant management ✅
│   │   ├── products/    # Menu & catalog ✅
│   │   ├── orders/      # Order processing ✅
│   │   ├── payments/    # Adyen integration ✅
│   │   └── delivery/    # Wolt Drive API ✅
│   └── prisma/
│       └── schema.prisma # Database schema ✅
│
├── frontend/            # Next.js 14 app
│   ├── app/            # Pages & routing ✅
│   ├── components/     # React components ✅
│   └── hooks/          # Cart state (Zustand) ✅
│
├── shared/             # TypeScript types ✅
│   └── types/          # Shared interfaces
│
└── docs/               # Documentation
    ├── COMPLETE_SETUP_GUIDE.md  # Full setup instructions
    ├── FIXES_APPLIED.md          # Integration fixes done
    ├── agent-contexts/           # Multi-agent dev guides
    └── LOCAL_SETUP.md            # Development guide
```

---

## ✨ **Features**

### **Multi-Tenant Architecture**
- ✅ One codebase, unlimited brands
- ✅ Custom domain per brand
- ✅ Dynamic theming
- ✅ Isolated data per tenant

### **Order Management**
- ✅ Real-time order tracking
- ✅ Status state machine
- ✅ Customer notifications
- ✅ Payment integration (Adyen)

### **Delivery Automation**
- ✅ Wolt Drive integration
- ✅ Automatic courier dispatch
- ✅ Real-time tracking
- ✅ Webhook handling

### **Admin Features**
- ⏳ Multi-brand dashboard (Agent 8 - not started)
- ⏳ Analytics & reporting (Agent 8)
- ⏳ Public order tracking (Agent 9 - not started)

---

## 🛠️ **Tech Stack**

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | NestJS, Node.js 18, TypeScript |
| **Database** | PostgreSQL 15, Prisma ORM |
| **Payments** | Adyen, GoPay (optional) |
| **Delivery** | Wolt Drive API |
| **State** | Zustand (cart), React hooks |
| **Deployment** | Vercel (frontend), Fly.io (backend) |

---

## 📊 **Current Status**

| Module | Status | Agent | Progress |
|--------|--------|-------|----------|
| Shared Types | ✅ Complete | Agent 1 | 100% |
| Database & Tenants | ✅ Complete | Agent 2 | 100% |
| Products & Menu | ✅ Complete | Agent 3 | 100% |
| Orders | ✅ Complete | Agent 4 | 100% |
| Payments (Adyen) | ✅ Complete | Agent 5 | 100% |
| Frontend Customer | ✅ Complete | Agent 6 | 100% |
| Delivery (Wolt) | ✅ Complete | Agent 7 | 100% |
| Admin Dashboard | ⏳ Not Started | Agent 8 | 0% |
| Order Tracking | ⏳ Not Started | Agent 9 | 0% |
| DevOps & CI/CD | ✅ Complete | Agent 10 | 100% |

**Overall: 85% Complete** 🎉

---

## 📖 **Documentation**

- **[COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)** - Full setup instructions
- **[prd.md](./prd.md)** - Product requirements
- **[RULES.md](./RULES.md)** - Development guidelines
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history
- **[docs/agent-contexts/](./docs/agent-contexts/)** - Multi-agent development guides

---

## 🔑 **Environment Variables**

### **Backend (.env)**
```bash
DATABASE_URL=postgresql://...
ADYEN_API_KEY=your_key
WOLT_API_KEY_PORNOPIZZA=your_key
# See .env.example for full list
```

### **Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 🧪 **Testing**

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

---

## 🚢 **Deployment**

### **Frontend (Vercel)**
```bash
cd frontend
vercel --prod
```

### **Backend (Fly.io)**
```bash
cd backend
fly deploy
```

See **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** for detailed instructions.

---

## 📈 **Roadmap**

### **Phase 1: MVP (Current - Week 3-4)**
- [x] Multi-tenant architecture
- [x] Product catalog
- [x] Order management
- [x] Payment integration
- [x] Delivery automation
- [x] Customer frontend
- [ ] Admin dashboard (Agent 8)
- [ ] Order tracking (Agent 9)

### **Phase 2: Operations (Week 5-8)**
- [ ] Analytics & reporting
- [ ] Email/SMS notifications
- [ ] Customer accounts
- [ ] Order history
- [ ] Reviews & ratings

### **Phase 3: Growth (Week 9+)**
- [ ] Loyalty program
- [ ] Mobile apps
- [ ] AI recommendations
- [ ] Marketing automation

---

## 🤝 **Contributing**

This project uses multi-agent development:
- Each agent handles one module
- See `docs/agent-contexts/` for agent instructions
- Follow `RULES.md` for coding standards

---

## 📝 **License**

Private project - All rights reserved

---

## 📞 **Support**

- Documentation: See `/docs`
- Issues: Check `DEBUGFLE.md`
- Setup help: See `COMPLETE_SETUP_GUIDE.md`

---

## 🎉 **Quick Stats**

- **Lines of Code:** ~15,000+
- **Files Created:** 100+
- **Dependencies:** 1,150+
- **Build Time:** ~3 weeks (with multi-agent approach)
- **Team:** 10 specialized agents + 1 integration agent

---

**Ready to launch your multi-brand pizza empire!** 🍕🚀

Start with **[COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)**



# ⚡ Quick Commands Reference

## 🗄️ **Database**

```bash
# Connect to database
psql pizza_ecosystem

# View tenants
psql pizza_ecosystem -c "SELECT slug, name, domain FROM tenants;"

# Prisma Studio (Database GUI)
cd backend && npx prisma studio
# Opens: http://localhost:5555
```

---

## 🚀 **Start Servers**

### **Backend (Choose One)**

```bash
# Option 1: Development mode (has TypeScript warnings)
cd backend
npm run start:dev

# Option 2: With ts-node (bypasses some checks)
cd backend
npx ts-node src/main.ts

# Option 3: Production build
cd backend
npm run build
npm run start:prod
```

### **Frontend**

```bash
cd frontend
npm run dev
```

**Visit:**
- http://localhost:3001?tenant=pornopizza
- http://localhost:3001?tenant=pizzavnudzi

---

## 🧪 **Test APIs**

```bash
# Get all tenants
curl http://localhost:3000/api/tenants

# Get specific tenant
curl http://localhost:3000/api/tenants/pornopizza

# Get products (after adding some)
curl http://localhost:3000/api/pornopizza/products
```

---

## 🔄 **Database Management**

```bash
# Reset database
cd backend
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name

# Seed data again
npx prisma db seed

# View migrations
ls prisma/migrations
```

---

## 📊 **Project Status**

```bash
# Check PostgreSQL service
brew services list | grep postgresql

# Check if backend is running
lsof -i:3000

# Check if frontend is running
lsof -i:3001

# View backend logs
tail -f /tmp/backend.log
```

---

## 🛠️ **Troubleshooting**

```bash
# Kill backend process
pkill -f "npm run start:dev"
# or
lsof -ti:3000 | xargs kill -9

# Kill frontend process
pkill -f "npm run dev"
# or
lsof -ti:3001 | xargs kill -9

# Restart PostgreSQL
brew services restart postgresql@15

# Check database connection
psql pizza_ecosystem -c "SELECT 1;"
```

---

## 📝 **Add Sample Products (Manual)**

Via Prisma Studio:
```bash
cd backend
npx prisma studio
```

1. Open http://localhost:5555
2. Click "Product" table
3. Click "Add record"
4. Fill in:
   - name: "Margherita"
   - priceCents: 890 (€8.90)
   - category: "Pizzas"
   - tenantId: (copy from tenants table)
5. Save

---

## 🎯 **Current Locations**

- **Database:** localhost:5432
- **Backend API:** http://localhost:3000
- **Frontend:** http://localhost:3001
- **Prisma Studio:** http://localhost:5555

---

## ✅ **What's Working**

- ✅ Database running
- ✅ 2 brands seeded
- ✅ All tables created
- ✅ Environment files configured
- ✅ Dependencies installed
- ⚠️ Backend has TypeScript warnings
- ✅ Frontend works independently

---

## 🚀 **Quick Test**

```bash
# Terminal 1: Database GUI
cd backend && npx prisma studio

# Terminal 2: Frontend
cd frontend && npm run dev

# Browser
http://localhost:3001?tenant=pornopizza
http://localhost:5555 (database GUI)
```

---

**Everything is set up! Just waiting for TypeScript warning fixes.**



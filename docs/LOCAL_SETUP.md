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






















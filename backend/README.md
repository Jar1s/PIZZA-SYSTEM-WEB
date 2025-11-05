# Pizza Ecosystem - Backend

Multi-tenant NestJS backend with PostgreSQL and Prisma ORM.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with initial tenants
npm run prisma:seed
```

### Development

```bash
# Start development server
npm run start:dev

# The server will run on http://localhost:3000
```

## 📊 Database

### Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## 🏢 Multi-Tenant Architecture

The system supports multiple pizza brands with isolated data:

### Current Tenants
1. **PornoPizza** (`pornopizza.sk`)
2. **Pizza v Núdzi** (`pizzavnudzi.sk`)

### Database Schema

- **Tenant** - Brand configuration, theme, payment & delivery settings
- **Product** - Menu items (pizza, drinks, etc.)
- **Order** - Customer orders with items
- **OrderItem** - Individual order line items
- **Delivery** - Wolt integration for deliveries

All tables include `tenantId` for data isolation.

## 🔌 API Endpoints

### Tenants
- `GET /api/tenants` - List all active tenants
- `GET /api/tenants/:slug` - Get tenant by slug
- `GET /api/tenants/resolve?domain=...` - Resolve tenant by domain
- `POST /api/tenants` - Create new tenant
- `PATCH /api/tenants/:slug` - Update tenant

### Products
- `GET /api/:tenantSlug/products` - List products for tenant
- `GET /api/:tenantSlug/products/:id` - Get product details
- `POST /api/:tenantSlug/products` - Create product
- `PATCH /api/:tenantSlug/products/:id` - Update product
- `DELETE /api/:tenantSlug/products/:id` - Delete product

### Orders
- `POST /api/:tenantSlug/orders` - Create order
- `GET /api/:tenantSlug/orders` - List orders (with filters)
- `GET /api/:tenantSlug/orders/:id` - Get order details
- `PATCH /api/:tenantSlug/orders/:id/status` - Update order status
- `GET /api/track/:orderId` - Public order tracking

### Payments
- `POST /api/payments/session` - Create payment session (Adyen/GoPay)
- `POST /api/webhooks/adyen` - Adyen webhook (internal)
- `POST /api/webhooks/gopay` - GoPay webhook (internal)

## 🏗️ Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Initial data seeding
├── src/
│   ├── prisma/             # Prisma service module
│   ├── tenants/            # Tenant management
│   ├── app.module.ts       # Root module
│   └── main.ts             # Application entry point
├── package.json
└── tsconfig.json
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Environment Variables

Create a `.env` file in the backend directory with the following variables:

### Required
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/pizza_db?schema=public"
PORT=3000
NODE_ENV=development
```

### Payment Configuration (Adyen)
```bash
ADYEN_API_KEY=your_api_key_here
ADYEN_MERCHANT_ACCOUNT=YourMerchantAccount
ADYEN_ENVIRONMENT=TEST  # TEST or LIVE
ADYEN_HMAC_KEY=your_hmac_key_for_webhooks
```

### Payment Configuration (GoPay - Optional)
```bash
GOPAY_GOID=your_gopay_id
GOPAY_CLIENT_ID=your_client_id
GOPAY_CLIENT_SECRET=your_client_secret
```

### Delivery (Wolt Drive)
```bash
WOLT_DRIVE_API_KEY=your_wolt_drive_api_key
WOLT_DRIVE_MERCHANT_ID=your_merchant_id
```

### Security
```bash
JWT_SECRET=your_jwt_secret_here
```

## 🔒 Security

- CORS enabled for frontend integration
- Tenant isolation at database level
- Environment-based configuration

## 📚 Additional Documentation

- [Multi-Agent Summary](/docs/MULTI_AGENT_SUMMARY.md)
- [Quick Start Guide](/docs/QUICK_START.md)
- [PRD](/prd.md)


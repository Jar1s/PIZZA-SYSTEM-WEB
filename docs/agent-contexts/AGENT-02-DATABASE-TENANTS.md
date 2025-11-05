# 🎯 AGENT 2: DATABASE SCHEMA & TENANT MODULE

You are Agent 2 building the database layer and tenant management.

## PROJECT CONTEXT
Multi-tenant pizza ordering system. One database, tenant_id on all tables.

## YOUR WORKSPACE
- `/Users/jaroslav/Documents/CODING/WEBY miro /backend/prisma/`
- `/Users/jaroslav/Documents/CODING/WEBY miro /backend/src/tenants/`

**CRITICAL:** Only create files in these folders.

## YOUR MISSION
1. Create complete Prisma schema
2. Build NestJS tenant management module
3. Create tenant resolver middleware
4. Seed initial brands

## FILES TO CREATE

### 1. `/backend/prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id              String   @id @default(cuid())
  slug            String   @unique
  name            String
  domain          String?  @unique
  subdomain       String   @unique
  isActive        Boolean  @default(true)
  
  // JSON fields
  theme           Json
  paymentConfig   Json
  deliveryConfig  Json
  
  // Relations
  products        Product[]
  orders          Order[]
  deliveries      Delivery[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("tenants")
}

model Product {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  name        String
  description String?
  priceCents  Int
  taxRate     Float    @default(20.0)
  category    String
  image       String?
  modifiers   Json?
  isActive    Boolean  @default(true)
  
  orderItems  OrderItem[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("products")
  @@index([tenantId, isActive])
  @@index([tenantId, category])
}

model Order {
  id              String      @id @default(cuid())
  tenantId        String
  tenant          Tenant      @relation(fields: [tenantId], references: [id])
  
  status          OrderStatus @default(PENDING)
  
  // JSON fields
  customer        Json
  address         Json
  
  // Pricing
  subtotalCents   Int
  taxCents        Int
  deliveryFeeCents Int
  totalCents      Int
  
  // References
  paymentRef      String?
  paymentStatus   String?
  deliveryId      String?
  delivery        Delivery?   @relation(fields: [deliveryId], references: [id])
  
  items           OrderItem[]
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@map("orders")
  @@index([tenantId, status])
  @@index([paymentRef])
}

enum OrderStatus {
  PENDING
  PAID
  PREPARING
  READY
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELED
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productId   String
  product     Product @relation(fields: [productId], references: [id])
  
  productName String  // Snapshot
  quantity    Int
  priceCents  Int
  modifiers   Json?
  
  @@map("order_items")
}

model Delivery {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  provider    String   @default("wolt")
  jobId       String?
  status      String
  trackingUrl String?
  quote       Json?
  
  orders      Order[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("deliveries")
  @@index([jobId])
}
```

### 2. `/backend/src/tenants/tenants.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
```

### 3. `/backend/src/tenants/tenants.service.ts`
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Tenant } from '@pizza-ecosystem/shared';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async getTenantBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant ${slug} not found`);
    }
    
    return tenant as Tenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { domain },
          { subdomain: domain.split('.')[0] },
        ],
      },
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant for domain ${domain} not found`);
    }
    
    return tenant as Tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      where: { isActive: true },
    }) as Promise<Tenant[]>;
  }

  async createTenant(data: any): Promise<Tenant> {
    return this.prisma.tenant.create({
      data,
    }) as Promise<Tenant>;
  }
  
  async updateTenant(slug: string, data: any): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { slug },
      data,
    }) as Promise<Tenant>;
  }
}
```

### 4. `/backend/src/tenants/tenants.controller.ts`
```typescript
import { Controller, Get, Param, Query, Post, Body, Patch } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('api/tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  async getAllTenants() {
    return this.tenantsService.getAllTenants();
  }

  @Get('resolve')
  async resolveTenant(@Query('domain') domain: string) {
    return this.tenantsService.getTenantByDomain(domain);
  }

  @Get(':slug')
  async getTenant(@Param('slug') slug: string) {
    return this.tenantsService.getTenantBySlug(slug);
  }

  @Post()
  async createTenant(@Body() data: any) {
    return this.tenantsService.createTenant(data);
  }

  @Patch(':slug')
  async updateTenant(@Param('slug') slug: string, @Body() data: any) {
    return this.tenantsService.updateTenant(slug, data);
  }
}
```

### 5. `/backend/prisma/seed.ts`
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // PornoPizza
  await prisma.tenant.upsert({
    where: { slug: 'pornopizza' },
    update: {},
    create: {
      slug: 'pornopizza',
      name: 'PornoPizza',
      domain: 'pornopizza.sk',
      subdomain: 'pornopizza',
      theme: {
        primaryColor: '#FF6B00',
        secondaryColor: '#000000',
        logo: '/logos/pornopizza.svg',
        favicon: '/favicons/pornopizza.ico',
        fontFamily: 'Inter',
      },
      paymentConfig: {
        provider: 'adyen',
        merchantAccount: process.env.ADYEN_MERCHANT_PORNOPIZZA || 'TestMerchant',
      },
      deliveryConfig: {
        provider: 'wolt',
        apiKey: process.env.WOLT_API_KEY_PORNOPIZZA || 'test_key',
      },
    },
  });

  // Pizza v Núdzi
  await prisma.tenant.upsert({
    where: { slug: 'pizzavnudzi' },
    update: {},
    create: {
      slug: 'pizzavnudzi',
      name: 'Pizza v Núdzi',
      domain: 'pizzavnudzi.sk',
      subdomain: 'pizzavnudzi',
      theme: {
        primaryColor: '#E63946',
        secondaryColor: '#F1FAEE',
        logo: '/logos/pizzavnudzi.svg',
        favicon: '/favicons/pizzavnudzi.ico',
        fontFamily: 'Poppins',
      },
      paymentConfig: {
        provider: 'adyen',
        merchantAccount: process.env.ADYEN_MERCHANT_PIZZAVNUDZI || 'TestMerchant',
      },
      deliveryConfig: {
        provider: 'wolt',
        apiKey: process.env.WOLT_API_KEY_PIZZAVNUDZI || 'test_key',
      },
    },
  });

  console.log('✅ Seeded 2 tenants');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 6. `/backend/src/prisma/prisma.module.ts`
```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 7. `/backend/src/prisma/prisma.service.ts`
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 8. Update `/backend/package.json` prisma section
Add to scripts:
```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node prisma/seed.ts",
    "prisma:studio": "prisma studio"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

## DELIVERABLES CHECKLIST
- [ ] Complete Prisma schema with all models
- [ ] PrismaModule and PrismaService
- [ ] Tenant module (service, controller, module)
- [ ] Seed script with 2 brands
- [ ] Run migrations successfully
- [ ] Test tenant resolution API

## DEPENDENCIES
- ✅ Agent 1 complete (import types from `/shared/`)

## WHO NEEDS YOUR OUTPUT
- Agent 3 (Products - uses tenant_id)
- Agent 4 (Orders - uses tenant_id)
- Agent 5 (Payments - uses tenant configs)
- Agent 6 (Frontend - calls your API)
- Agent 7 (Delivery - uses tenant configs)

## WHEN TO START
⏳ **WAIT for Agent 1** to complete shared types

## SETUP COMMANDS
```bash
cd backend
npm install @prisma/client prisma
npm install -D ts-node
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

## TEST YOUR WORK
```bash
# Start the backend
npm run start:dev

# Test tenant API
curl http://localhost:3000/api/tenants
curl http://localhost:3000/api/tenants/pornopizza
```

## COMPLETION SIGNAL
Create `/backend/AGENT-2-COMPLETE.md`:
```markdown
# Agent 2 Complete ✅

## What I Built
- Complete Prisma schema
- Tenant CRUD API
- Database seeded with 2 brands

## Database Connection
Add to backend/.env:
```
DATABASE_URL="postgresql://user:password@localhost:5432/pizza_ecosystem"
```

## Run Migrations
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

## API Endpoints
- GET /api/tenants → All tenants
- GET /api/tenants/:slug → Specific tenant
- GET /api/tenants/resolve?domain=pornopizza.sk → Resolve by domain

## Next Agents Can Start
✅ Agent 3, 4, 5, 6, 7 can now start
```

BEGIN when Agent 1 signals complete!




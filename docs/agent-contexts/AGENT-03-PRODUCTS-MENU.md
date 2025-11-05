# 🎯 AGENT 3: PRODUCTS & MENU MODULE

You are Agent 3 building the product/menu management system with multi-tenant support.

## PROJECT CONTEXT
Products are scoped to tenants. Each brand has its own menu with categories, products, and modifiers (sizes, toppings, etc.).

## YOUR WORKSPACE
`/Users/jaroslav/Documents/CODING/WEBY miro /backend/src/products/`

**CRITICAL:** Only create files in this folder.

## YOUR MISSION
1. Build product CRUD with tenant-scoping
2. Category management
3. Modifier system (sizes, toppings)
4. Menu caching (Redis, 60s TTL)
5. Bulk import/export

## FILES TO CREATE

### 1. `/backend/src/products/products.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesService } from './categories.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [PrismaModule, TenantsModule],
  controllers: [ProductsController],
  providers: [ProductsService, CategoriesService],
  exports: [ProductsService],
})
export class ProductsModule {}
```

### 2. `/backend/src/products/products.service.ts`
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '@pizza-ecosystem/shared';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getProducts(tenantId: string, filters?: {
    category?: string;
    isActive?: boolean;
  }): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    }) as Promise<Product[]>;
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product as Product;
  }

  async createProduct(tenantId: string, data: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({
      data: {
        ...data,
        tenantId,
      },
    }) as Promise<Product>;
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data,
    }) as Promise<Product>;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async bulkImportProducts(tenantId: string, products: CreateProductDto[]): Promise<number> {
    const result = await this.prisma.product.createMany({
      data: products.map(p => ({ ...p, tenantId })),
    });
    return result.count;
  }

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        id: { in: ids },
      },
    }) as Promise<Product[]>;
  }
}
```

### 3. `/backend/src/products/categories.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async getCategories(tenantId: string): Promise<string[]> {
    const products = await this.prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return products.map(p => p.category).sort();
  }
}
```

### 4. `/backend/src/products/products.controller.ts`
```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Param, 
  Body, 
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CategoriesService } from './categories.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@Controller('api/:tenantSlug/products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private tenantsService: TenantsService,
  ) {}

  @Get()
  async getProducts(
    @Param('tenantSlug') tenantSlug: string,
    @Query('category') category?: string,
  ) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    return this.productsService.getProducts(tenant.id, {
      category,
      isActive: true,
    });
  }

  @Get('categories')
  async getCategories(@Param('tenantSlug') tenantSlug: string) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    return this.categoriesService.getCategories(tenant.id);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  // @UseGuards(AdminGuard) // Add when auth is ready
  async createProduct(
    @Param('tenantSlug') tenantSlug: string,
    @Body() data: CreateProductDto,
  ) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    return this.productsService.createProduct(tenant.id, data);
  }

  @Patch(':id')
  // @UseGuards(AdminGuard)
  async updateProduct(
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, data);
  }

  @Delete(':id')
  // @UseGuards(AdminGuard)
  async deleteProduct(@Param('id') id: string) {
    await this.productsService.deleteProduct(id);
    return { message: 'Product deleted' };
  }

  @Post('bulk-import')
  // @UseGuards(AdminGuard)
  async bulkImport(
    @Param('tenantSlug') tenantSlug: string,
    @Body() products: CreateProductDto[],
  ) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    const count = await this.productsService.bulkImportProducts(tenant.id, products);
    return { imported: count };
  }
}
```

### 5. `/backend/src/products/dto/create-product.dto.ts`
```typescript
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ModifierOptionDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  priceCents: number;
}

class ModifierDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  type: 'single' | 'multiple';

  @IsBoolean()
  required: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModifierOptionDto)
  options: ModifierOptionDto[];
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  priceCents: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModifierDto)
  modifiers?: ModifierDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

### 6. `/backend/src/products/dto/update-product.dto.ts`
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

### 7. `/backend/src/products/dto/index.ts`
```typescript
export * from './create-product.dto';
export * from './update-product.dto';
```

### 8. `/backend/prisma/seed-products.ts` (Sample data)
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pornoPizza = await prisma.tenant.findUnique({
    where: { slug: 'pornopizza' },
  });

  if (!pornoPizza) {
    console.error('Run tenant seed first!');
    return;
  }

  // Pizzas
  await prisma.product.create({
    data: {
      tenantId: pornoPizza.id,
      name: 'Margherita XXX',
      description: 'Classic tomato, mozzarella, basil',
      priceCents: 890,
      taxRate: 20.0,
      category: 'Pizzas',
      image: '/products/margherita.jpg',
      modifiers: [
        {
          id: 'size',
          name: 'Size',
          type: 'single',
          required: true,
          options: [
            { id: 'small', name: 'Small (25cm)', priceCents: 0 },
            { id: 'medium', name: 'Medium (30cm)', priceCents: 200 },
            { id: 'large', name: 'Large (35cm)', priceCents: 400 },
          ],
        },
        {
          id: 'toppings',
          name: 'Extra Toppings',
          type: 'multiple',
          required: false,
          options: [
            { id: 'cheese', name: 'Extra Cheese', priceCents: 150 },
            { id: 'pepperoni', name: 'Pepperoni', priceCents: 200 },
            { id: 'mushrooms', name: 'Mushrooms', priceCents: 100 },
          ],
        },
      ],
      isActive: true,
    },
  });

  await prisma.product.create({
    data: {
      tenantId: pornoPizza.id,
      name: 'Pepperoni Passion',
      description: 'Spicy pepperoni, mozzarella, oregano',
      priceCents: 1090,
      taxRate: 20.0,
      category: 'Pizzas',
      image: '/products/pepperoni.jpg',
      modifiers: [
        {
          id: 'size',
          name: 'Size',
          type: 'single',
          required: true,
          options: [
            { id: 'small', name: 'Small (25cm)', priceCents: 0 },
            { id: 'medium', name: 'Medium (30cm)', priceCents: 200 },
            { id: 'large', name: 'Large (35cm)', priceCents: 400 },
          ],
        },
      ],
      isActive: true,
    },
  });

  // Drinks
  await prisma.product.create({
    data: {
      tenantId: pornoPizza.id,
      name: 'Coca-Cola',
      description: '0.5L bottle',
      priceCents: 250,
      taxRate: 20.0,
      category: 'Drinks',
      image: '/products/cola.jpg',
      isActive: true,
    },
  });

  console.log('✅ Seeded products for PornoPizza');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
```

## DELIVERABLES CHECKLIST
- [ ] Products CRUD (tenant-scoped)
- [ ] Categories endpoint
- [ ] Modifier support
- [ ] Bulk import endpoint
- [ ] DTOs with validation
- [ ] Sample product seed data
- [ ] Test all endpoints

## DEPENDENCIES
- ✅ Agent 1 (shared types)
- ✅ Agent 2 (database + tenants)

## WHO NEEDS YOUR OUTPUT
- Agent 4 (Orders - validates product IDs)
- Agent 6 (Frontend - displays menu)
- Agent 8 (Dashboard - product management)

## WHEN TO START
⏳ **WAIT for Agent 2** to complete database

## SETUP COMMANDS
```bash
cd backend
npm install class-validator class-transformer @nestjs/mapped-types
```

## TEST YOUR WORK
```bash
# Seed products
npx ts-node prisma/seed-products.ts

# Test API
curl http://localhost:3000/api/pornopizza/products
curl http://localhost:3000/api/pornopizza/products/categories
```

## COMPLETION SIGNAL
Create `/backend/src/products/AGENT-3-COMPLETE.md`:
```markdown
# Agent 3 Complete ✅

## What I Built
- Product CRUD with tenant-scoping
- Categories service
- Modifier system (sizes, toppings)
- Bulk import
- Sample products seeded

## API Endpoints
- GET /api/:tenantSlug/products → All products
- GET /api/:tenantSlug/products/categories → Categories
- GET /api/:tenantSlug/products/:id → Single product
- POST /api/:tenantSlug/products → Create (admin)
- PATCH /api/:tenantSlug/products/:id → Update (admin)
- DELETE /api/:tenantSlug/products/:id → Delete (admin)
- POST /api/:tenantSlug/products/bulk-import → Bulk create (admin)

## Next Agents Can Start
✅ Agent 4, 6 can now use products
```

BEGIN when Agent 2 signals complete!




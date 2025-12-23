import { Injectable, NotFoundException, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product, ProductTenantOverride } from '@pizza-ecosystem/shared';
import { CreateProductDto, UpdateProductDto } from './dto';
import { getProductDisplayName } from '../utils/product-name-mapper';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => TenantsService))
    private tenantsService: TenantsService,
  ) {}

  async getProducts(tenantSlug: string, filters?: {
    category?: string;
    isActive?: boolean;
  }): Promise<Product[]> {
    // Get tenant ID
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    
    // Force fresh query - bypass any potential Prisma cache
    // Fetch products: shared (tenantId = null) OR tenant-specific (tenantId = tenant.id)
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { tenantId: null },           // Shared products
          { tenantId: tenant.id }       // Tenant-specific products
        ],
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
      // Explicitly select all fields to avoid any caching
      select: {
        id: true,
        tenantId: true,
        slug: true,
        name: true,
        description: true,
        priceCents: true,
        taxRate: true,
        category: true,
        image: true,
        modifiers: true,
        isActive: true,
        isBestSeller: true,
        weightGrams: true,    // Gramáž z databázy
        allergens: true,      // Alergény z databázy
        displayName: true,    // Webový názov
        subHeader: true,      // Sub-header
        tenantOverrides: true, // Per-tenant customization
        createdAt: true,
        updatedAt: true,
      } as any,  // Type assertion needed until Prisma client regenerated on Render
    });
    
    // Apply tenant overrides for shared products
    const productsWithOverrides = products.map(p => this.applyTenantOverrides(p as any, tenantSlug));
    
    // Apply fallback logic for display name: DB value → mapping → name
    // Note: displayName is language-agnostic, but we still apply fallback for consistency
    const productsWithFallback = productsWithOverrides.map((product: any) => ({
      ...product,
      displayName: product.displayName ?? getProductDisplayName(product.name, 'sk') ?? product.name,
    }));
    
    // Log prices for debugging (always log for these specific products to track price issues)
    const premiumSins = ['Basil Pesto Premium', 'Honey Chilli', 'Pollo Crema', 'Prosciutto Crudo Premium'];
    const deluxeFetish = ['Quattro Formaggi', 'Quattro Formaggi Bianco', 'Tonno', 'Vegetariana Premium', 'Hot Missionary'];
    const productsToLog = [...premiumSins, ...deluxeFetish];
    
    productsToLog.forEach(name => {
      const p = productsWithFallback.find(pr => pr.name === name);
      if (p) {
        this.logger.log(`[getProducts] ${p.name}: ${p.priceCents} cents = €${(p.priceCents / 100).toFixed(2)}`);
      }
    });
    
    return productsWithFallback as any as Product[];
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    // Apply fallback logic for display name: DB value → mapping → name
    const productWithFallback = {
      ...product,
      displayName: (product as any).displayName ?? getProductDisplayName(product.name, 'sk') ?? product.name,
    };

    return productWithFallback as any as Product;
  }

  async getProductBySlug(slug: string, tenantSlug: string): Promise<Product | null> {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    
    const product = await this.prisma.product.findFirst({
      where: {
        slug: slug,
        OR: [
          { tenantId: null },
          { tenantId: tenant.id }
        ],
        isActive: true
      }
    });
    
    if (!product) return null;
    
    // Apply tenant overrides
    const productWithOverrides = this.applyTenantOverrides(product as any, tenantSlug);
    
    // Apply fallback logic for display name
    return {
      ...productWithOverrides,
      displayName: (productWithOverrides as any).displayName ?? getProductDisplayName(product.name, 'sk') ?? product.name,
    } as any as Product;
  }

  applyTenantOverrides(product: any, tenantSlug: string): any {
    // Only apply overrides to shared products (tenantId = null)
    if (product.tenantId !== null) return product;
    
    const overrides = product.tenantOverrides?.[tenantSlug] as ProductTenantOverride | undefined;
    if (!overrides) return product;
    
    return {
      ...product,
      displayName: overrides.displayName || product.displayName,
      description: overrides.description || product.description,
      subHeader: overrides.subHeader || product.subHeader,
      image: overrides.image || product.image,
    };
  }

  async updateProductOverrides(
    productId: string,
    tenantSlug: string,
    overrides: ProductTenantOverride
  ): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    
    // Only allow overrides on shared products
    if (product.tenantId !== null) {
      throw new BadRequestException('Cannot set overrides on tenant-specific products');
    }
    
    const currentOverrides = (product.tenantOverrides as any) || {};
    const updatedOverrides = {
      ...currentOverrides,
      [tenantSlug]: overrides
    };
    
    return this.prisma.product.update({
      where: { id: productId },
      data: { tenantOverrides: updatedOverrides }
    }) as any as Product;
  }

  async getProductOverrides(
    productId: string,
    tenantSlug: string
  ): Promise<ProductTenantOverride | null> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    
    const overrides = product.tenantOverrides as any;
    return overrides?.[tenantSlug] || null;
  }

  async createProduct(tenantId: string | null, data: CreateProductDto): Promise<Product> {
    // Generate slug from name if not provided
    const slug = (data as any).slug || this.generateSlug(data.name);
    
    const product = await this.prisma.product.create({
      data: {
        ...data,
        slug,
        tenantId, // null for shared products, tenant.id for tenant-specific
      } as any,
    });
    return product as any as Product;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    // Chránené polia: name - NEDAJÚ SA MENIŤ
    // Description a priceCents môžu byť updatované
    // Odstránime chránené polia z dát pred update, aby sme zabezpečili, že sa nezmenia
    const { name, ...allowedFields } = data as any;
    
    // Log warning ak sa niekto pokúša zmeniť chránené polia
    if (name !== undefined) {
      this.logger.warn(
        `Attempted to update protected field (name) for product ${id}. ` +
        `This field is locked and cannot be changed.`
      );
    }
    
    const product = await this.prisma.product.update({
      where: { id },
      data: allowedFields,
    });
    return product as any as Product;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async bulkImportProducts(tenantId: string | null, products: CreateProductDto[]): Promise<number> {
    const result = await this.prisma.product.createMany({
      data: products.map(p => ({
        ...p,
        slug: (p as any).slug || this.generateSlug(p.name),
        tenantId,
      })) as any,
    });
    return result.count;
  }

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: ids },
      },
    });
    
    // Apply fallback logic for display name: DB value → mapping → name
    const productsWithFallback = products.map(product => ({
      ...product,
      displayName: (product as any).displayName ?? getProductDisplayName(product.name, 'sk') ?? product.name,
    }));
    
    return productsWithFallback as any as Product[];
  }

  async updateProductPrices(tenantId: string): Promise<{ updated: number; errors: string[] }> {
    const pizzaUpdates = [
      { name: 'Basil Pesto Premium', priceCents: 1199 },
      { name: 'Honey Chilli', priceCents: 1099 },
      { name: 'Pollo Crema', priceCents: 1099 },
      { name: 'Prosciutto Crudo Premium', priceCents: 1199 },
      { name: 'Quattro Formaggi', priceCents: 1099 },
      { name: 'Quattro Formaggi Bianco', priceCents: 1099 },
      { name: 'Tonno', priceCents: 1099 },
      { name: 'Vegetariana Premium', priceCents: 1099 },
      { name: 'Hot Missionary', priceCents: 1099 },
    ];

    let updated = 0;
    const errors: string[] = [];

    for (const update of pizzaUpdates) {
      try {
        const product = await this.prisma.product.findFirst({
          where: {
            tenantId,
            name: update.name,
          },
        });

        if (product) {
          await this.prisma.product.update({
            where: { id: product.id },
            data: { priceCents: update.priceCents },
          });
          this.logger.log(`✅ Updated ${update.name}: ${update.priceCents} cents = €${(update.priceCents / 100).toFixed(2)}`);
          updated++;
        } else {
          errors.push(`${update.name} not found`);
        }
      } catch (error) {
        errors.push(`${update.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { updated, errors };
  }
}



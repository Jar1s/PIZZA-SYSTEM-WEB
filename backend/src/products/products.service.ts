import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '@pizza-ecosystem/shared';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  
  constructor(private prisma: PrismaService) {}

  async getProducts(tenantId: string, filters?: {
    category?: string;
    isActive?: boolean;
  }): Promise<Product[]> {
    // Force fresh query - bypass any potential Prisma cache
    // Use findMany with explicit select to ensure we get latest data
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
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
        name: true,
        description: true,
        priceCents: true,
        taxRate: true,
        category: true,
        image: true,
        modifiers: true,
        isActive: true,
        isBestSeller: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    // Log prices for debugging (always log for these specific products to track price issues)
    const premiumSins = ['Basil Pesto Premium', 'Honey Chilli', 'Pollo Crema', 'Prosciutto Crudo Premium'];
    const deluxeFetish = ['Quattro Formaggi', 'Quattro Formaggi Bianco', 'Tonno', 'Vegetariana Premium', 'Hot Missionary'];
    const productsToLog = [...premiumSins, ...deluxeFetish];
    
    productsToLog.forEach(name => {
      const p = products.find(pr => pr.name === name);
      if (p) {
        this.logger.log(`[getProducts] ${p.name}: ${p.priceCents} cents = €${(p.priceCents / 100).toFixed(2)}`);
      }
    });
    
    return products as any as Product[];
    
    // Log prices for debugging (always log for these specific products to track price issues)
    const premiumSins = ['Basil Pesto Premium', 'Honey Chilli', 'Pollo Crema', 'Prosciutto Crudo Premium'];
    const deluxeFetish = ['Quattro Formaggi', 'Quattro Formaggi Bianco', 'Tonno', 'Vegetariana Premium', 'Hot Missionary'];
    const productsToLog = [...premiumSins, ...deluxeFetish];
    
    productsToLog.forEach(name => {
      const p = products.find(pr => pr.name === name);
      if (p) {
        this.logger.log(`[getProducts] ${p.name}: ${p.priceCents} cents = €${(p.priceCents / 100).toFixed(2)}`);
      }
    });
    
    return products as any as Product[];
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product as any as Product;
  }

  async createProduct(tenantId: string, data: CreateProductDto): Promise<Product> {
    const product = await this.prisma.product.create({
      data: {
        ...data,
        tenantId,
      } as any,
    });
    return product as any as Product;
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data: data as any,
    });
    return product as any as Product;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async bulkImportProducts(tenantId: string, products: CreateProductDto[]): Promise<number> {
    const result = await this.prisma.product.createMany({
      data: products.map(p => ({ ...p, tenantId })) as any,
    });
    return result.count;
  }

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: ids },
      },
    });
    return products as any as Product[];
  }
}



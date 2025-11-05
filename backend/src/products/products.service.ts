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



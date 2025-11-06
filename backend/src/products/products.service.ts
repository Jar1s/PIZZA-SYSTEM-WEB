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



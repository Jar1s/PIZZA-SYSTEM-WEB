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










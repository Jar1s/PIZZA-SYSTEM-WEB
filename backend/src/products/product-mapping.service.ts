import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductMappingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Konvertuje externý identifikátor (kód alebo názov) na interný názov produktu
   */
  async resolveToInternalName(
    tenantId: string,
    externalIdentifier: string,
    source?: string
  ): Promise<string> {
    // Nájdeme mapovanie
    const mapping = await this.prisma.productMapping.findFirst({
      where: {
        tenantId,
        externalIdentifier,
        ...(source && { source }),
      },
    });

    if (mapping) {
      // Overíme, že produkt s týmto interným názvom existuje
      const product = await this.prisma.product.findFirst({
        where: {
          tenantId,
          name: mapping.internalProductName,
          isActive: true,
        },
      });

      if (product) {
        return mapping.internalProductName;
      }
    }

    // Ak sa nenašlo mapovanie, skúsime nájsť produkt priamo podľa názvu
    const product = await this.prisma.product.findFirst({
      where: {
        tenantId,
        name: externalIdentifier,
        isActive: true,
      },
    });

    if (product) {
      return product.name; // Vrátime interný názov
    }

    throw new NotFoundException(
      `Product not found for identifier: ${externalIdentifier}`
    );
  }

  /**
   * Pridá mapovanie externého identifikátora na interný názov
   */
  async addMapping(
    tenantId: string,
    externalIdentifier: string,
    internalProductName: string,
    source?: string
  ) {
    // Overíme, že produkt existuje
    const product = await this.prisma.product.findFirst({
      where: {
        tenantId,
        name: internalProductName,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with name "${internalProductName}" not found`
      );
    }

    return await this.prisma.productMapping.upsert({
      where: {
        tenantId_externalIdentifier_source: {
          tenantId,
          externalIdentifier,
          source: source || null,
        },
      },
      create: {
        tenantId,
        externalIdentifier,
        internalProductName,
        source: source || null,
      },
      update: {
        internalProductName,
      },
    });
  }

  /**
   * Získa všetky mapovania pre produkt
   */
  async getMappingsForProduct(tenantId: string, internalProductName: string) {
    return await this.prisma.productMapping.findMany({
      where: {
        tenantId,
        internalProductName,
      },
    });
  }
}









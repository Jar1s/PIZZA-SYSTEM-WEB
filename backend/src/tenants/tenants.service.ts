import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Tenant } from '@pizza-ecosystem/shared';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async getTenantById(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }
    
    return tenant as Tenant;
  }

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


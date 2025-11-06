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
    
    return tenant as any as Tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant ${slug} not found`);
    }
    
    return tenant as any as Tenant;
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
    
    return tenant as any as Tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: { isActive: true },
    });
    return tenants as any as Tenant[];
  }

  async createTenant(data: any): Promise<Tenant> {
    const tenant = await this.prisma.tenant.create({
      data,
    });
    return tenant as any as Tenant;
  }
  
  async updateTenant(slug: string, data: any): Promise<Tenant> {
    const tenant = await this.prisma.tenant.update({
      where: { slug },
      data,
    });
    return tenant as any as Tenant;
  }
}


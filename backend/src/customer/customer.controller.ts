import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { TenantsService } from '../tenants/tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const logger = new Logger('CustomerController');

@Controller('customer/account')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(
    private customerService: CustomerService,
    private tenantsService: TenantsService,
  ) {}


  private async resolveTenant(req: any) {
    const headerTenant = (req.headers?.['x-tenant'] as string | undefined)?.toString();
    const host = (req.headers?.['host'] || '').toString().split(':')[0];
    const hostTenant = host ? await this.tenantsService.findTenantByDomain(host) : null;

    if (headerTenant) {
      try {
        const tenant = await this.tenantsService.getTenantBySlug(headerTenant);
        return tenant;
      } catch (e) {
        // fall back to host
      }
    }

    if (hostTenant) {
      return hostTenant;
    }

    throw new BadRequestException('Tenant not provided');
  }

  private assertTenantMatch(user: any, tenant: any) {
    if (!tenant || !user?.tenantId || user.tenantId !== tenant.id) {
      throw new UnauthorizedException('Unauthorized');
    }
  }

  private sanitizeUser(user: any) {
    if (!user) {
      return null;
    }
    const email = typeof user.email === 'string' ? user.email : '';
    const redactedEmail = email ? `${email.slice(0, 2)}***` : undefined;

    return {
      id: user.id,
      role: user.role,
      email: redactedEmail,
    };
  }
  /**
   * Get customer orders
   */
  @Get('orders')
  async getOrders(@Request() req: any) {
    logger.log(`getOrders request received: ${JSON.stringify(this.sanitizeUser(req.user))}`);
    const user = req.user;
    if (!user || user.role !== 'CUSTOMER') {
      logger.warn(`getOrders unauthorized: ${JSON.stringify({ hasUser: !!user, role: user?.role })}`);
      throw new UnauthorizedException('Unauthorized');
    }

    if (!user.email) {
      throw new UnauthorizedException('Customer email not found');
    }

    const tenant = await this.resolveTenant(req);
    this.assertTenantMatch(user, tenant);

    // Normalize email for consistent matching (lowercase, trim)
    const normalizedEmail = user.email.toLowerCase().trim();
    logger.log('Fetching orders for authenticated customer');
    const orders = await this.customerService.getCustomerOrders(user.id, tenant.id, normalizedEmail);
    logger.log(`Found ${orders.length} customer orders`);
    return { orders };
  }

  /**
   * Get customer profile
   */
  @Get('profile')
  async getProfile(@Request() req: any) {
    const user = req.user;
    if (!user || user.role !== 'CUSTOMER') {
      throw new UnauthorizedException('Unauthorized');
    }

    const tenant = await this.resolveTenant(req);
    this.assertTenantMatch(user, tenant);

    return this.customerService.getCustomerProfile(user.id);
  }

  /**
   * Update customer profile
   */
  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() data: { name?: string; email?: string; phone?: string }) {
    try {
    const user = req.user;
    if (!user || user.role !== 'CUSTOMER') {
      throw new UnauthorizedException('Unauthorized');
    }

      const tenant = await this.resolveTenant(req);
      this.assertTenantMatch(user, tenant);

      return await this.customerService.updateCustomerProfile(user.id, tenant.id, data);
    } catch (error: any) {
      logger.error(
        `updateProfile error: ${error?.message || 'unknown error'}`,
        error?.stack,
      );
      // Re-throw known exceptions
      if (error instanceof UnauthorizedException || error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // For unknown errors, throw generic error
      throw new BadRequestException(error.message || 'Failed to update profile');
    }
  }

  /**
   * Get customer addresses
   */
  @Get('addresses')
  async getAddresses(@Request() req: any) {
    try {
    logger.log(`getAddresses request received: ${JSON.stringify(this.sanitizeUser(req.user))}`);
    const user = req.user;
    if (!user || user.role !== 'CUSTOMER') {
      logger.warn(`getAddresses unauthorized: ${JSON.stringify({ hasUser: !!user, role: user?.role })}`);
      throw new UnauthorizedException('Unauthorized');
    }

      const tenant = await this.resolveTenant(req);
      this.assertTenantMatch(user, tenant);

      const result = await this.customerService.getCustomerAddresses(user.id);
      return result;
    } catch (error) {
      logger.error(
        `getAddresses error: ${(error as Error)?.message || 'unknown error'}`,
        (error as Error)?.stack,
      );
      // If it's an UnauthorizedException, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // For other errors, return empty addresses array to prevent 500 error
      return {
        addresses: [],
      };
    }
  }

  /**
   * Create customer address
   */
  @Post('addresses')
  async createAddress(
    @Request() req: any,
    @Body() data: {
      street: string;
      description?: string;
      city?: string;
      postalCode?: string;
      country?: string;
      coordinates?: {
        lat: number;
        lng: number;
      } | null;
      isPrimary?: boolean;
    },
  ) {
    try {
      logger.log(`createAddress request received: ${JSON.stringify(this.sanitizeUser(req.user))}`);
      logger.log(
        `createAddress payload metadata: ${JSON.stringify({
          hasStreet: !!data.street,
          hasDescription: !!data.description,
          hasCity: !!data.city,
          hasPostalCode: !!data.postalCode,
          hasCountry: !!data.country,
          hasCoordinates: !!data.coordinates,
          isPrimary: data.isPrimary,
        })}`,
      );
      const user = req.user;
      if (!user || user.role !== 'CUSTOMER') {
        logger.warn(`createAddress unauthorized: ${JSON.stringify({ hasUser: !!user, role: user?.role })}`);
        throw new UnauthorizedException('Unauthorized');
      }

      const tenant = await this.resolveTenant(req);
      this.assertTenantMatch(user, tenant);

      // Validate required fields
      if (!data.street || !data.street.trim()) {
        throw new BadRequestException('Street address is required');
      }
      if (!data.city || !data.city.trim()) {
        throw new BadRequestException('City is required');
      }
      if (!data.postalCode || !data.postalCode.trim()) {
        throw new BadRequestException('Postal code is required');
      }

      return await this.customerService.createCustomerAddress(user.id, data);
    } catch (error: any) {
      logger.error(
        `createAddress error: ${error?.message || 'unknown error'}`,
        error?.stack,
      );
      logger.error(`createAddress error details: ${JSON.stringify({
        message: error?.message,
        name: error?.name,
        code: error?.code,
      })}`);
      // Re-throw known exceptions
      if (error instanceof UnauthorizedException || error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // For database errors, provide a more user-friendly message
      if (error?.code === 'P2002') {
        throw new BadRequestException('Address already exists');
      }
      // For unknown errors, throw generic error with details
      throw new BadRequestException(error.message || 'Failed to create address');
    }
  }

  /**
   * Update customer address
   */
  @Patch('addresses/:id')
  async updateAddress(
    @Request() req: any,
    @Param('id') addressId: string,
    @Body() data: {
      street?: string;
      description?: string;
      city?: string;
      postalCode?: string;
      country?: string;
      coordinates?: {
        lat: number;
        lng: number;
      } | null;
      isPrimary?: boolean;
    },
  ) {
    const user = req.user;
    if (!user || user.role !== 'CUSTOMER') {
      throw new UnauthorizedException('Unauthorized');
    }

    const tenant = await this.resolveTenant(req);
    this.assertTenantMatch(user, tenant);

    return this.customerService.updateCustomerAddress(user.id, addressId, data);
  }

  /**
   * Delete customer address
   */
  @Delete('addresses/:id')
  async deleteAddress(@Request() req: any, @Param('id') addressId: string) {
    const user = req.user;
    if (!user || user.role !== 'CUSTOMER') {
      throw new UnauthorizedException('Unauthorized');
    }

    const tenant = await this.resolveTenant(req);
    this.assertTenantMatch(user, tenant);

    return this.customerService.deleteCustomerAddress(user.id, addressId);
  }
}

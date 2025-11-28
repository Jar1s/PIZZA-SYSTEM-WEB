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
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('customer/account')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  /**
   * Get customer orders
   */
  @Get('orders')
  async getOrders(@Request() req: any) {
    console.log('[CustomerController] getOrders - user from request:', req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : 'null');
    const user = req.user;
    if (!user || user.role !== 'CUSTOMER') {
      console.error('[CustomerController] getOrders - Unauthorized:', { user: !!user, role: user?.role });
      throw new UnauthorizedException('Unauthorized');
    }

    if (!user.email) {
      throw new UnauthorizedException('Customer email not found');
    }
    
    // Normalize email for consistent matching (lowercase, trim)
    const normalizedEmail = user.email.toLowerCase().trim();
    console.log('[CustomerController] Fetching orders for email:', normalizedEmail);
    const orders = await this.customerService.getCustomerOrders(normalizedEmail);
    console.log('[CustomerController] Found orders:', orders.length);
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

      return await this.customerService.updateCustomerProfile(user.id, data);
    } catch (error: any) {
      console.error('[CustomerController] updateProfile error:', error);
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
    console.log('[CustomerController] getAddresses - user from request:', req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : 'null');
    const user = req.user;
    if (!user || user.role !== 'CUSTOMER') {
      console.error('[CustomerController] getAddresses - Unauthorized:', { user: !!user, role: user?.role });
      throw new UnauthorizedException('Unauthorized');
    }

      const result = await this.customerService.getCustomerAddresses(user.id);
      return result;
    } catch (error) {
      console.error('[CustomerController] getAddresses - Error:', error);
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
      isPrimary?: boolean;
    },
  ) {
    try {
      console.log('[CustomerController] createAddress - user from request:', req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : 'null');
      console.log('[CustomerController] createAddress - data:', data);
      const user = req.user;
      if (!user || user.role !== 'CUSTOMER') {
        console.error('[CustomerController] createAddress - Unauthorized:', { user: !!user, role: user?.role });
        throw new UnauthorizedException('Unauthorized');
      }

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
      console.error('[CustomerController] createAddress - Error:', error);
      console.error('[CustomerController] createAddress - Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        code: error?.code,
      });
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
      isPrimary?: boolean;
    },
  ) {
    const user = req.user;
    if (!user || user.role !== 'CUSTOMER') {
      throw new UnauthorizedException('Unauthorized');
    }

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

    return this.customerService.deleteCustomerAddress(user.id, addressId);
  }
}


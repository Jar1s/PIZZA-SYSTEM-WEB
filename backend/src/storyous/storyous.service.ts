import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class StoryousService {
  private readonly logger = new Logger(StoryousService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  
  private readonly apiBaseUrl = 'https://api.storyous.com';
  
  constructor(
    @Inject(forwardRef(() => SettingsService))
    private settingsService: SettingsService,
  ) {}

  private async getConfig() {
    // Try to get from database first
    const dbConfig = await this.settingsService.getStoryousSettings();
    if (dbConfig?.clientId && dbConfig?.clientSecret) {
      return {
        clientId: dbConfig.clientId,
        clientSecret: dbConfig.clientSecret,
        enabled: dbConfig.enabled,
      };
    }
    
    // Fallback to environment variables
    return {
      clientId: process.env.STORYOUS_CLIENT_ID,
      clientSecret: process.env.STORYOUS_CLIENT_SECRET,
      enabled: process.env.STORYOUS_ENABLED === 'true',
    };
  }

  async getAccessToken(): Promise<string> {
    const config = await this.getConfig();
    
    if (!config.enabled || !config.clientId || !config.clientSecret) {
      throw new Error('Storyous is not configured');
    }

    // Check if token is still valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiresAt) {
      const bufferTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      if (bufferTime < this.tokenExpiresAt) {
        return this.accessToken;
      }
    }

    // Request new token
    const response = await fetch('https://login.storyous.com/api/auth/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get Storyous token: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = new Date(data.expires_at);
    
    this.logger.log('✅ Storyous access token obtained');
    return this.accessToken;
  }

  async createOrder(order: Order, merchantId: string, placeId: string): Promise<any> {
    const config = await this.getConfig();
    if (!config.enabled) {
      this.logger.debug('Storyous integration disabled, skipping');
      return null;
    }

    try {
      const token = await this.getAccessToken();
      const customer = order.customer as any;
      const address = order.address as any;
      
      // Map order items to Storyous format
      const items = order.items.map(item => {
        const itemData: any = {
          name: item.productName,
          quantity: item.quantity,
          price: item.priceCents / 100, // Convert cents to euros
        };
        
        // Add modifiers if available
        if (item.modifiers) {
          itemData.modifiers = item.modifiers;
        }
        
        return itemData;
      });
      
      const orderData = {
        merchant_id: merchantId,
        place_id: placeId,
        items: items,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || null,
        },
        delivery_address: {
          street: address.street,
          city: address.city,
          postal_code: address.postalCode,
          country: address.country || 'SK',
          description: address.description || address.instructions || null,
        },
        total: order.totalCents / 100,
        subtotal: order.subtotalCents / 100,
        tax: order.taxCents / 100,
        delivery_fee: order.deliveryFeeCents / 100,
        external_id: order.id, // Your order ID for reference
        status: this.mapOrderStatus(order.status),
      };

      const response = await fetch(`${this.apiBaseUrl}/delivery/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Storyous API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      this.logger.log(`✅ Order ${order.id} sent to Storyous: ${result.id || 'success'}`);
      return result;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send order ${order.id} to Storyous:`, error.message);
      throw error; // Re-throw so caller can handle
    }
  }

  async updateOrderStatus(storyousOrderId: string, status: OrderStatus): Promise<void> {
    const config = await this.getConfig();
    if (!config.enabled) {
      return;
    }

    try {
      const token = await this.getAccessToken();
      const mappedStatus = this.mapOrderStatus(status);
      
      const response = await fetch(`${this.apiBaseUrl}/delivery/orders/${storyousOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: mappedStatus }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Storyous status update error: ${error}`);
      }

      this.logger.log(`✅ Storyous order ${storyousOrderId} status updated to ${mappedStatus}`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to update Storyous order status:`, error.message);
      throw error;
    }
  }

  private mapOrderStatus(status: OrderStatus): string {
    // Map your order statuses to Storyous statuses
    const statusMap: Record<OrderStatus, string> = {
      PENDING: 'pending',
      PAID: 'paid',
      PREPARING: 'preparing',
      READY: 'ready',
      OUT_FOR_DELIVERY: 'out_for_delivery',
      DELIVERED: 'delivered',
      CANCELED: 'cancelled',
    };
    return statusMap[status] || 'pending';
  }
}










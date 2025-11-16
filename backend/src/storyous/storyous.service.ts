import { Injectable, Logger } from '@nestjs/common';
import { Order, OrderStatus } from '@pizza-ecosystem/shared';

@Injectable()
export class StoryousService {
  private readonly logger = new Logger(StoryousService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  
  private readonly clientId = process.env.STORYOUS_CLIENT_ID;
  private readonly clientSecret = process.env.STORYOUS_CLIENT_SECRET;
  private readonly apiBaseUrl = 'https://api.storyous.com';
  private readonly enabled = process.env.STORYOUS_ENABLED === 'true';

  async getAccessToken(): Promise<string> {
    if (!this.enabled || !this.clientId || !this.clientSecret) {
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
        client_id: this.clientId,
        client_secret: this.clientSecret,
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
    if (!this.enabled) {
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
    if (!this.enabled) {
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


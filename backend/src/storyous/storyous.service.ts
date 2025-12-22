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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:37',message:'getAccessToken entry',data:{enabled:config.enabled,hasClientId:!!config.clientId,hasClientSecret:!!config.clientSecret,hasCachedToken:!!this.accessToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!config.enabled || !config.clientId || !config.clientSecret) {
      throw new Error('Storyous is not configured');
    }

    // Check if token is still valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiresAt) {
      const bufferTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      if (bufferTime < this.tokenExpiresAt) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:48',message:'using cached token',data:{tokenLength:this.accessToken.length,expiresAt:this.tokenExpiresAt.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return this.accessToken;
      }
    }

    // Request new token
    const tokenUrl = 'https://login.storyous.com/api/auth/authorize';
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:54',message:'requesting new token',data:{url:tokenUrl,hasClientId:!!config.clientId,hasClientSecret:!!config.clientSecret},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const response = await fetch(tokenUrl, {
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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:66',message:'token response',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      const error = await response.text();
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:70',message:'token error',data:{status:response.status,error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      throw new Error(`Failed to get Storyous token: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = new Date(data.expires_at);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:76',message:'token obtained',data:{hasToken:!!this.accessToken,tokenLength:this.accessToken?.length||0,expiresAt:this.tokenExpiresAt.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    this.logger.log('✅ Storyous access token obtained');
    return this.accessToken;
  }

  async createOrder(order: Order, merchantId: string, placeId: string): Promise<any> {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:78',message:'createOrder entry',data:{orderId:order.id,merchantId,placeId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const config = await this.getConfig();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:81',message:'config loaded',data:{enabled:config.enabled,hasClientId:!!config.clientId,hasClientSecret:!!config.clientSecret},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!config.enabled) {
      this.logger.debug('Storyous integration disabled, skipping');
      return null;
    }

    try {
      const token = await this.getAccessToken();
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:90',message:'access token obtained',data:{hasToken:!!token,tokenLength:token?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:129',message:'request body prepared',data:{merchantId,placeId,itemsCount:items.length,hasCustomer:!!customer,hasAddress:!!address,total:orderData.total,status:orderData.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      const requestUrl = `${this.apiBaseUrl}/delivery/orders`;
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:132',message:'request URL',data:{url:requestUrl,method:'POST'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:141',message:'response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        const error = await response.text();
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:145',message:'error response',data:{status:response.status,error,requestUrl,requestBody:orderData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        throw new Error(`Storyous API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      this.logger.log(`✅ Order ${order.id} sent to Storyous: ${result.id || 'success'}`);
      return result;
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyous.service.ts:152',message:'exception caught',data:{errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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










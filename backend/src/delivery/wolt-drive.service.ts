import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Address } from '@pizza-ecosystem/shared';

interface WoltLocation {
  lat: number;
  lon: number;
}

interface ShipmentPromiseSnapshot {
  promiseId?: string;
  feeCents?: number;
  etaMinutes?: number;
  validUntil?: string;
  currency?: string;
  distance?: number;
}

interface WoltApiConfig {
  apiUrl?: string;
  merchantId?: string;
  venueId?: string;
}

interface WoltApiEndpoints {
  deliveriesUrl: string;
  shipmentPromisesUrl: string;
  orderStatusUrl: string;
}

interface DeliveryCreateContext {
  parcelPriceCents?: number;
  parcelCurrency?: string;
  orderNumber?: string | number | null;
  supportEmail?: string;
  supportUrl?: string;
}

@Injectable()
export class WoltDriveService {
  private readonly logger = new Logger(WoltDriveService.name);
  private readonly defaultApiBaseUrl = 'https://daas-public-api.wolt.com/v1';

  private resolveApiEndpoints(apiConfig?: WoltApiConfig): WoltApiEndpoints {
    const venueId = apiConfig?.venueId?.trim();
    if (!venueId) {
      throw new BadRequestException('Wolt Venue ID nie je nastavené pre tento tenant.');
    }

    const rawApiUrl = apiConfig?.apiUrl?.trim();
    const rootUrl = rawApiUrl || 'https://daas-public-api.wolt.com';
    const normalized = rootUrl.replace(/\/+$/, '');

    let apiBase = this.defaultApiBaseUrl;
    const v1Index = normalized.indexOf('/v1');
    if (v1Index >= 0) {
      apiBase = normalized.slice(0, v1Index + 3);
    } else if (normalized) {
      apiBase = `${normalized}/v1`;
    }

    const venuePath = `${apiBase}/venues/${encodeURIComponent(venueId)}`;

    return {
      deliveriesUrl: `${venuePath}/deliveries`,
      shipmentPromisesUrl: `${venuePath}/shipment-promises`,
      orderStatusUrl: `${venuePath}/order`,
    };
  }
  
  /**
   * Get kitchen phone number with validation
   * Throws error if not configured (no hardcoded fallback)
   */
  private getKitchenPhone(pickupAddress: Address & { phone?: string }): string {
    // Priority: pickupAddress.phone > KITCHEN_PHONE env variable
    const phone = pickupAddress.phone || process.env.KITCHEN_PHONE;
    
    if (!phone) {
      throw new BadRequestException(
        'Kitchen phone number not configured. ' +
        'Please set pickupAddress.phone in tenant delivery config or KITCHEN_PHONE environment variable.'
      );
    }
    
    return phone;
  }

  /**
   * Coordinates are mandatory for Wolt requests.
   * Never silently fallback to 0,0 because that creates invalid jobs.
   */
  private getValidatedLocation(address: Address, label: 'pickup' | 'dropoff'): WoltLocation {
    const lat = address.coordinates?.lat;
    const lng = address.coordinates?.lng;

    if (
      typeof lat !== 'number' ||
      Number.isNaN(lat) ||
      typeof lng !== 'number' ||
      Number.isNaN(lng)
    ) {
      throw new BadRequestException(
        `Missing or invalid ${label} coordinates for Wolt delivery. Please set geolocation first.`,
      );
    }

    return { lat, lon: lng };
  }
  
  /**
   * Delay helper for exponential backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable (network/timeout errors)
   */
  private isRetryableError(error: any, response?: Response): boolean {
    // Network errors (fetch failed)
    if (!response && error instanceof TypeError) {
      return true;
    }
    
    // Timeout or connection errors
    if (error?.message?.includes('timeout') || 
        error?.message?.includes('ECONNREFUSED') ||
        error?.message?.includes('ENOTFOUND')) {
      return true;
    }
    
    // 5xx server errors (retryable)
    if (response && response.status >= 500) {
      return true;
    }
    
    // 429 Too Many Requests (retryable)
    if (response && response.status === 429) {
      return true;
    }
    
    // 4xx client errors (not retryable)
    return false;
  }

  /**
   * Format Wolt API error into user-friendly message
   */
  private formatWoltError(response: Response, errorData: any): string {
    const status = response.status;
    const statusText = response.statusText;

    // Handle specific error cases
    if (status === 401) {
      return 'Wolt API autentifikácia zlyhala. Skontrolujte, či máte správne API kľúče nakonfigurované v nastaveniach.';
    }

    if (status === 403) {
      return 'Wolt API odmietol požiadavku. Skontrolujte oprávnenia vášho API kľúča.';
    }

    if (status === 404) {
      return 'Wolt API endpoint nebol nájdený. Skontrolujte konfiguráciu.';
    }

    if (status === 400) {
      const message = errorData?.message || errorData?.error || 'Neplatná požiadavka';
      if (message.includes('pickup') || message.includes('dropoff')) {
        return `Neplatná adresa: ${message}`;
      }
      return `Neplatná požiadavka: ${message}`;
    }

    if (status === 422) {
      const message = errorData?.message || errorData?.error || 'Nedá sa spracovať';
      return `Wolt API nemôže spracovať požiadavku: ${message}`;
    }

    // Generic error message with details from API if available
    const apiMessage = errorData?.message || errorData?.error || statusText;
    return `Wolt API chyba (${status}): ${apiMessage}`;
  }

  async getQuote(
    apiKey: string,
    _pickupAddress: Address,
    dropoffAddress: Address,
    maxRetries = 3,
    apiConfig?: WoltApiConfig,
  ) {
    const dropoffLocation = this.getValidatedLocation(dropoffAddress, 'dropoff');
    const { shipmentPromisesUrl } = this.resolveApiEndpoints(apiConfig);

    const request = {
      street: dropoffAddress.street,
      city: dropoffAddress.city,
      post_code: dropoffAddress.postalCode,
      country: dropoffAddress.country,
      lat: dropoffLocation.lat,
      lon: dropoffLocation.lon,
      min_preparation_time_minutes: 30,
      order_details: {
        items: [
          {
            quantity: 1,
            name: 'Order',
          },
        ],
      },
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(shipmentPromisesUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const userFriendlyMessage = this.formatWoltError(response, errorData);
          const error = new Error(userFriendlyMessage);
          (error as any).status = response.status;
          (error as any).originalError = errorData;
          if (!this.isRetryableError(error, response)) {
            throw error;
          }
          lastError = error;
          throw error;
        }

        const data = await response.json();
        
        return {
          feeCents: data?.price?.amount || data?.fee?.amount || 0,
          etaMinutes: data?.dropoff?.eta_minutes || data?.dropoff_eta || 0,
          distance: data?.distance || 0,
          currency: data?.price?.currency || data?.fee?.currency || 'EUR',
          promiseId: data?.id,
          validUntil: data?.valid_until,
        };
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if error is retryable
        if (!this.isRetryableError(error, undefined)) {
          this.logger.error('Non-retryable error from Wolt API', { error: lastError.message });
          throw lastError;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          this.logger.error(`Wolt API getQuote failed after ${maxRetries} attempts`, { 
            error: lastError.message,
            attempts: maxRetries,
          });
          throw lastError;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt) * 1000;
        this.logger.warn(`Wolt API getQuote attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delayMs}ms`, {
          error: lastError.message,
        });
        
        await this.delay(delayMs);
      }
    }
    
    // Should never reach here, but TypeScript needs it
    throw lastError || new Error('Wolt API getQuote failed');
  }

  /**
   * Get shipment promise from Wolt Drive API (correct endpoint according to documentation)
   * This is the proper way to check availability and get pricing before creating a delivery
   */
  async getShipmentPromise(
    apiKey: string,
    _pickupAddress: Address,
    dropoffAddress: Address,
    customerName: string,
    customerPhone: string,
    maxRetries = 3,
    apiConfig?: WoltApiConfig,
  ) {
    const dropoffLocation = this.getValidatedLocation(dropoffAddress, 'dropoff');
    const { shipmentPromisesUrl } = this.resolveApiEndpoints(apiConfig);

    const request = {
      street: dropoffAddress.street,
      city: dropoffAddress.city,
      post_code: dropoffAddress.postalCode,
      country: dropoffAddress.country,
      lat: dropoffLocation.lat,
      lon: dropoffLocation.lon,
      min_preparation_time_minutes: 30,
      order_details: {
        customer: {
          name: customerName,
          phone_number: customerPhone,
        },
        items: [
          {
            quantity: 1,
            name: 'Pizza order',
          },
        ],
      },
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Use correct endpoint: /shipment-promises (not /deliveries/quote)
        const response = await fetch(shipmentPromisesUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const userFriendlyMessage = this.formatWoltError(response, errorData);
          const error = new Error(userFriendlyMessage);
          (error as any).status = response.status;
          (error as any).originalError = errorData;
          
          if (!this.isRetryableError(error, response)) {
            throw error; // Don't retry 4xx errors
          }
          lastError = error;
          throw error;
        }

        const data = await response.json();
        
        return {
          promiseId: data.id, // Required for delivery creation
          feeCents: data?.price?.amount || data?.fee?.amount || 0, // Wolt returns in cents
          etaMinutes: data?.dropoff?.eta_minutes || data?.dropoff_eta || 0,
          validUntil: data.valid_until, // ISO 8601 timestamp
          currency: data?.price?.currency || data?.fee?.currency || 'EUR',
          distance: data.distance,
        };
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if error is retryable
        if (!this.isRetryableError(error, undefined)) {
          this.logger.error('Non-retryable error from Wolt API', { error: lastError.message });
          throw lastError;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          this.logger.error(`Wolt API getShipmentPromise failed after ${maxRetries} attempts`, { 
            error: lastError.message,
            attempts: maxRetries,
          });
          throw lastError;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt) * 1000;
        this.logger.warn(`Wolt API getShipmentPromise attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delayMs}ms`, {
          error: lastError.message,
        });
        
        await this.delay(delayMs);
      }
    }
    
    // Should never reach here, but TypeScript needs it
    throw lastError || new Error('Wolt API getShipmentPromise failed');
  }

  async createDelivery(
    apiKey: string,
    orderId: string,
    pickupAddress: Address & { phone?: string }, // Extended Address with optional phone
    dropoffAddress: Address,
    customerName: string,
    customerPhone: string,
    shipmentPromiseId?: string, // Optional: if provided, use shipment promise ID
    promiseSnapshot?: ShipmentPromiseSnapshot,
    maxRetries = 3,
    apiConfig?: WoltApiConfig,
    context?: DeliveryCreateContext,
  ) {
    const dropoffLocation = this.getValidatedLocation(dropoffAddress, 'dropoff');
    const { deliveriesUrl } = this.resolveApiEndpoints(apiConfig);

    const effectivePromiseId = shipmentPromiseId || promiseSnapshot?.promiseId;
    const parcelCurrency =
      context?.parcelCurrency || promiseSnapshot?.currency || 'EUR';
    const parcelPriceCents =
      typeof context?.parcelPriceCents === 'number' ? context.parcelPriceCents : 0;
    const supportEmail = context?.supportEmail || process.env.WOLT_SUPPORT_EMAIL;
    const supportUrl = context?.supportUrl || process.env.FRONTEND_URL;
    const orderNumber = context?.orderNumber != null ? String(context.orderNumber) : orderId;

    const request: Record<string, unknown> = {
      pickup: {
        comment: pickupAddress.instructions || 'Kitchen entrance - call on arrival',
      },
      dropoff: {
        location: {
          coordinates: {
            lat: dropoffLocation.lat,
            lon: dropoffLocation.lon,
          },
        },
        comment: dropoffAddress.instructions || '',
        options: {
          is_no_contact: false,
        },
      },
      recipient: {
        name: customerName,
        phone_number: customerPhone,
      },
      parcels: [
        {
          description: 'Pizza order',
          identifier: orderId,
          count: 1,
          price: {
            amount: parcelPriceCents,
            currency: parcelCurrency,
          },
        },
      ],
      merchant_order_reference_id: orderId,
      order_number: orderNumber,
    };

    // Add shipment promise ID if provided (required by Wolt API for proper flow)
    if (effectivePromiseId) {
      request.shipment_promise_id = effectivePromiseId;
    }

    const customerSupport: Record<string, unknown> = {
      phone_number: this.getKitchenPhone(pickupAddress),
    };
    if (supportEmail) {
      customerSupport.email = supportEmail;
    }
    if (supportUrl) {
      customerSupport.url = supportUrl;
    }
    request.customer_support = customerSupport;

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(deliveriesUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const userFriendlyMessage = this.formatWoltError(response, errorData);
          const error = new Error(userFriendlyMessage);
          (error as any).status = response.status;
          (error as any).originalError = errorData;
          
          if (!this.isRetryableError(error, response)) {
            throw error; // Don't retry 4xx errors
          }
          lastError = error;
          throw error;
        }

        const data = await response.json();

        const feeCents =
          typeof data?.price?.amount === 'number'
            ? data.price.amount
            : promiseSnapshot?.feeCents;
        const etaMinutes =
          typeof data?.dropoff?.eta_minutes === 'number'
            ? data.dropoff.eta_minutes
            : promiseSnapshot?.etaMinutes;
        const distance =
          typeof data?.distance === 'number' ? data.distance : promiseSnapshot?.distance;
        const currency =
          typeof data?.price?.currency === 'string'
            ? data.price.currency
            : promiseSnapshot?.currency;
        
        return {
          jobId: data.wolt_order_reference_id || data.id || null,
          trackingUrl: data?.tracking?.url || null,
          status: data?.status || 'INFO_RECEIVED',
          courierEta: etaMinutes,
          feeCents,
          etaMinutes,
          distance,
          currency,
          promiseId: request.shipment_promise_id,
          validUntil: promiseSnapshot?.validUntil,
        };
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if error is retryable
        if (!this.isRetryableError(error, undefined)) {
          this.logger.error('Non-retryable error from Wolt API', { 
            error: lastError.message,
            orderId,
          });
          throw lastError;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          this.logger.error(`Wolt API createDelivery failed after ${maxRetries} attempts`, { 
            error: lastError.message,
            orderId,
            attempts: maxRetries,
          });
          throw lastError;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt) * 1000;
        this.logger.warn(`Wolt API createDelivery attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delayMs}ms`, {
          error: lastError.message,
          orderId,
        });
        
        await this.delay(delayMs);
      }
    }
    
    // Should never reach here, but TypeScript needs it
    throw lastError || new Error('Wolt API createDelivery failed');
  }

  async cancelDelivery(apiKey: string, jobId: string, maxRetries = 3, apiConfig?: WoltApiConfig) {
    let lastError: Error | null = null;
    const { orderStatusUrl } = this.resolveApiEndpoints(apiConfig);
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${orderStatusUrl}/${encodeURIComponent(jobId)}/status/cancel`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reject_reason: 'OTHER',
            reject_details: 'Cancelled by merchant',
          }),
        });

        if (!response.ok) {
          const error = new Error(`Wolt API error: ${response.statusText}`);
          if (!this.isRetryableError(error, response)) {
            throw error; // Don't retry 4xx errors
          }
          lastError = error;
          throw error;
        }

        return response.json();
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if error is retryable
        if (!this.isRetryableError(error, undefined)) {
          this.logger.error('Non-retryable error from Wolt API', { 
            error: lastError.message,
            jobId,
          });
          throw lastError;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          this.logger.error(`Wolt API cancelDelivery failed after ${maxRetries} attempts`, { 
            error: lastError.message,
            jobId,
            attempts: maxRetries,
          });
          throw lastError;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt) * 1000;
        this.logger.warn(`Wolt API cancelDelivery attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delayMs}ms`, {
          error: lastError.message,
          jobId,
        });
        
        await this.delay(delayMs);
      }
    }
    
    // Should never reach here, but TypeScript needs it
    throw lastError || new Error('Wolt API cancelDelivery failed');
  }
}









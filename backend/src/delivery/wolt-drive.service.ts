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
  pickupEtaMinutes?: number;
  dropoffEtaMinutes?: number;
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
  merchantAreasUrl: string;
}

interface DeliveryCreateContext {
  parcelPriceCents?: number;
  parcelCurrency?: string;
  merchantOrderReferenceId?: string | number | null;
  orderNumber?: string | number | null;
  supportEmail?: string;
  supportPhone?: string;
  supportUrl?: string;
  recipientEmail?: string | null;
  promiseSnapshot?: ShipmentPromiseSnapshot;
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
    const orderRoot = v1Index >= 0 ? normalized.slice(0, v1Index) : normalized;

    const venuePath = `${apiBase}/venues/${encodeURIComponent(venueId)}`;

    return {
      deliveriesUrl: `${venuePath}/deliveries`,
      shipmentPromisesUrl: `${venuePath}/shipment-promises`,
      // Live order endpoints are not under /v1 in Wolt Drive docs.
      orderStatusUrl: `${orderRoot || normalized}/order`,
      merchantAreasUrl: `${apiBase}/merchants`,
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

  private parseOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value.trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return undefined;
  }

  private firstNumber(...candidates: unknown[]): number | undefined {
    for (const candidate of candidates) {
      const parsed = this.parseOptionalNumber(candidate);
      if (typeof parsed === 'number') {
        return parsed;
      }
    }
    return undefined;
  }

  private extractEtaMinutes(data: any): {
    etaMinutes?: number;
    pickupEtaMinutes?: number;
    dropoffEtaMinutes?: number;
  } {
    const pickupEtaMinutes = this.firstNumber(
      data?.pickup?.eta_minutes,
      data?.pickup?.etaMinutes,
      data?.pickup_eta,
      data?.pickup_eta_minutes,
      data?.courier?.pickup_eta_minutes,
      data?.courier?.pickup_eta,
    );

    const dropoffEtaMinutes = this.firstNumber(
      data?.dropoff?.eta_minutes,
      data?.dropoff?.etaMinutes,
      data?.dropoff_eta,
      data?.dropoff_eta_minutes,
      data?.courier?.dropoff_eta_minutes,
      data?.courier?.dropoff_eta,
    );

    return {
      // Keep backward compatibility: etaMinutes remains "arrival to customer" by default.
      etaMinutes: dropoffEtaMinutes ?? pickupEtaMinutes,
      pickupEtaMinutes,
      dropoffEtaMinutes,
    };
  }

  private getWoltRootUrl(apiConfig?: WoltApiConfig): string {
    const rawApiUrl = apiConfig?.apiUrl?.trim();
    const normalized = (rawApiUrl || 'https://daas-public-api.wolt.com').replace(/\/+$/, '');
    const v1Index = normalized.indexOf('/v1');
    return v1Index >= 0 ? normalized.slice(0, v1Index) : normalized;
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
    const extractedMessage = this.extractApiErrorMessage(errorData);

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
      const message = extractedMessage || 'Neplatná požiadavka';
      if (message.toLowerCase().includes('outside of the delivery area')) {
        return 'Adresa zákazníka je mimo doručovacej zóny Wolt pre túto prevádzku.';
      }
      if (message.includes('pickup') || message.includes('dropoff')) {
        return `Neplatná adresa: ${message}`;
      }
      return `Neplatná požiadavka: ${message}`;
    }

    if (status === 422) {
      const message =
        extractedMessage ||
        (errorData && typeof errorData === 'object'
          ? JSON.stringify(errorData).slice(0, 500)
          : '') ||
        'Nedá sa spracovať';
      return `Wolt API nemôže spracovať požiadavku: ${message}`;
    }

    // Generic error message with details from API if available
    const apiMessage = extractedMessage || statusText;
    return `Wolt API chyba (${status}): ${apiMessage}`;
  }

  private extractApiErrorMessage(errorData: any): string {
    const directCandidates = [
      errorData?.message,
      errorData?.error,
      errorData?.detail,
      errorData?.title,
      errorData?.reason,
      errorData?.description,
    ];

    for (const candidate of directCandidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    const errorsList = Array.isArray(errorData?.errors)
      ? errorData.errors
      : Array.isArray(errorData?.validation_errors)
        ? errorData.validation_errors
        : null;

    if (errorsList && errorsList.length > 0) {
      const rendered = errorsList
        .map((entry: any) => {
          if (typeof entry === 'string') {
            return entry.trim();
          }

          if (entry && typeof entry === 'object') {
            return (
              (typeof entry.message === 'string' && entry.message.trim()) ||
              (typeof entry.detail === 'string' && entry.detail.trim()) ||
              (typeof entry.error === 'string' && entry.error.trim()) ||
              JSON.stringify(entry)
            );
          }

          return '';
        })
        .filter(Boolean)
        .join('; ');

      if (rendered) {
        return rendered;
      }
    }

    if (typeof errorData?.raw === 'string' && errorData.raw.trim()) {
      return errorData.raw.trim();
    }

    return '';
  }

  private async buildApiError(response: Response): Promise<Error> {
    const rawBody = await response.text().catch(() => '');
    let errorData: any = {};

    if (rawBody) {
      try {
        errorData = JSON.parse(rawBody);
      } catch {
        errorData = { raw: rawBody.slice(0, 1000) };
      }
    }

    const userFriendlyMessage = this.formatWoltError(response, errorData);
    const error = new Error(userFriendlyMessage);
    (error as any).status = response.status;
    (error as any).originalError = errorData;
    return error;
  }

  async getQuote(
    apiKey: string,
    _pickupAddress: Address,
    dropoffAddress: Address,
    maxRetries = 3,
    apiConfig?: WoltApiConfig,
    minPreparationTimeMinutes = 20,
  ) {
    const dropoffLocation = this.getValidatedLocation(dropoffAddress, 'dropoff');
    const { shipmentPromisesUrl } = this.resolveApiEndpoints(apiConfig);

    // Strict payload based on Wolt docs:
    // POST /v1/venues/{venue_id}/shipment-promises
    // accepted fields: street, city, post_code, lat, lon, language,
    // min_preparation_time_minutes, scheduled_dropoff_time (+ optional parcels/cash for fees).
    const request = {
      street: dropoffAddress.street,
      city: dropoffAddress.city,
      post_code: dropoffAddress.postalCode,
      lat: dropoffLocation.lat,
      lon: dropoffLocation.lon,
      min_preparation_time_minutes: minPreparationTimeMinutes,
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
          const error = await this.buildApiError(response);
          if (!this.isRetryableError(error, response)) {
            throw error;
          }
          lastError = error;
          throw error;
        }

        const data = await response.json();
        const eta = this.extractEtaMinutes(data);
        
        return {
          feeCents: data?.price?.amount || data?.fee?.amount || 0,
          etaMinutes: eta.etaMinutes || 0,
          pickupEtaMinutes: eta.pickupEtaMinutes,
          dropoffEtaMinutes: eta.dropoffEtaMinutes,
          distance: data?.distance || 0,
          currency: data?.price?.currency || data?.fee?.currency || 'EUR',
          promiseId: data?.id,
          validUntil: data?.valid_until,
        };
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if error is retryable
        if (!this.isRetryableError(error, undefined)) {
          this.logger.error('Non-retryable error from Wolt API', {
            error: lastError.message,
            status: (error as any)?.status,
            originalError: (error as any)?.originalError,
          });
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
    minPreparationTimeMinutes = 20,
  ) {
    const dropoffLocation = this.getValidatedLocation(dropoffAddress, 'dropoff');
    const { shipmentPromisesUrl } = this.resolveApiEndpoints(apiConfig);

    const request = {
      street: dropoffAddress.street,
      city: dropoffAddress.city,
      post_code: dropoffAddress.postalCode,
      lat: dropoffLocation.lat,
      lon: dropoffLocation.lon,
      min_preparation_time_minutes: minPreparationTimeMinutes,
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
          const error = await this.buildApiError(response);
          
          if (!this.isRetryableError(error, response)) {
            throw error; // Don't retry 4xx errors
          }
          lastError = error;
          throw error;
        }

        const data = await response.json();
        const eta = this.extractEtaMinutes(data);
        
        return {
          promiseId: data.id, // Required for delivery creation
          feeCents: data?.price?.amount || data?.fee?.amount || 0, // Wolt returns in cents
          etaMinutes: eta.etaMinutes || 0,
          pickupEtaMinutes: eta.pickupEtaMinutes,
          dropoffEtaMinutes: eta.dropoffEtaMinutes,
          validUntil: data.valid_until, // ISO 8601 timestamp
          currency: data?.price?.currency || data?.fee?.currency || 'EUR',
          distance: data.distance,
        };
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if error is retryable
        if (!this.isRetryableError(error, undefined)) {
          this.logger.error('Non-retryable error from Wolt API', {
            error: lastError.message,
            status: (error as any)?.status,
            originalError: (error as any)?.originalError,
          });
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
    minPreparationTimeMinutes?: number,
    maxRetries = 3,
    apiConfig?: WoltApiConfig,
    context?: DeliveryCreateContext,
  ) {
    const dropoffLocation = this.getValidatedLocation(dropoffAddress, 'dropoff');
    const { deliveriesUrl } = this.resolveApiEndpoints(apiConfig);
    const promiseSnapshot = (context as any)?.promiseSnapshot as ShipmentPromiseSnapshot | undefined;

    const effectivePromiseId = shipmentPromiseId || promiseSnapshot?.promiseId;
    const parcelCurrency =
      context?.parcelCurrency || promiseSnapshot?.currency || 'EUR';
    const parcelPriceCents =
      typeof context?.parcelPriceCents === 'number' ? context.parcelPriceCents : 0;
    const supportEmail =
      context?.supportEmail ||
      process.env.WOLT_SUPPORT_EMAIL ||
      process.env.SMTP_FROM_EMAIL ||
      'support@example.com';
    const supportPhone = context?.supportPhone || pickupAddress.phone || process.env.KITCHEN_PHONE;
    const supportUrl = context?.supportUrl || process.env.FRONTEND_URL || 'https://example.com';
    const merchantOrderReferenceId =
      context?.merchantOrderReferenceId != null ? String(context.merchantOrderReferenceId) : orderId;
    const orderNumber = context?.orderNumber != null ? String(context.orderNumber) : null;

    const request: Record<string, unknown> = {
      pickup: {
        comment: pickupAddress.instructions || 'Kitchen entrance - call on arrival',
        options: {},
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
        ...(context?.recipientEmail ? { email: context.recipientEmail } : {}),
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
      merchant_order_reference_id: merchantOrderReferenceId,
      customer_support: {
        email: supportEmail,
        url: supportUrl,
        ...(supportPhone ? { phone_number: supportPhone } : {}),
      },
      sms_notifications: {
        received: 'Vaša objednávka bola prijatá a čoskoro ju vyzdvihne kuriér Wolt. Sledovanie: TRACKING_LINK',
        picked_up: 'Kuriér Wolt už prevzal vašu objednávku. Sledovanie: TRACKING_LINK',
      },
    };

    if (typeof promiseSnapshot?.feeCents === 'number') {
      request.price = {
        amount: promiseSnapshot.feeCents,
        currency: promiseSnapshot.currency || parcelCurrency,
      };
    }

    if (orderNumber) {
      request.order_number = orderNumber;
    }

    // Add shipment promise ID if provided (required by Wolt API for proper flow)
    if (effectivePromiseId) {
      request.shipment_promise_id = effectivePromiseId;
    }

    // ASAP pickup control - lets operator influence courier arrival to pickup
    if (typeof minPreparationTimeMinutes === 'number' && Number.isFinite(minPreparationTimeMinutes)) {
      (request.pickup as { options: Record<string, unknown> }).options.min_preparation_time_minutes =
        minPreparationTimeMinutes;
    }

    this.logger.log('[Wolt] Creating delivery request', {
      orderId,
      shipmentPromiseId: shipmentPromiseId || null,
      minPreparationTimeMinutes:
        (request.pickup as { options?: { min_preparation_time_minutes?: number } }).options
          ?.min_preparation_time_minutes ?? null,
    });

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
          const error = await this.buildApiError(response);
          
          if (!this.isRetryableError(error, response)) {
            throw error; // Don't retry 4xx errors
          }
          lastError = error;
          throw error;
        }

        const data = await response.json();
        const eta = this.extractEtaMinutes(data);

        const feeCents =
          typeof data?.price?.amount === 'number'
            ? data.price.amount
            : promiseSnapshot?.feeCents;
        const etaMinutes =
          typeof eta.etaMinutes === 'number' ? eta.etaMinutes : promiseSnapshot?.etaMinutes;
        const pickupEtaMinutes =
          typeof eta.pickupEtaMinutes === 'number'
            ? eta.pickupEtaMinutes
            : promiseSnapshot?.pickupEtaMinutes;
        const dropoffEtaMinutes =
          typeof eta.dropoffEtaMinutes === 'number'
            ? eta.dropoffEtaMinutes
            : promiseSnapshot?.dropoffEtaMinutes;
        const distance =
          typeof data?.distance === 'number' ? data.distance : promiseSnapshot?.distance;
        const currency =
          typeof data?.price?.currency === 'string'
            ? data.price.currency
            : promiseSnapshot?.currency;
        
        const woltOrderReferenceId = data.wolt_order_reference_id || data.id || null;

        return {
          jobId: woltOrderReferenceId,
          woltOrderReferenceId,
          trackingId: data?.tracking?.id || null,
          trackingUrl: data?.tracking?.url || null,
          status: data?.status || 'INFO_RECEIVED',
          courierEta: etaMinutes,
          feeCents,
          etaMinutes,
          pickupEtaMinutes,
          dropoffEtaMinutes,
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
            status: (error as any)?.status,
            originalError: (error as any)?.originalError,
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
            reason: 'Cancelled by merchant',
          }),
        });

        if (!response.ok) {
          const error = await this.buildApiError(response);
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

  async listWebhooks(apiKey: string, merchantId: string, maxRetries = 2, apiConfig?: WoltApiConfig) {
    const trimmedMerchantId = String(merchantId || '').trim();
    if (!trimmedMerchantId) {
      throw new BadRequestException('Wolt Merchant ID nie je nastavený pre tento tenant.');
    }

    const url = `${this.getWoltRootUrl(apiConfig)}/v1/merchants/${encodeURIComponent(trimmedMerchantId)}/webhooks`;
    return this.fetchWoltWebhookEndpoint(apiKey, url, { method: 'GET' }, maxRetries, 'listWebhooks');
  }

  async createWebhook(
    apiKey: string,
    merchantId: string,
    callbackUrl: string,
    clientSecret: string,
    maxRetries = 2,
    apiConfig?: WoltApiConfig,
  ) {
    const trimmedMerchantId = String(merchantId || '').trim();
    if (!trimmedMerchantId) {
      throw new BadRequestException('Wolt Merchant ID nie je nastavený pre tento tenant.');
    }

    const url = `${this.getWoltRootUrl(apiConfig)}/v1/merchants/${encodeURIComponent(trimmedMerchantId)}/webhooks`;
    return this.fetchWoltWebhookEndpoint(
      apiKey,
      url,
      {
        method: 'POST',
        body: JSON.stringify({
          callback_config: {
            exponential_retry_backoff: {
              exponent_base: 5,
              max_retry_count: 3,
            },
          },
          callback_url: callbackUrl,
          client_secret: clientSecret,
          disabled: false,
        }),
      },
      maxRetries,
      'createWebhook',
    );
  }

  async updateWebhook(
    apiKey: string,
    merchantId: string,
    webhookId: string,
    callbackUrl: string,
    clientSecret: string,
    maxRetries = 2,
    apiConfig?: WoltApiConfig,
  ) {
    const trimmedMerchantId = String(merchantId || '').trim();
    const trimmedWebhookId = String(webhookId || '').trim();
    if (!trimmedMerchantId) {
      throw new BadRequestException('Wolt Merchant ID nie je nastavený pre tento tenant.');
    }
    if (!trimmedWebhookId) {
      throw new BadRequestException('Wolt webhook ID is required.');
    }

    const url = `${this.getWoltRootUrl(apiConfig)}/v1/merchants/${encodeURIComponent(trimmedMerchantId)}/webhooks/${encodeURIComponent(trimmedWebhookId)}`;
    return this.fetchWoltWebhookEndpoint(
      apiKey,
      url,
      {
        method: 'PATCH',
        body: JSON.stringify({
          callback_config: {
            exponential_retry_backoff: {
              exponent_base: 5,
              max_retry_count: 3,
            },
          },
          callback_url: callbackUrl,
          client_secret: clientSecret,
          disabled: false,
        }),
      },
      maxRetries,
      'updateWebhook',
    );
  }

  private async fetchWoltWebhookEndpoint(
    apiKey: string,
    url: string,
    init: RequestInit,
    maxRetries: number,
    operation: string,
  ) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...init,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...(init.headers || {}),
          },
        });

        if (!response.ok) {
          const error = await this.buildApiError(response);
          if (!this.isRetryableError(error, response)) {
            throw error;
          }
          lastError = error;
          throw error;
        }

        if (response.status === 204) {
          return { ok: true };
        }

        return await response.json();
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!this.isRetryableError(error, undefined)) {
          this.logger.error(`Non-retryable error from Wolt API ${operation}`, {
            error: lastError.message,
            status: (error as any)?.status,
            originalError: (error as any)?.originalError,
          });
          throw lastError;
        }

        if (attempt === maxRetries - 1) {
          this.logger.error(`Wolt API ${operation} failed after ${maxRetries} attempts`, {
            error: lastError.message,
            attempts: maxRetries,
          });
          throw lastError;
        }

        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError || new Error(`Wolt API ${operation} failed`);
  }

  async getDeliveryAreas(
    apiKey: string,
    merchantId: string,
    maxRetries = 2,
    apiConfig?: WoltApiConfig,
  ): Promise<any> {
    const trimmedMerchantId = String(merchantId || '').trim();
    if (!trimmedMerchantId) {
      throw new BadRequestException('Wolt Merchant ID nie je nastavený pre tento tenant.');
    }

    const { merchantAreasUrl } = this.resolveApiEndpoints(apiConfig);
    const url = `${merchantAreasUrl}/${encodeURIComponent(trimmedMerchantId)}/delivery-areas`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await this.buildApiError(response);
          if (!this.isRetryableError(error, response)) {
            throw error;
          }
          lastError = error;
          throw error;
        }

        return await response.json();
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!this.isRetryableError(error, undefined)) {
          this.logger.error('Non-retryable error from Wolt API', {
            error: lastError.message,
            merchantId: trimmedMerchantId,
          });
          throw lastError;
        }

        if (attempt === maxRetries - 1) {
          this.logger.error(`Wolt API getDeliveryAreas failed after ${maxRetries} attempts`, {
            error: lastError.message,
            merchantId: trimmedMerchantId,
          });
          throw lastError;
        }

        const delayMs = Math.pow(2, attempt) * 1000;
        await this.delay(delayMs);
      }
    }

    throw lastError || new Error('Wolt API getDeliveryAreas failed');
  }

  async getOrderStatus(
    apiKey: string,
    jobId: string,
    maxRetries = 2,
    apiConfig?: WoltApiConfig,
  ): Promise<any> {
    const trimmedJobId = String(jobId || '').trim();
    if (!trimmedJobId) {
      throw new BadRequestException('Wolt jobId is required for status lookup');
    }

    const { orderStatusUrl } = this.resolveApiEndpoints(apiConfig);
    const url = `${orderStatusUrl}/${encodeURIComponent(trimmedJobId)}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await this.buildApiError(response);
          if (!this.isRetryableError(error, response)) {
            throw error;
          }
          lastError = error;
          throw error;
        }

        return await response.json();
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!this.isRetryableError(error, undefined)) {
          this.logger.error('Non-retryable error from Wolt API', {
            error: lastError.message,
            jobId: trimmedJobId,
          });
          throw lastError;
        }

        if (attempt === maxRetries - 1) {
          this.logger.error(`Wolt API getOrderStatus failed after ${maxRetries} attempts`, {
            error: lastError.message,
            jobId: trimmedJobId,
          });
          throw lastError;
        }

        const delayMs = Math.pow(2, attempt) * 1000;
        await this.delay(delayMs);
      }
    }

    throw lastError || new Error('Wolt API getOrderStatus failed');
  }
}

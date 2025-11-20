import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Address } from '@pizza-ecosystem/shared';

interface WoltLocation {
  lat: number;
  lon: number;
}

interface WoltQuoteRequest {
  pickup: {
    location: WoltLocation;
    comment?: string;
  };
  dropoff: {
    location: WoltLocation;
    comment?: string;
    contact: {
      name: string;
      phone: string;
    };
  };
}

@Injectable()
export class WoltDriveService {
  private readonly logger = new Logger(WoltDriveService.name);
  private apiUrl = 'https://daas-public-api.wolt.com/merchants/v1/deliveries';
  
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

  async getQuote(
    apiKey: string,
    pickupAddress: Address,
    dropoffAddress: Address,
    maxRetries = 3,
  ) {
    const request: WoltQuoteRequest = {
      pickup: {
        location: {
          lat: pickupAddress.coordinates?.lat || 0,
          lon: pickupAddress.coordinates?.lng || 0,
        },
        comment: 'Kitchen entrance',
      },
      dropoff: {
        location: {
          lat: dropoffAddress.coordinates?.lat || 0,
          lon: dropoffAddress.coordinates?.lng || 0,
        },
        comment: dropoffAddress.instructions || '',
        contact: {
          name: 'Customer', // Will be replaced with actual customer name
          phone: '+421900000000', // Will be replaced
        },
      },
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.apiUrl}/quote`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const error = new Error(`Wolt API error: ${response.statusText}`);
          if (!this.isRetryableError(error, response)) {
            throw error; // Don't retry 4xx errors
          }
          lastError = error;
          throw error;
        }

        const data = await response.json();
        
        return {
          feeCents: data.fee.amount, // Wolt returns in cents
          etaMinutes: data.dropoff_eta,
          distance: data.distance,
          currency: data.fee.currency,
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

  async createDelivery(
    apiKey: string,
    orderId: string,
    pickupAddress: Address & { phone?: string }, // Extended Address with optional phone
    dropoffAddress: Address,
    customerName: string,
    customerPhone: string,
    maxRetries = 3,
  ) {
    const request = {
      pickup: {
        location: {
          lat: pickupAddress.coordinates?.lat || 0,
          lon: pickupAddress.coordinates?.lng || 0,
        },
        address: `${pickupAddress.street}, ${pickupAddress.city}`,
        comment: pickupAddress.instructions || 'Kitchen entrance - call on arrival',
        contact: {
          name: 'Kitchen Staff',
          phone: this.getKitchenPhone(pickupAddress),
        },
      },
      dropoff: {
        location: {
          lat: dropoffAddress.coordinates?.lat || 0,
          lon: dropoffAddress.coordinates?.lng || 0,
        },
        address: `${dropoffAddress.street}, ${dropoffAddress.city}, ${dropoffAddress.postalCode}`,
        comment: dropoffAddress.instructions || '',
        contact: {
          name: customerName,
          phone: customerPhone,
        },
      },
      merchant_order_reference: orderId,
      contents: {
        description: 'Pizza delivery',
        count: 1,
      },
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.apiUrl}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const error = new Error(`Wolt API error: ${response.statusText}`);
          if (!this.isRetryableError(error, response)) {
            throw error; // Don't retry 4xx errors
          }
          lastError = error;
          throw error;
        }

        const data = await response.json();
        
        return {
          jobId: data.id,
          trackingUrl: data.tracking.url,
          status: data.status,
          courierEta: data.dropoff_eta,
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

  async cancelDelivery(apiKey: string, jobId: string, maxRetries = 3) {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.apiUrl}/${jobId}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
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


















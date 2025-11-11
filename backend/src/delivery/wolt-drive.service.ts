import { Injectable } from '@nestjs/common';
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
  private apiUrl = 'https://daas-public-api.wolt.com/merchants/v1/deliveries';
  
  async getQuote(
    apiKey: string,
    pickupAddress: Address,
    dropoffAddress: Address,
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

    const response = await fetch(`${this.apiUrl}/quote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Wolt API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      feeCents: data.fee.amount, // Wolt returns in cents
      etaMinutes: data.dropoff_eta,
      distance: data.distance,
      currency: data.fee.currency,
    };
  }

  async createDelivery(
    apiKey: string,
    orderId: string,
    pickupAddress: Address,
    dropoffAddress: Address,
    customerName: string,
    customerPhone: string,
  ) {
    const request = {
      pickup: {
        location: {
          lat: pickupAddress.coordinates?.lat || 0,
          lon: pickupAddress.coordinates?.lng || 0,
        },
        address: `${pickupAddress.street}, ${pickupAddress.city}`,
        comment: 'Kitchen entrance - call on arrival',
        contact: {
          name: 'Kitchen Staff',
          phone: process.env.KITCHEN_PHONE || '+421900000000',
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

    const response = await fetch(`${this.apiUrl}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Wolt API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      jobId: data.id,
      trackingUrl: data.tracking.url,
      status: data.status,
      courierEta: data.dropoff_eta,
    };
  }

  async cancelDelivery(apiKey: string, jobId: string) {
    const response = await fetch(`${this.apiUrl}/${jobId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Wolt API error: ${response.statusText}`);
    }

    return response.json();
  }
}










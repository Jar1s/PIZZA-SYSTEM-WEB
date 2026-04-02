/**
 * Type definitions for order-related JSON fields
 * Replaces 'as any' with proper types
 */

export interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface Address {
  street: string;
  houseNumber?: string;
  city: string;
  postalCode: string;
  country: string;
  instructions?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface OrderModifiers {
  [categoryId: string]: string[]; // Array of selected option IDs
}


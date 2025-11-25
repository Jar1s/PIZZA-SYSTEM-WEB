export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  priceCents: number;        // In cents: 999 = €9.99
  taxRate: number;           // 20.0 = 20%
  category: string;
  image: string | null;
  modifiers: Modifier[] | null;
  isActive: boolean;
  isBestSeller: boolean;
  weightGrams?: number | null;  // Gramáž v gramoch (napr. 450, 500, 520)
  allergens?: string[] | null; // Pole alergénov (napr. ["1", "7"])
  createdAt: Date;
  updatedAt: Date;
}

export interface Modifier {
  id: string;
  name: string;              // 'Size', 'Extra Toppings'
  type: 'single' | 'multiple';
  required: boolean;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;              // 'Large', 'Extra Cheese'
  priceCents: number;        // Additional cost
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}















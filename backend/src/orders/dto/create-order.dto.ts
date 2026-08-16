import { IsString, IsEmail, IsNumber, IsArray, ValidateNested, IsOptional, IsObject, IsNotEmpty, IsInt, Min, Max, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class CustomerInfoDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;
}

class AddressDto {
  @IsString()
  street: string;

  @IsOptional()
  @IsString()
  houseNumber?: string; // Číslo domu / Poschodie

  @IsString()
  city: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  instructions?: string; // Poznámky k doručeniu

  @IsOptional()
  @IsObject()
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * DTO for order item modifiers
 * Structure: { modifierId: [optionId1, optionId2, ...] }
 * Example: { "size": ["large"], "toppings": ["cheese", "pepperoni"] }
 */
export class OrderItemModifierDto {
  // This will be validated as a record where:
  // - Keys are modifier IDs (strings)
  // - Values are arrays of option IDs (string[])
  // Validation is done at runtime in the service layer
  // TypeScript can't enforce this structure at compile time, but we validate it
  
  [modifierId: string]: string[];
}

class OrderItemDto {
  // Pôvodné pole - stále podporované
  @IsOptional()
  @IsString()
  productId?: string;
  
  // Nové polia - podporujú externé identifikátory
  @IsOptional()
  @IsString()
  externalProductIdentifier?: string; // Napr. "#69", "Hawaii Premium", "Hawaiian"
  
  @IsOptional()
  @IsString()
  source?: string; // Voliteľne: zdroj (napr. "website1", "website2")
  
  // Whole, positive, sane: 0 / negative / fractional quantities are as
  // "technically valid" as coordinates 0,0 were — and just as wrong.
  @IsInt({ message: 'quantity must be a whole number' })
  @Min(1, { message: 'quantity must be at least 1' })
  @Max(50, { message: 'quantity must be at most 50 per item' })
  quantity: number;

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    // Preserve modifiers as-is without transformation
    // This ensures modifiers are not lost during class-transformer processing
    return value;
  })
  modifiers?: OrderItemModifierDto;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsArray()
  @ArrayMinSize(1, { message: 'order must contain at least one item' })
  @ArrayMaxSize(100, { message: 'order contains too many items' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsNumber()
  deliveryFeeCents?: number;

  @IsOptional()
  @IsString()
  addressId?: string; // For logged-in customer checkout with saved address

  // Guest checkout fields
  @IsOptional()
  @IsString()
  userId?: string; // If user is logged in

  @IsOptional()
  saveAccount?: boolean; // Save account for online payment (optional)

  @IsOptional()
  @IsString()
  paymentMethod?: 'cash' | 'card'; // For cash on delivery

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clientRequestId?: string;
}













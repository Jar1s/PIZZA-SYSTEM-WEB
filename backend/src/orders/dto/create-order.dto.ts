import { IsString, IsEmail, IsNumber, IsArray, ValidateNested, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

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
  
  @IsNumber()
  quantity: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrderItemModifierDto)
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
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsNumber()
  deliveryFeeCents?: number;

  // Guest checkout fields
  @IsOptional()
  @IsString()
  userId?: string; // If user is logged in

  @IsOptional()
  saveAccount?: boolean; // Save account for online payment (optional)

  @IsOptional()
  @IsString()
  paymentMethod?: 'cash' | 'card'; // For cash on delivery
}















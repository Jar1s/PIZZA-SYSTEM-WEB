import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsBoolean, IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Chránené polia (name, description, priceCents) sa nedajú meniť cez UPDATE
// Tieto polia môžu byť zmenené len pri vytváraní produktu
export class UpdateProductDto extends OmitType(
  PartialType(CreateProductDto),
  ['name', 'description', 'priceCents'] as const
) {
  // Povolené polia na update:
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  modifiers?: any[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @IsOptional()
  @IsNumber()
  weightGrams?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];
}























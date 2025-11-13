import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ModifierOptionDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  priceCents: number;
}

class ModifierDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  type: 'single' | 'multiple';

  @IsBoolean()
  required: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModifierOptionDto)
  options: ModifierOptionDto[];
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  priceCents: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModifierDto)
  modifiers?: ModifierDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}














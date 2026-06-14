import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Validated DTOs for the public customer register/login endpoints. These run
 * through the global ValidationPipe (whitelist + transform), so they reject
 * malformed input, oversized payloads, and (for register) weak passwords.
 */
export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

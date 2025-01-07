import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsDateString()
  apiKeyExpiresAt?: string; // e.g. "2025-01-01T00:00:00.000Z"

  @IsOptional()
  @IsArray()
  roles?: string[]; // ["admin", "editor"]

  @IsOptional()
  @IsObject()
  permissionMatrix?: Record<string, any>;

  @IsOptional()
  @IsObject()
  usageCounters?: Record<string, any>;
}

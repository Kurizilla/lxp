import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';

/**
 * DTO for updating admin configuration
 */
export class M01UpdateAdminConfigDto {
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'assistant_model must not exceed 255 characters' })
  assistant_model?: string;

  @IsBoolean()
  @IsOptional()
  assistant_enabled?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'system_prompt must not exceed 2000 characters' })
  system_prompt?: string;

  @IsObject()
  @IsOptional()
  feature_flags?: Record<string, boolean>;

  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}

/**
 * Response DTO for admin config
 */
export interface M01AdminConfigDto {
  assistant_model: string;
  assistant_enabled: boolean;
  system_prompt: string | null;
  feature_flags: Record<string, boolean>;
  settings: Record<string, unknown>;
  updated_at: Date;
}

/**
 * Response DTO for config update
 */
export interface M01AdminConfigResponseDto {
  config: M01AdminConfigDto;
  message?: string;
}

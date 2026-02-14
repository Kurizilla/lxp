import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, MaxLength, Min, Max } from 'class-validator';

/**
 * DTO for updating admin configuration
 * Used for PATCH /admin/config endpoint
 */
export class M01UpdateAdminConfigDto {
  @IsString()
  @IsOptional()
  @MaxLength(256, { message: 'Site name must not exceed 256 characters' })
  site_name?: string;

  @IsBoolean()
  @IsOptional()
  maintenance_mode?: boolean;

  @IsBoolean()
  @IsOptional()
  registration_enabled?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'Session timeout must be at least 1 minute' })
  @Max(10080, { message: 'Session timeout must not exceed 10080 minutes (7 days)' })
  session_timeout_minutes?: number;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'Max login attempts must be at least 1' })
  @Max(100, { message: 'Max login attempts must not exceed 100' })
  max_login_attempts?: number;

  @IsObject()
  @IsOptional()
  feature_flags?: Record<string, boolean>;

  @IsObject()
  @IsOptional()
  custom_settings?: Record<string, unknown>;
}

/**
 * Admin configuration object
 */
export interface M01AdminConfigDto {
  site_name: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  feature_flags: Record<string, boolean>;
  custom_settings: Record<string, unknown>;
  updated_at: string;
  updated_by?: string;
}

/**
 * Response DTO for admin config update
 */
export interface M01AdminConfigResponseDto {
  config: M01AdminConfigDto;
  message?: string;
}

import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for creating a new institution (admin endpoint)
 */
export class M01CreateInstitutionDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name!: string;

  @IsString()
  @MinLength(2, { message: 'Code must be at least 2 characters' })
  @MaxLength(50, { message: 'Code must not exceed 50 characters' })
  code!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Address must not exceed 500 characters' })
  address?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * DTO for updating an existing institution (admin endpoint)
 */
export class M01UpdateInstitutionDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Code must be at least 2 characters' })
  @MaxLength(50, { message: 'Code must not exceed 50 characters' })
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Address must not exceed 500 characters' })
  address?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * Response DTO for an institution
 */
export interface M01InstitutionDto {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Response DTO for paginated institution list
 */
export interface M01InstitutionsResponseDto {
  institutions: M01InstitutionDto[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Response DTO for single institution operations
 */
export interface M01InstitutionResponseDto {
  institution: M01InstitutionDto;
  message?: string;
}

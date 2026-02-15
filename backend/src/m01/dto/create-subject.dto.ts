import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for creating a new subject (admin endpoint)
 */
export class M01CreateSubjectDto {
  @IsString()
  @MinLength(2, { message: 'Code must be at least 2 characters' })
  @MaxLength(50, { message: 'Code must not exceed 50 characters' })
  code!: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Grade must not exceed 50 characters' })
  grade?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * DTO for updating an existing subject (admin endpoint)
 */
export class M01UpdateSubjectDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Code must be at least 2 characters' })
  @MaxLength(50, { message: 'Code must not exceed 50 characters' })
  code?: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Grade must not exceed 50 characters' })
  grade?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * Response DTO for a subject
 */
export interface M01SubjectDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  grade: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Response DTO for paginated subject list
 */
export interface M01SubjectsResponseDto {
  subjects: M01SubjectDto[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Response DTO for single subject operations
 */
export interface M01SubjectResponseDto {
  subject: M01SubjectDto;
  message?: string;
}

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for creating a new classroom (admin endpoint)
 */
export class M01CreateClassroomDto {
  @IsUUID('4', { message: 'institution_id must be a valid UUID' })
  institution_id!: string;

  @IsUUID('4', { message: 'subject_id must be a valid UUID' })
  subject_id!: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Section must not exceed 50 characters' })
  section?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Academic year must not exceed 20 characters' })
  academic_year?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * DTO for updating an existing classroom (admin endpoint)
 */
export class M01UpdateClassroomDto {
  @IsUUID('4', { message: 'institution_id must be a valid UUID' })
  @IsOptional()
  institution_id?: string;

  @IsUUID('4', { message: 'subject_id must be a valid UUID' })
  @IsOptional()
  subject_id?: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Section must not exceed 50 characters' })
  section?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Academic year must not exceed 20 characters' })
  academic_year?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * Response DTO for a classroom
 */
export interface M01ClassroomDto {
  id: string;
  institution_id: string;
  subject_id: string;
  name: string;
  section: string | null;
  academic_year: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  institution?: {
    id: string;
    name: string;
    code: string;
  };
  subject?: {
    id: string;
    code: string;
    name: string;
  };
}

/**
 * Response DTO for paginated classroom list
 */
export interface M01ClassroomsResponseDto {
  classrooms: M01ClassroomDto[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Response DTO for single classroom operations
 */
export interface M01ClassroomResponseDto {
  classroom: M01ClassroomDto;
  message?: string;
}

/**
 * DTO for enrolling a user in a classroom
 */
export class M01CreateEnrollmentDto {
  @IsUUID('4', { message: 'user_id must be a valid UUID' })
  user_id!: string;

  @IsUUID('4', { message: 'classroom_id must be a valid UUID' })
  classroom_id!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Role must not exceed 50 characters' })
  role?: string;
}

/**
 * DTO for updating an enrollment
 */
export class M01UpdateEnrollmentDto {
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Role must not exceed 50 characters' })
  role?: string;

  @IsBoolean()
  @IsOptional()
  dropped?: boolean;
}

/**
 * Response DTO for an enrollment
 */
export interface M01EnrollmentDto {
  id: string;
  user_id: string;
  classroom_id: string;
  role: string;
  enrolled_at: Date;
  dropped_at: Date | null;
  user?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  classroom?: {
    id: string;
    name: string;
    section: string | null;
  };
}

/**
 * Response DTO for paginated enrollment list
 */
export interface M01EnrollmentsResponseDto {
  enrollments: M01EnrollmentDto[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Response DTO for single enrollment operations
 */
export interface M01EnrollmentResponseDto {
  enrollment: M01EnrollmentDto;
  message?: string;
}

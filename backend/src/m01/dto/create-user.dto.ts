import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating a new user (admin endpoint)
 */
export class M01CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  first_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  last_name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * DTO for updating an existing user (admin endpoint)
 */
export class M01UpdateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  first_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  last_name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * Response DTO for a user (admin view)
 */
export interface M01AdminUserDto {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  google_id: string | null;
  created_at: Date;
  updated_at: Date;
  roles?: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
}

/**
 * Response DTO for paginated user list
 */
export interface M01AdminUsersResponseDto {
  users: M01AdminUserDto[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Response DTO for single user operations
 */
export interface M01AdminUserResponseDto {
  user: M01AdminUserDto;
  message?: string;
}

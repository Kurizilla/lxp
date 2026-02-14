import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for email/password login request
 */
export class M01LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password!: string;
}

/**
 * Response DTO for successful login
 */
export interface M01LoginResponseDto {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

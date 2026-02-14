import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for Google OAuth login request
 */
export class M01GoogleLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Google ID token is required' })
  id_token!: string;
}

/**
 * Response DTO for successful Google login
 */
export interface M01GoogleLoginResponseDto {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    google_id: string | null;
  };
  is_new_user: boolean;
}

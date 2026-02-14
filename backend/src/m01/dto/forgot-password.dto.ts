import { IsEmail } from 'class-validator';

/**
 * DTO for forgot password request
 */
export class M01ForgotPasswordDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;
}

/**
 * Response DTO for forgot password request
 */
export interface M01ForgotPasswordResponseDto {
  message: string;
}

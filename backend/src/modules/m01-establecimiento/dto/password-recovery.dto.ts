import { IsEmail, IsString, MinLength } from 'class-validator';

export class PasswordRecoveryRequestDto {
  @IsEmail()
  email: string;
}

export class PasswordResetDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

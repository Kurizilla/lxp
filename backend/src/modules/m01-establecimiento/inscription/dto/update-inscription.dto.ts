import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateInscriptionDto {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  role?: string;
}

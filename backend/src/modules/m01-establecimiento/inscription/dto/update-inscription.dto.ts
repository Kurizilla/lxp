import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateInscriptionDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

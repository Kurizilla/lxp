import { IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInscriptionDto {
  @Type(() => Number)
  @IsNumber()
  user_id: number;

  @Type(() => Number)
  @IsNumber()
  classroom_id: number;

  @IsOptional()
  @IsString()
  role?: string;
}

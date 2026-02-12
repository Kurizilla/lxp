import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateClassroomDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  establishment_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subject_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

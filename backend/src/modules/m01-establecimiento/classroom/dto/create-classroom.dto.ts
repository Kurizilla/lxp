import { IsString, IsNumber, IsOptional, MaxLength, MinLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassroomDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @Type(() => Number)
  @IsNumber()
  establishment_id: number;

  @Type(() => Number)
  @IsNumber()
  subject_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  capacity?: number;
}

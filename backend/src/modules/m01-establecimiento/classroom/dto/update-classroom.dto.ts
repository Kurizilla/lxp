import { IsString, IsNumber, IsOptional, IsBoolean, MaxLength, MinLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateClassroomDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  establishmentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subjectId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { IsString, IsNumber, IsOptional, MaxLength, MinLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassroomDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @Type(() => Number)
  @IsNumber()
  establishmentId: number;

  @Type(() => Number)
  @IsNumber()
  subjectId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  capacity?: number;
}

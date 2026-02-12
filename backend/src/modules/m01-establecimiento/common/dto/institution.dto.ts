import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ClassroomDto } from './classroom.dto';

export class InstitutionDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  rbd?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  commune?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassroomDto)
  @IsOptional()
  classrooms?: ClassroomDto[];
}

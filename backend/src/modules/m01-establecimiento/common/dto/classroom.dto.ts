import { IsString, IsNumber, IsOptional } from 'class-validator';

export class ClassroomDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  grade?: string;

  @IsString()
  @IsOptional()
  section?: string;

  @IsNumber()
  establishmentId: number;
}

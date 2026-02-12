import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class AssistantQueryDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsNumber()
  institutionId?: number;

  @IsOptional()
  @IsNumber()
  classroomId?: number;

  @IsOptional()
  @IsString()
  context?: string;
}

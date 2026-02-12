import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

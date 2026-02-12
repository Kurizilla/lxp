import { IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(1)
  resource: string;

  @IsString()
  @MinLength(1)
  action: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

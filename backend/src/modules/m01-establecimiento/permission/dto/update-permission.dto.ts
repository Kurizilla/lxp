import { IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  resource?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  action?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

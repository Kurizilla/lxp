import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto';

export class PermissionFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsString()
  action?: string;
}

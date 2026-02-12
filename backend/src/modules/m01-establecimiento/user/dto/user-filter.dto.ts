import { IsOptional, IsString, IsEnum } from 'class-validator';
import { UserStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../../common/dto';

export class UserFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  role_id?: string;
}

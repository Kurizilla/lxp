import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto, UserFilterDto } from './dto';
import { PaginatedResponseDto } from '../../../common/dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/auth.guard';

@Controller('api/v1/modules/m01/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('admin_nacional', 'admin_regional')
  async findAll(@Query() filter: UserFilterDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.userService.findAll(filter);
  }

  @Get(':id')
  @Roles('admin_nacional', 'admin_regional')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  @Post()
  @Roles('admin_nacional')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(dto);
  }

  @Put(':id')
  @Roles('admin_nacional')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin_nacional')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }

  @Post(':id/role/:roleId')
  @Roles('admin_nacional')
  async assignRole(
    @Param('id') userId: string,
    @Param('roleId') roleId: string,
  ): Promise<UserResponseDto> {
    return this.userService.assignRole(userId, roleId);
  }

  @Delete(':id/role/:roleId')
  @Roles('admin_nacional')
  async removeRole(
    @Param('id') userId: string,
    @Param('roleId') roleId: string,
  ): Promise<UserResponseDto> {
    return this.userService.removeRole(userId, roleId);
  }
}

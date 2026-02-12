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
import { RoleService } from './role.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  RoleFilterDto,
  AssignPermissionsDto,
} from './dto';
import { PaginatedResponseDto } from '../../../common/dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles } from '../../../common/decorators';

@Controller('api/v1/modules/m01/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Roles('admin_nacional', 'admin_regional')
  async findAll(@Query() filter: RoleFilterDto): Promise<PaginatedResponseDto<RoleResponseDto>> {
    return this.roleService.findAll(filter);
  }

  @Get(':id')
  @Roles('admin_nacional', 'admin_regional')
  async findOne(@Param('id') id: string): Promise<RoleResponseDto> {
    return this.roleService.findOne(id);
  }

  @Post()
  @Roles('admin_nacional')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.roleService.create(dto);
  }

  @Put(':id')
  @Roles('admin_nacional')
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto): Promise<RoleResponseDto> {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin_nacional')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.roleService.remove(id);
  }

  @Put(':id/permissions')
  @Roles('admin_nacional')
  async assignPermissions(
    @Param('id') roleId: string,
    @Body() dto: AssignPermissionsDto,
  ): Promise<RoleResponseDto> {
    return this.roleService.assignPermissions(roleId, dto);
  }

  @Post(':id/permissions/:permissionId')
  @Roles('admin_nacional')
  async addPermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
  ): Promise<RoleResponseDto> {
    return this.roleService.addPermission(roleId, permissionId);
  }

  @Delete(':id/permissions/:permissionId')
  @Roles('admin_nacional')
  async removePermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
  ): Promise<RoleResponseDto> {
    return this.roleService.removePermission(roleId, permissionId);
  }
}

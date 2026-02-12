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
import { PermissionService } from './permission.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionResponseDto,
  PermissionFilterDto,
} from './dto';
import { PaginatedResponseDto } from '../../../common/dto';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Roles } from '../../../common/decorators';

@Controller('api/v1/modules/m01/permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @Roles('admin_nacional', 'admin_regional')
  async findAll(
    @Query() filter: PermissionFilterDto,
  ): Promise<PaginatedResponseDto<PermissionResponseDto>> {
    return this.permissionService.findAll(filter);
  }

  @Get('resources')
  @Roles('admin_nacional', 'admin_regional')
  async getResources(): Promise<string[]> {
    return this.permissionService.getResources();
  }

  @Get('actions')
  @Roles('admin_nacional', 'admin_regional')
  async getActions(): Promise<string[]> {
    return this.permissionService.getActions();
  }

  @Get(':id')
  @Roles('admin_nacional', 'admin_regional')
  async findOne(@Param('id') id: string): Promise<PermissionResponseDto> {
    return this.permissionService.findOne(id);
  }

  @Post()
  @Roles('admin_nacional')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePermissionDto): Promise<PermissionResponseDto> {
    return this.permissionService.create(dto);
  }

  @Put(':id')
  @Roles('admin_nacional')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    return this.permissionService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin_nacional')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.permissionService.remove(id);
  }
}

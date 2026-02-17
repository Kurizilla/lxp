import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { M01AdminGuard, M01AdminRequest } from '../guards/m01-admin.guard';
import { AdminService, PaginationParams } from './admin.service';
import {
  M01CreateUserDto,
  M01UpdateUserDto,
  M01AdminUsersResponseDto,
  M01AdminUserResponseDto,
} from '../dto/create-user.dto';
import { M01AssignRoleDto, M01AssignRoleResponseDto } from '../dto/assign-role.dto';
import {
  M01AssignPermissionDto,
  M01AssignPermissionResponseDto,
} from '../dto/assign-permission.dto';
import { M01SessionsResponseDto } from '../dto/session.dto';
import {
  M01UpdateAdminConfigDto,
  M01AdminConfigResponseDto,
} from '../dto/admin-config.dto';

/**
 * Query parameters for pagination
 */
class PaginationQuery implements PaginationParams {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Controller for admin user, role, and permission management
 * All endpoints require admin role via CASL RBAC
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, M01AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/users
   * List all users with pagination
   */
  @Get('users')
  async listUsers(
    @Query() query: PaginationQuery,
    @Req() req: M01AdminRequest,
  ): Promise<M01AdminUsersResponseDto> {
    return this.adminService.listUsers(query, req.user.email);
  }

  /**
   * GET /admin/users/:id
   * Get a single user by ID
   */
  @Get('users/:id')
  async getUser(
    @Param('id') id: string,
    @Req() req: M01AdminRequest,
  ): Promise<M01AdminUserResponseDto> {
    return this.adminService.getUser(id, req.user.email);
  }

  /**
   * POST /admin/users
   * Create a new user
   */
  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() dto: M01CreateUserDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01AdminUserResponseDto> {
    return this.adminService.createUser(dto, req.user.email);
  }

  /**
   * PATCH /admin/users/:id
   * Update an existing user
   */
  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: M01UpdateUserDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01AdminUserResponseDto> {
    return this.adminService.updateUser(id, dto, req.user.email);
  }

  /**
   * POST /admin/users/:id/roles
   * Assign roles to a user
   */
  @Post('users/:id/roles')
  @HttpCode(HttpStatus.OK)
  async assignRoles(
    @Param('id') id: string,
    @Body() dto: M01AssignRoleDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01AssignRoleResponseDto> {
    return this.adminService.assignRoles(id, dto, req.user.email);
  }

  /**
   * POST /admin/roles/:id/permissions
   * Assign permissions to a role
   */
  @Post('roles/:id/permissions')
  @HttpCode(HttpStatus.OK)
  async assignPermissions(
    @Param('id') id: string,
    @Body() dto: M01AssignPermissionDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01AssignPermissionResponseDto> {
    return this.adminService.assignPermissions(id, dto, req.user.email);
  }

  /**
   * GET /admin/sessions/users/:id
   * Get all sessions for a specific user
   */
  @Get('sessions/users/:id')
  async getUserSessions(
    @Param('id') id: string,
    @Query() query: PaginationQuery,
    @Req() req: M01AdminRequest,
  ): Promise<M01SessionsResponseDto> {
    return this.adminService.getUserSessions(id, query, req.user.email);
  }

  /**
   * GET /admin/config
   * Get current admin configuration
   */
  @Get('config')
  async getConfig(@Req() req: M01AdminRequest): Promise<M01AdminConfigResponseDto> {
    return this.adminService.getConfig(req.user.email);
  }

  /**
   * PATCH /admin/config
   * Update admin configuration
   */
  @Patch('config')
  async updateConfig(
    @Body() dto: M01UpdateAdminConfigDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01AdminConfigResponseDto> {
    return this.adminService.updateConfig(dto, req.user.email);
  }
}

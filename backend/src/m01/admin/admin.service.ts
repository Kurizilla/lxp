import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma';
import {
  M01CreateUserDto,
  M01UpdateUserDto,
  M01AdminUserDto,
  M01AdminUsersResponseDto,
  M01AdminUserResponseDto,
} from '../dto/create-user.dto';
import {
  M01AssignRoleDto,
  M01AssignRoleResponseDto,
} from '../dto/assign-role.dto';
import {
  M01AssignPermissionDto,
  M01AssignPermissionResponseDto,
} from '../dto/assign-permission.dto';
import { M01SessionDto, M01SessionsResponseDto } from '../dto/session.dto';
import {
  M01UpdateAdminConfigDto,
  M01AdminConfigDto,
  M01AdminConfigResponseDto,
} from '../dto/admin-config.dto';

/**
 * Pagination parameters
 */
export interface PaginationParams {
  offset?: number;
  limit?: number;
}

/**
 * Service for admin user, role, and permission management
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly BCRYPT_ROUNDS = 10;
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 100;

  /**
   * In-memory config storage (persists for application lifetime)
   * In production, this would be stored in database or config service
   */
  private config: M01AdminConfigDto = {
    site_name: 'M01 Application',
    maintenance_mode: false,
    registration_enabled: true,
    session_timeout_minutes: 1440, // 24 hours
    max_login_attempts: 5,
    feature_flags: {},
    custom_settings: {},
    updated_at: new Date().toISOString(),
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List users with pagination
   */
  async listUsers(
    params: PaginationParams,
    adminEmail: string,
  ): Promise<M01AdminUsersResponseDto> {
    const offset = params.offset || 0;
    const limit = Math.min(params.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);

    const [users, total] = await Promise.all([
      this.prisma.m01_users.findMany({
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user_roles: {
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.m01_users.count(),
    ]);

    const userDtos: M01AdminUserDto[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active,
      google_id: user.google_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles: user.user_roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    }));

    this.logger.log(
      `Admin ${adminEmail} listed users: offset=${offset}, limit=${limit}, total=${total}`,
    );

    return {
      users: userDtos,
      total,
      offset,
      limit,
    };
  }

  /**
   * Get a single user by ID
   */
  async getUser(userId: string, adminEmail: string): Promise<M01AdminUserResponseDto> {
    const user = await this.prisma.m01_users.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const userDto: M01AdminUserDto = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active,
      google_id: user.google_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles: user.user_roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    };

    this.logger.log(`Admin ${adminEmail} retrieved user ${userId}`);

    return { user: userDto };
  }

  /**
   * Create a new user
   */
  async createUser(
    dto: M01CreateUserDto,
    adminEmail: string,
  ): Promise<M01AdminUserResponseDto> {
    // Check if email is already taken
    const existingUser = await this.prisma.m01_users.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(`Email ${dto.email} is already registered`);
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);
    }

    const user = await this.prisma.m01_users.create({
      data: {
        email: dto.email.toLowerCase(),
        password_hash: passwordHash,
        first_name: dto.first_name || null,
        last_name: dto.last_name || null,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
      },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const userDto: M01AdminUserDto = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active,
      google_id: user.google_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles: user.user_roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    };

    this.logger.log(`Admin ${adminEmail} created user ${user.id} (${user.email})`);

    return {
      user: userDto,
      message: 'User created successfully',
    };
  }

  /**
   * Update an existing user
   */
  async updateUser(
    userId: string,
    dto: M01UpdateUserDto,
    adminEmail: string,
  ): Promise<M01AdminUserResponseDto> {
    // Check user exists
    const existingUser = await this.prisma.m01_users.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check email uniqueness if being changed
    if (dto.email && dto.email.toLowerCase() !== existingUser.email) {
      const emailTaken = await this.prisma.m01_users.findUnique({
        where: { email: dto.email.toLowerCase() },
      });

      if (emailTaken) {
        throw new ConflictException(`Email ${dto.email} is already registered`);
      }
    }

    const user = await this.prisma.m01_users.update({
      where: { id: userId },
      data: {
        ...(dto.email && { email: dto.email.toLowerCase() }),
        ...(dto.first_name !== undefined && { first_name: dto.first_name }),
        ...(dto.last_name !== undefined && { last_name: dto.last_name }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const userDto: M01AdminUserDto = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active,
      google_id: user.google_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles: user.user_roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    };

    this.logger.log(`Admin ${adminEmail} updated user ${userId}`);

    return {
      user: userDto,
      message: 'User updated successfully',
    };
  }

  /**
   * Assign roles to a user
   */
  async assignRoles(
    userId: string,
    dto: M01AssignRoleDto,
    adminEmail: string,
  ): Promise<M01AssignRoleResponseDto> {
    // Verify user exists
    const user = await this.prisma.m01_users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify all roles exist
    const roles = await this.prisma.m01_roles.findMany({
      where: { id: { in: dto.role_ids } },
    });

    if (roles.length !== dto.role_ids.length) {
      const foundIds = roles.map((r) => r.id);
      const missingIds = dto.role_ids.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Roles not found: ${missingIds.join(', ')}`);
    }

    // Remove existing role assignments and add new ones (replace strategy)
    await this.prisma.$transaction(async (tx) => {
      // Delete existing role assignments
      await tx.m01_user_roles.deleteMany({
        where: { user_id: userId },
      });

      // Create new role assignments
      await tx.m01_user_roles.createMany({
        data: dto.role_ids.map((roleId) => ({
          user_id: userId,
          role_id: roleId,
          granted_by: adminEmail,
        })),
      });
    });

    this.logger.log(
      `Admin ${adminEmail} assigned roles [${dto.role_ids.join(', ')}] to user ${userId}`,
    );

    return {
      message: 'Roles assigned successfully',
      user_id: userId,
      assigned_roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      })),
    };
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissions(
    roleId: string,
    dto: M01AssignPermissionDto,
    adminEmail: string,
  ): Promise<M01AssignPermissionResponseDto> {
    // Verify role exists
    const role = await this.prisma.m01_roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Verify all permissions exist
    const permissions = await this.prisma.m01_permissions.findMany({
      where: { id: { in: dto.permission_ids } },
    });

    if (permissions.length !== dto.permission_ids.length) {
      const foundIds = permissions.map((p) => p.id);
      const missingIds = dto.permission_ids.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Permissions not found: ${missingIds.join(', ')}`);
    }

    // Remove existing permission assignments and add new ones (replace strategy)
    await this.prisma.$transaction(async (tx) => {
      // Delete existing permission assignments
      await tx.m01_role_permissions.deleteMany({
        where: { role_id: roleId },
      });

      // Create new permission assignments
      await tx.m01_role_permissions.createMany({
        data: dto.permission_ids.map((permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
        })),
      });
    });

    this.logger.log(
      `Admin ${adminEmail} assigned permissions [${dto.permission_ids.join(', ')}] to role ${roleId}`,
    );

    return {
      message: 'Permissions assigned successfully',
      role_id: roleId,
      assigned_permissions: permissions.map((perm) => ({
        id: perm.id,
        name: perm.name,
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      })),
    };
  }

  /**
   * Get sessions for a specific user (admin view)
   */
  async getUserSessions(
    userId: string,
    params: PaginationParams,
    adminEmail: string,
  ): Promise<M01SessionsResponseDto> {
    // Verify user exists
    const user = await this.prisma.m01_users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const offset = params.offset || 0;
    const limit = Math.min(params.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);

    const [sessions, total] = await Promise.all([
      this.prisma.m01_user_sessions.findMany({
        where: {
          user_id: userId,
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.m01_user_sessions.count({
        where: { user_id: userId },
      }),
    ]);

    const sessionDtos: M01SessionDto[] = sessions.map((session) => ({
      id: session.id,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      created_at: session.created_at,
      expires_at: session.expires_at,
      is_current: false, // Admin viewing another user's sessions, none are "current"
    }));

    this.logger.log(
      `Admin ${adminEmail} viewed sessions for user ${userId}: total=${total}`,
    );

    return {
      sessions: sessionDtos,
      total,
    };
  }

  /**
   * Get current admin configuration
   */
  async getConfig(adminEmail: string): Promise<M01AdminConfigResponseDto> {
    this.logger.log(`Admin ${adminEmail} retrieved system configuration`);

    return {
      config: { ...this.config },
    };
  }

  /**
   * Update admin configuration (persists in memory)
   */
  async updateConfig(
    dto: M01UpdateAdminConfigDto,
    adminEmail: string,
  ): Promise<M01AdminConfigResponseDto> {
    // Update only provided fields
    if (dto.site_name !== undefined) {
      this.config.site_name = dto.site_name;
    }
    if (dto.maintenance_mode !== undefined) {
      this.config.maintenance_mode = dto.maintenance_mode;
    }
    if (dto.registration_enabled !== undefined) {
      this.config.registration_enabled = dto.registration_enabled;
    }
    if (dto.session_timeout_minutes !== undefined) {
      this.config.session_timeout_minutes = dto.session_timeout_minutes;
    }
    if (dto.max_login_attempts !== undefined) {
      this.config.max_login_attempts = dto.max_login_attempts;
    }
    if (dto.feature_flags !== undefined) {
      this.config.feature_flags = {
        ...this.config.feature_flags,
        ...dto.feature_flags,
      };
    }
    if (dto.custom_settings !== undefined) {
      this.config.custom_settings = {
        ...this.config.custom_settings,
        ...dto.custom_settings,
      };
    }

    // Update metadata
    this.config.updated_at = new Date().toISOString();
    this.config.updated_by = adminEmail;

    this.logger.log(`Admin ${adminEmail} updated system configuration`);

    return {
      config: { ...this.config },
      message: 'Configuration updated successfully',
    };
  }
}

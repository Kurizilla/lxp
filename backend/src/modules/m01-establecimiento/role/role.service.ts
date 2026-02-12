import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { trace } from '@opentelemetry/api';
import { PrismaService } from '../../../prisma';
import { PaginatedResponseDto } from '../../../common/dto';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  RoleFilterDto,
  AssignPermissionsDto,
} from './dto';

@Injectable()
export class RoleService {
  private readonly tracer = trace.getTracer('m01-role-service');

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async findAll(filter: RoleFilterDto): Promise<PaginatedResponseDto<RoleResponseDto>> {
    const span = this.tracer.startSpan('RoleService.findAll');

    try {
      const { page = 1, limit = 10, search, is_active } = filter;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (is_active !== undefined) {
        where.is_active = is_active;
      }

      const [roles, total] = await Promise.all([
        this.prisma.role.findMany({
          where,
          skip,
          take: limit,
          include: {
            permissions: {
              include: { permission: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.role.count({ where }),
      ]);

      this.logger.info('Roles fetched successfully', {
        total,
        page,
        limit,
        filters: { search, is_active },
      });

      const data = roles.map(RoleResponseDto.fromEntity);
      span.end();
      return PaginatedResponseDto.create(data, total, page, limit);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async findOne(id: string): Promise<RoleResponseDto> {
    const span = this.tracer.startSpan('RoleService.findOne');

    try {
      const role = await this.prisma.role.findUnique({
        where: { id: BigInt(id) },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      this.logger.info('Role fetched successfully', { roleId: id });
      span.end();
      return RoleResponseDto.fromEntity(role);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async create(dto: CreateRoleDto): Promise<RoleResponseDto> {
    const span = this.tracer.startSpan('RoleService.create');

    try {
      const existingRole = await this.prisma.role.findUnique({
        where: { name: dto.name },
      });

      if (existingRole) {
        throw new ConflictException(`Role with name ${dto.name} already exists`);
      }

      const role = await this.prisma.role.create({
        data: {
          name: dto.name,
          description: dto.description,
          is_active: dto.is_active ?? true,
          permissions: dto.permission_ids?.length
            ? {
                create: dto.permission_ids.map((permissionId) => ({
                  permission: { connect: { id: BigInt(permissionId) } },
                })),
              }
            : undefined,
        },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      this.logger.info('Role created successfully', {
        roleId: role.id.toString(),
        name: dto.name,
      });

      span.end();
      return RoleResponseDto.fromEntity(role);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const span = this.tracer.startSpan('RoleService.update');

    try {
      const existingRole = await this.prisma.role.findUnique({
        where: { id: BigInt(id) },
      });

      if (!existingRole) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      if (dto.name && dto.name !== existingRole.name) {
        const nameExists = await this.prisma.role.findUnique({
          where: { name: dto.name },
        });
        if (nameExists) {
          throw new ConflictException(`Role with name ${dto.name} already exists`);
        }
      }

      // Handle permission_ids separately
      if (dto.permission_ids !== undefined) {
        // Delete existing permissions
        await this.prisma.rolePermission.deleteMany({
          where: { role_id: BigInt(id) },
        });

        // Create new permissions
        if (dto.permission_ids.length > 0) {
          await this.prisma.rolePermission.createMany({
            data: dto.permission_ids.map((permissionId) => ({
              role_id: BigInt(id),
              permission_id: BigInt(permissionId),
            })),
          });
        }
      }

      const updateData: any = {};
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

      const role = await this.prisma.role.update({
        where: { id: BigInt(id) },
        data: updateData,
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      this.logger.info('Role updated successfully', { roleId: id });
      span.end();
      return RoleResponseDto.fromEntity(role);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const span = this.tracer.startSpan('RoleService.remove');

    try {
      const existingRole = await this.prisma.role.findUnique({
        where: { id: BigInt(id) },
      });

      if (!existingRole) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      await this.prisma.role.delete({
        where: { id: BigInt(id) },
      });

      this.logger.info('Role deleted successfully', { roleId: id });
      span.end();
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async assignPermissions(roleId: string, dto: AssignPermissionsDto): Promise<RoleResponseDto> {
    const span = this.tracer.startSpan('RoleService.assignPermissions');

    try {
      const role = await this.prisma.role.findUnique({
        where: { id: BigInt(roleId) },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      // Verify all permissions exist
      const permissions = await this.prisma.permission.findMany({
        where: {
          id: { in: dto.permission_ids.map((id) => BigInt(id)) },
        },
      });

      if (permissions.length !== dto.permission_ids.length) {
        throw new NotFoundException('One or more permissions not found');
      }

      // Delete existing permissions for this role
      await this.prisma.rolePermission.deleteMany({
        where: { role_id: BigInt(roleId) },
      });

      // Create new role-permission associations
      await this.prisma.rolePermission.createMany({
        data: dto.permission_ids.map((permissionId) => ({
          role_id: BigInt(roleId),
          permission_id: BigInt(permissionId),
        })),
      });

      const updatedRole = await this.prisma.role.findUnique({
        where: { id: BigInt(roleId) },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      this.logger.info('Permissions assigned to role', {
        roleId,
        permissionCount: dto.permission_ids.length,
      });

      span.end();
      return RoleResponseDto.fromEntity(updatedRole);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async addPermission(roleId: string, permissionId: string): Promise<RoleResponseDto> {
    const span = this.tracer.startSpan('RoleService.addPermission');

    try {
      const [role, permission] = await Promise.all([
        this.prisma.role.findUnique({ where: { id: BigInt(roleId) } }),
        this.prisma.permission.findUnique({ where: { id: BigInt(permissionId) } }),
      ]);

      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      if (!permission) {
        throw new NotFoundException(`Permission with ID ${permissionId} not found`);
      }

      // Check if association already exists
      const existingAssociation = await this.prisma.rolePermission.findUnique({
        where: {
          role_id_permission_id: {
            role_id: BigInt(roleId),
            permission_id: BigInt(permissionId),
          },
        },
      });

      if (existingAssociation) {
        throw new ConflictException('Permission already assigned to this role');
      }

      await this.prisma.rolePermission.create({
        data: {
          role_id: BigInt(roleId),
          permission_id: BigInt(permissionId),
        },
      });

      const updatedRole = await this.prisma.role.findUnique({
        where: { id: BigInt(roleId) },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      this.logger.info('Permission added to role', { roleId, permissionId });
      span.end();
      return RoleResponseDto.fromEntity(updatedRole);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async removePermission(roleId: string, permissionId: string): Promise<RoleResponseDto> {
    const span = this.tracer.startSpan('RoleService.removePermission');

    try {
      const role = await this.prisma.role.findUnique({
        where: { id: BigInt(roleId) },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      const existingAssociation = await this.prisma.rolePermission.findUnique({
        where: {
          role_id_permission_id: {
            role_id: BigInt(roleId),
            permission_id: BigInt(permissionId),
          },
        },
      });

      if (!existingAssociation) {
        throw new NotFoundException('Permission not assigned to this role');
      }

      await this.prisma.rolePermission.delete({
        where: {
          role_id_permission_id: {
            role_id: BigInt(roleId),
            permission_id: BigInt(permissionId),
          },
        },
      });

      const updatedRole = await this.prisma.role.findUnique({
        where: { id: BigInt(roleId) },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      this.logger.info('Permission removed from role', { roleId, permissionId });
      span.end();
      return RoleResponseDto.fromEntity(updatedRole);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }
}

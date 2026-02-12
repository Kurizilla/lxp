import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { trace } from '@opentelemetry/api';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PaginatedResponseDto } from '../../../common/dto';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionResponseDto,
  PermissionFilterDto,
} from './dto';

@Injectable()
export class PermissionService {
  private readonly tracer = trace.getTracer('m01-permission-service');

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async findAll(filter: PermissionFilterDto): Promise<PaginatedResponseDto<PermissionResponseDto>> {
    const span = this.tracer.startSpan('PermissionService.findAll');

    try {
      const { page = 1, limit = 10, search, resource, action } = filter;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (resource) {
        where.resource = resource;
      }

      if (action) {
        where.action = action;
      }

      const [permissions, total] = await Promise.all([
        this.prisma.permission.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.permission.count({ where }),
      ]);

      this.logger.info('Permissions fetched successfully', {
        total,
        page,
        limit,
        filters: { search, resource, action },
      });

      const data = permissions.map(PermissionResponseDto.fromEntity);
      span.end();
      return PaginatedResponseDto.create(data, total, page, limit);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async findOne(id: string): Promise<PermissionResponseDto> {
    const span = this.tracer.startSpan('PermissionService.findOne');

    try {
      const permission = await this.prisma.permission.findUnique({
        where: { id: BigInt(id) },
      });

      if (!permission) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }

      this.logger.info('Permission fetched successfully', { permissionId: id });
      span.end();
      return PermissionResponseDto.fromEntity(permission);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async create(dto: CreatePermissionDto): Promise<PermissionResponseDto> {
    const span = this.tracer.startSpan('PermissionService.create');

    try {
      const existingPermission = await this.prisma.permission.findUnique({
        where: { name: dto.name },
      });

      if (existingPermission) {
        throw new ConflictException(`Permission with name ${dto.name} already exists`);
      }

      const permission = await this.prisma.permission.create({
        data: {
          name: dto.name,
          description: dto.description,
          resource: dto.resource,
          action: dto.action,
        },
      });

      this.logger.info('Permission created successfully', {
        permissionId: permission.id.toString(),
        name: dto.name,
      });

      span.end();
      return PermissionResponseDto.fromEntity(permission);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<PermissionResponseDto> {
    const span = this.tracer.startSpan('PermissionService.update');

    try {
      const existingPermission = await this.prisma.permission.findUnique({
        where: { id: BigInt(id) },
      });

      if (!existingPermission) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }

      if (dto.name && dto.name !== existingPermission.name) {
        const nameExists = await this.prisma.permission.findUnique({
          where: { name: dto.name },
        });
        if (nameExists) {
          throw new ConflictException(`Permission with name ${dto.name} already exists`);
        }
      }

      const updateData: any = {};
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.resource !== undefined) updateData.resource = dto.resource;
      if (dto.action !== undefined) updateData.action = dto.action;

      const permission = await this.prisma.permission.update({
        where: { id: BigInt(id) },
        data: updateData,
      });

      this.logger.info('Permission updated successfully', { permissionId: id });
      span.end();
      return PermissionResponseDto.fromEntity(permission);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const span = this.tracer.startSpan('PermissionService.remove');

    try {
      const existingPermission = await this.prisma.permission.findUnique({
        where: { id: BigInt(id) },
      });

      if (!existingPermission) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }

      await this.prisma.permission.delete({
        where: { id: BigInt(id) },
      });

      this.logger.info('Permission deleted successfully', { permissionId: id });
      span.end();
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async getResources(): Promise<string[]> {
    const span = this.tracer.startSpan('PermissionService.getResources');

    try {
      const permissions = await this.prisma.permission.findMany({
        select: { resource: true },
        distinct: ['resource'],
      });

      const resources = permissions.map((p) => p.resource);
      this.logger.info('Resources fetched successfully', { count: resources.length });
      span.end();
      return resources;
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async getActions(): Promise<string[]> {
    const span = this.tracer.startSpan('PermissionService.getActions');

    try {
      const permissions = await this.prisma.permission.findMany({
        select: { action: true },
        distinct: ['action'],
      });

      const actions = permissions.map((p) => p.action);
      this.logger.info('Actions fetched successfully', { count: actions.length });
      span.end();
      return actions;
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }
}

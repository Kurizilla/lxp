import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { trace } from '@opentelemetry/api';
import { PrismaService } from '../../../prisma';
import { PaginatedResponseDto } from '../../../common/dto';
import { CreateUserDto, UpdateUserDto, UserResponseDto, UserFilterDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  private readonly tracer = trace.getTracer('m01-user-service');

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async findAll(filter: UserFilterDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    const span = this.tracer.startSpan('UserService.findAll');

    try {
      const { page = 1, limit = 10, search, status, role_id } = filter;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (role_id) {
        where.role_id = BigInt(role_id);
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: { role: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      this.logger.info('Users fetched successfully', {
        total,
        page,
        limit,
        filters: { search, status, role_id },
      });

      const data = users.map(UserResponseDto.fromEntity);
      span.end();
      return PaginatedResponseDto.create(data, total, page, limit);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const span = this.tracer.startSpan('UserService.findOne');

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(id) },
        include: { role: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.info('User fetched successfully', { userId: id });
      span.end();
      return UserResponseDto.fromEntity(user);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const span = this.tracer.startSpan('UserService.create');

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException(`User with email ${dto.email} already exists`);
      }

      const passwordHash = this.hashPassword(dto.password);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password_hash: passwordHash,
          first_name: dto.first_name,
          last_name: dto.last_name,
          status: dto.status || 'PENDING',
          role_id: dto.role_id ? BigInt(dto.role_id) : null,
        },
        include: { role: true },
      });

      this.logger.info('User created successfully', {
        userId: user.id.toString(),
        email: dto.email,
      });

      span.end();
      return UserResponseDto.fromEntity(user);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const span = this.tracer.startSpan('UserService.update');

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: BigInt(id) },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      if (dto.email && dto.email !== existingUser.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email: dto.email },
        });
        if (emailExists) {
          throw new ConflictException(`User with email ${dto.email} already exists`);
        }
      }

      const updateData: any = {};

      if (dto.email !== undefined) updateData.email = dto.email;
      if (dto.first_name !== undefined) updateData.first_name = dto.first_name;
      if (dto.last_name !== undefined) updateData.last_name = dto.last_name;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.role_id !== undefined) {
        updateData.role_id = dto.role_id !== null ? BigInt(dto.role_id) : null;
      }
      if (dto.password !== undefined) {
        updateData.password_hash = this.hashPassword(dto.password);
      }

      const user = await this.prisma.user.update({
        where: { id: BigInt(id) },
        data: updateData,
        include: { role: true },
      });

      this.logger.info('User updated successfully', { userId: id });
      span.end();
      return UserResponseDto.fromEntity(user);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const span = this.tracer.startSpan('UserService.remove');

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: BigInt(id) },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      await this.prisma.user.delete({
        where: { id: BigInt(id) },
      });

      this.logger.info('User deleted successfully', { userId: id });
      span.end();
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async assignRole(userId: string, roleId: string): Promise<UserResponseDto> {
    const span = this.tracer.startSpan('UserService.assignRole');

    try {
      const [user, role] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: BigInt(userId) } }),
        this.prisma.role.findUnique({ where: { id: BigInt(roleId) } }),
      ]);

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: { role_id: BigInt(roleId) },
        include: { role: true },
      });

      this.logger.info('Role assigned to user', { userId, roleId });
      span.end();
      return UserResponseDto.fromEntity(updatedUser);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async removeRole(userId: string): Promise<UserResponseDto> {
    const span = this.tracer.startSpan('UserService.removeRole');

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: { role_id: null },
        include: { role: true },
      });

      this.logger.info('Role removed from user', { userId });
      span.end();
      return UserResponseDto.fromEntity(updatedUser);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}

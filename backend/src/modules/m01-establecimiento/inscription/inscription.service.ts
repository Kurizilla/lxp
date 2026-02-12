import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateInscriptionDto, UpdateInscriptionDto } from './dto';
import { PaginationQueryDto, PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { M01UserClassroom } from '@prisma/client';

@Injectable()
export class InscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createInscriptionDto: CreateInscriptionDto): Promise<M01UserClassroom> {
    const { user_id, classroom_id, role } = createInscriptionDto;

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(user_id) },
    });

    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: `User with ID ${user_id} does not exist`,
        details: { field: 'user_id', value: user_id },
      });
    }

    // Validate classroom exists
    const classroom = await this.prisma.m01Classroom.findUnique({
      where: { id: BigInt(classroom_id) },
    });

    if (!classroom) {
      throw new BadRequestException({
        code: 'CLASSROOM_NOT_FOUND',
        message: `Classroom with ID ${classroom_id} does not exist`,
        details: { field: 'classroom_id', value: classroom_id },
      });
    }

    // Check if inscription already exists
    const existingInscription = await this.prisma.m01UserClassroom.findUnique({
      where: {
        user_id_classroom_id: {
          user_id: BigInt(user_id),
          classroom_id: BigInt(classroom_id),
        },
      },
    });

    if (existingInscription) {
      throw new ConflictException({
        code: 'INSCRIPTION_EXISTS',
        message: `User ${user_id} is already inscribed in classroom ${classroom_id}`,
        details: { user_id, classroom_id },
      });
    }

    return this.prisma.m01UserClassroom.create({
      data: {
        user_id: BigInt(user_id),
        classroom_id: BigInt(classroom_id),
        role: role || 'student',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        classroom: {
          include: {
            establishment: true,
            subject: true,
          },
        },
      },
    });
  }

  async findAll(
    paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<M01UserClassroom>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.m01UserClassroom.findMany({
        skip,
        take: limit,
        orderBy: { enrolled_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          classroom: {
            include: {
              establishment: true,
              subject: true,
            },
          },
        },
      }),
      this.prisma.m01UserClassroom.count(),
    ]);

    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findOne(id: bigint): Promise<M01UserClassroom> {
    const inscription = await this.prisma.m01UserClassroom.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        classroom: {
          include: {
            establishment: true,
            subject: true,
          },
        },
      },
    });

    if (!inscription) {
      throw new NotFoundException({
        code: 'INSCRIPTION_NOT_FOUND',
        message: `Inscription with ID ${id} not found`,
      });
    }

    return inscription;
  }

  async findByUser(
    userId: bigint,
    paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<M01UserClassroom>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.m01UserClassroom.findMany({
        where: { user_id: userId },
        skip,
        take: limit,
        orderBy: { enrolled_at: 'desc' },
        include: {
          classroom: {
            include: {
              establishment: true,
              subject: true,
            },
          },
        },
      }),
      this.prisma.m01UserClassroom.count({ where: { user_id: userId } }),
    ]);

    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findByClassroom(
    classroomId: bigint,
    paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<M01UserClassroom>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.m01UserClassroom.findMany({
        where: { classroom_id: classroomId },
        skip,
        take: limit,
        orderBy: { enrolled_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      }),
      this.prisma.m01UserClassroom.count({ where: { classroom_id: classroomId } }),
    ]);

    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async update(id: bigint, updateInscriptionDto: UpdateInscriptionDto): Promise<M01UserClassroom> {
    await this.findOne(id);

    return this.prisma.m01UserClassroom.update({
      where: { id },
      data: updateInscriptionDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        classroom: {
          include: {
            establishment: true,
            subject: true,
          },
        },
      },
    });
  }

  async remove(id: bigint): Promise<M01UserClassroom> {
    await this.findOne(id);

    return this.prisma.m01UserClassroom.delete({
      where: { id },
    });
  }
}

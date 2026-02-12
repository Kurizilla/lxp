import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInscriptionDto, UpdateInscriptionDto } from './dto';
import { PaginationDto, PaginatedResponse } from '../../../common/dto/pagination.dto';
import { UserClassroom } from '@prisma/client';

@Injectable()
export class InscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createInscriptionDto: CreateInscriptionDto): Promise<UserClassroom> {
    const { userId, classroomId } = createInscriptionDto;

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: `User with ID ${userId} does not exist`,
        details: { field: 'userId', value: userId },
      });
    }

    // Validate classroom exists
    const classroom = await this.prisma.classroom.findUnique({
      where: { id: BigInt(classroomId) },
    });

    if (!classroom) {
      throw new BadRequestException({
        code: 'CLASSROOM_NOT_FOUND',
        message: `Classroom with ID ${classroomId} does not exist`,
        details: { field: 'classroomId', value: classroomId },
      });
    }

    // Check if inscription already exists
    const existingInscription = await this.prisma.userClassroom.findUnique({
      where: {
        userId_classroomId: {
          userId: BigInt(userId),
          classroomId: BigInt(classroomId),
        },
      },
    });

    if (existingInscription) {
      throw new ConflictException({
        code: 'INSCRIPTION_EXISTS',
        message: `User ${userId} is already inscribed in classroom ${classroomId}`,
        details: { userId, classroomId },
      });
    }

    return this.prisma.userClassroom.create({
      data: {
        userId: BigInt(userId),
        classroomId: BigInt(classroomId),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
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

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<UserClassroom>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.userClassroom.findMany({
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
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
      this.prisma.userClassroom.count(),
    ]);

    return {
      page,
      limit,
      total,
      data,
    };
  }

  async findOne(id: bigint): Promise<UserClassroom> {
    const inscription = await this.prisma.userClassroom.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
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

  async findByUser(userId: bigint, paginationDto: PaginationDto): Promise<PaginatedResponse<UserClassroom>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.userClassroom.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          classroom: {
            include: {
              establishment: true,
              subject: true,
            },
          },
        },
      }),
      this.prisma.userClassroom.count({ where: { userId } }),
    ]);

    return {
      page,
      limit,
      total,
      data,
    };
  }

  async findByClassroom(classroomId: bigint, paginationDto: PaginationDto): Promise<PaginatedResponse<UserClassroom>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.userClassroom.findMany({
        where: { classroomId },
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.userClassroom.count({ where: { classroomId } }),
    ]);

    return {
      page,
      limit,
      total,
      data,
    };
  }

  async update(id: bigint, updateInscriptionDto: UpdateInscriptionDto): Promise<UserClassroom> {
    await this.findOne(id);

    return this.prisma.userClassroom.update({
      where: { id },
      data: updateInscriptionDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
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

  async remove(id: bigint): Promise<UserClassroom> {
    await this.findOne(id);

    return this.prisma.userClassroom.delete({
      where: { id },
    });
  }
}

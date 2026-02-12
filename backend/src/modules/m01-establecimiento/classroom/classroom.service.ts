import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateClassroomDto, UpdateClassroomDto } from './dto';
import { PaginationDto, PaginatedResponse } from '../../../common/dto/pagination.dto';
import { Classroom } from '@prisma/client';

@Injectable()
export class ClassroomService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClassroomDto: CreateClassroomDto): Promise<Classroom> {
    const { establishmentId, subjectId, ...rest } = createClassroomDto;

    // Validate establishment exists
    const establishment = await this.prisma.establishment.findUnique({
      where: { id: BigInt(establishmentId) },
    });

    if (!establishment) {
      throw new BadRequestException({
        code: 'ESTABLISHMENT_NOT_FOUND',
        message: `Establishment with ID ${establishmentId} does not exist`,
        details: { field: 'establishmentId', value: establishmentId },
      });
    }

    // Validate subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { id: BigInt(subjectId) },
    });

    if (!subject) {
      throw new BadRequestException({
        code: 'SUBJECT_NOT_FOUND',
        message: `Subject with ID ${subjectId} does not exist`,
        details: { field: 'subjectId', value: subjectId },
      });
    }

    return this.prisma.classroom.create({
      data: {
        ...rest,
        establishmentId: BigInt(establishmentId),
        subjectId: BigInt(subjectId),
      },
      include: {
        establishment: true,
        subject: true,
      },
    });
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Classroom>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.classroom.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          establishment: true,
          subject: true,
        },
      }),
      this.prisma.classroom.count(),
    ]);

    return {
      page,
      limit,
      total,
      data,
    };
  }

  async findOne(id: bigint): Promise<Classroom> {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id },
      include: {
        establishment: true,
        subject: true,
        userClassrooms: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException({
        code: 'CLASSROOM_NOT_FOUND',
        message: `Classroom with ID ${id} not found`,
      });
    }

    return classroom;
  }

  async update(id: bigint, updateClassroomDto: UpdateClassroomDto): Promise<Classroom> {
    await this.findOne(id);

    const { establishmentId, subjectId, ...rest } = updateClassroomDto;
    const updateData: Record<string, any> = { ...rest };

    // Validate establishment exists if provided
    if (establishmentId !== undefined) {
      const establishment = await this.prisma.establishment.findUnique({
        where: { id: BigInt(establishmentId) },
      });

      if (!establishment) {
        throw new BadRequestException({
          code: 'ESTABLISHMENT_NOT_FOUND',
          message: `Establishment with ID ${establishmentId} does not exist`,
          details: { field: 'establishmentId', value: establishmentId },
        });
      }
      updateData.establishmentId = BigInt(establishmentId);
    }

    // Validate subject exists if provided
    if (subjectId !== undefined) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: BigInt(subjectId) },
      });

      if (!subject) {
        throw new BadRequestException({
          code: 'SUBJECT_NOT_FOUND',
          message: `Subject with ID ${subjectId} does not exist`,
          details: { field: 'subjectId', value: subjectId },
        });
      }
      updateData.subjectId = BigInt(subjectId);
    }

    return this.prisma.classroom.update({
      where: { id },
      data: updateData,
      include: {
        establishment: true,
        subject: true,
      },
    });
  }

  async remove(id: bigint): Promise<Classroom> {
    await this.findOne(id);

    return this.prisma.classroom.delete({
      where: { id },
    });
  }

  async exists(id: bigint): Promise<boolean> {
    const count = await this.prisma.classroom.count({
      where: { id },
    });
    return count > 0;
  }
}

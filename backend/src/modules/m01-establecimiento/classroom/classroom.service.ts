import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateClassroomDto, UpdateClassroomDto } from './dto';
import { PaginationQueryDto, PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { M01Classroom } from '@prisma/client';

@Injectable()
export class ClassroomService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClassroomDto: CreateClassroomDto): Promise<M01Classroom> {
    const { establishment_id, subject_id, ...rest } = createClassroomDto;

    // Validate establishment exists
    const establishment = await this.prisma.m01Establishment.findUnique({
      where: { id: BigInt(establishment_id) },
    });

    if (!establishment) {
      throw new BadRequestException({
        code: 'ESTABLISHMENT_NOT_FOUND',
        message: `Establishment with ID ${establishment_id} does not exist`,
        details: { field: 'establishment_id', value: establishment_id },
      });
    }

    // Validate subject exists
    const subject = await this.prisma.m01Subject.findUnique({
      where: { id: BigInt(subject_id) },
    });

    if (!subject) {
      throw new BadRequestException({
        code: 'SUBJECT_NOT_FOUND',
        message: `Subject with ID ${subject_id} does not exist`,
        details: { field: 'subject_id', value: subject_id },
      });
    }

    return this.prisma.m01Classroom.create({
      data: {
        ...rest,
        establishment_id: BigInt(establishment_id),
        subject_id: BigInt(subject_id),
      },
      include: {
        establishment: true,
        subject: true,
      },
    });
  }

  async findAll(paginationDto: PaginationQueryDto): Promise<PaginatedResponseDto<M01Classroom>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.m01Classroom.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          establishment: true,
          subject: true,
        },
      }),
      this.prisma.m01Classroom.count(),
    ]);

    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findOne(id: bigint): Promise<M01Classroom> {
    const classroom = await this.prisma.m01Classroom.findUnique({
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
                first_name: true,
                last_name: true,
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

  async update(id: bigint, updateClassroomDto: UpdateClassroomDto): Promise<M01Classroom> {
    await this.findOne(id);

    const { establishment_id, subject_id, ...rest } = updateClassroomDto;
    const updateData: Record<string, any> = { ...rest };

    // Validate establishment exists if provided
    if (establishment_id !== undefined) {
      const establishment = await this.prisma.m01Establishment.findUnique({
        where: { id: BigInt(establishment_id) },
      });

      if (!establishment) {
        throw new BadRequestException({
          code: 'ESTABLISHMENT_NOT_FOUND',
          message: `Establishment with ID ${establishment_id} does not exist`,
          details: { field: 'establishment_id', value: establishment_id },
        });
      }
      updateData.establishment_id = BigInt(establishment_id);
    }

    // Validate subject exists if provided
    if (subject_id !== undefined) {
      const subject = await this.prisma.m01Subject.findUnique({
        where: { id: BigInt(subject_id) },
      });

      if (!subject) {
        throw new BadRequestException({
          code: 'SUBJECT_NOT_FOUND',
          message: `Subject with ID ${subject_id} does not exist`,
          details: { field: 'subject_id', value: subject_id },
        });
      }
      updateData.subject_id = BigInt(subject_id);
    }

    return this.prisma.m01Classroom.update({
      where: { id },
      data: updateData,
      include: {
        establishment: true,
        subject: true,
      },
    });
  }

  async remove(id: bigint): Promise<M01Classroom> {
    await this.findOne(id);

    return this.prisma.m01Classroom.delete({
      where: { id },
    });
  }

  async exists(id: bigint): Promise<boolean> {
    const count = await this.prisma.m01Classroom.count({
      where: { id },
    });
    return count > 0;
  }
}

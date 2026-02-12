import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto';
import { PaginationQueryDto, PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { M01Subject } from '@prisma/client';

@Injectable()
export class SubjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<M01Subject> {
    const existingSubject = await this.prisma.m01Subject.findUnique({
      where: { code: createSubjectDto.code },
    });

    if (existingSubject) {
      throw new ConflictException({
        code: 'SUBJECT_CODE_EXISTS',
        message: `Subject with code ${createSubjectDto.code} already exists`,
      });
    }

    return this.prisma.m01Subject.create({
      data: createSubjectDto,
    });
  }

  async findAll(paginationDto: PaginationQueryDto): Promise<PaginatedResponseDto<M01Subject>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.m01Subject.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.m01Subject.count(),
    ]);

    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findOne(id: bigint): Promise<M01Subject> {
    const subject = await this.prisma.m01Subject.findUnique({
      where: { id },
      include: {
        classrooms: true,
      },
    });

    if (!subject) {
      throw new NotFoundException({
        code: 'SUBJECT_NOT_FOUND',
        message: `Subject with ID ${id} not found`,
      });
    }

    return subject;
  }

  async update(id: bigint, updateSubjectDto: UpdateSubjectDto): Promise<M01Subject> {
    await this.findOne(id);

    if (updateSubjectDto.code) {
      const existingSubject = await this.prisma.m01Subject.findFirst({
        where: {
          code: updateSubjectDto.code,
          NOT: { id },
        },
      });

      if (existingSubject) {
        throw new ConflictException({
          code: 'SUBJECT_CODE_EXISTS',
          message: `Subject with code ${updateSubjectDto.code} already exists`,
        });
      }
    }

    return this.prisma.m01Subject.update({
      where: { id },
      data: updateSubjectDto,
    });
  }

  async remove(id: bigint): Promise<M01Subject> {
    await this.findOne(id);

    return this.prisma.m01Subject.delete({
      where: { id },
    });
  }

  async exists(id: bigint): Promise<boolean> {
    const count = await this.prisma.m01Subject.count({
      where: { id },
    });
    return count > 0;
  }
}

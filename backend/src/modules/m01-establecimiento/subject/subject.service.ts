import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto';
import { PaginationDto, PaginatedResponse } from '../../../common/dto/pagination.dto';
import { Subject } from '@prisma/client';

@Injectable()
export class SubjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    const existingSubject = await this.prisma.subject.findUnique({
      where: { code: createSubjectDto.code },
    });

    if (existingSubject) {
      throw new ConflictException({
        code: 'SUBJECT_CODE_EXISTS',
        message: `Subject with code ${createSubjectDto.code} already exists`,
      });
    }

    return this.prisma.subject.create({
      data: createSubjectDto,
    });
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Subject>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.subject.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subject.count(),
    ]);

    return {
      page,
      limit,
      total,
      data,
    };
  }

  async findOne(id: bigint): Promise<Subject> {
    const subject = await this.prisma.subject.findUnique({
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

  async update(id: bigint, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    await this.findOne(id);

    if (updateSubjectDto.code) {
      const existingSubject = await this.prisma.subject.findFirst({
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

    return this.prisma.subject.update({
      where: { id },
      data: updateSubjectDto,
    });
  }

  async remove(id: bigint): Promise<Subject> {
    await this.findOne(id);

    return this.prisma.subject.delete({
      where: { id },
    });
  }

  async exists(id: bigint): Promise<boolean> {
    const count = await this.prisma.subject.count({
      where: { id },
    });
    return count > 0;
  }
}

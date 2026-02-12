import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateEstablishmentDto, UpdateEstablishmentDto } from './dto';
import { PaginationQueryDto, PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { M01Establishment } from '@prisma/client';

@Injectable()
export class EstablishmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEstablishmentDto: CreateEstablishmentDto): Promise<M01Establishment> {
    // Check if code already exists
    const existingEstablishment = await this.prisma.m01Establishment.findUnique({
      where: { code: createEstablishmentDto.code },
    });

    if (existingEstablishment) {
      throw new ConflictException({
        code: 'ESTABLISHMENT_CODE_EXISTS',
        message: `Establishment with code ${createEstablishmentDto.code} already exists`,
      });
    }

    return this.prisma.m01Establishment.create({
      data: createEstablishmentDto,
    });
  }

  async findAll(
    paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<M01Establishment>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.m01Establishment.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.m01Establishment.count(),
    ]);

    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findOne(id: bigint): Promise<M01Establishment> {
    const establishment = await this.prisma.m01Establishment.findUnique({
      where: { id },
      include: {
        classrooms: true,
      },
    });

    if (!establishment) {
      throw new NotFoundException({
        code: 'ESTABLISHMENT_NOT_FOUND',
        message: `Establishment with ID ${id} not found`,
      });
    }

    return establishment;
  }

  async update(
    id: bigint,
    updateEstablishmentDto: UpdateEstablishmentDto,
  ): Promise<M01Establishment> {
    await this.findOne(id);

    if (updateEstablishmentDto.code) {
      const existingEstablishment = await this.prisma.m01Establishment.findFirst({
        where: {
          code: updateEstablishmentDto.code,
          NOT: { id },
        },
      });

      if (existingEstablishment) {
        throw new ConflictException({
          code: 'ESTABLISHMENT_CODE_EXISTS',
          message: `Establishment with code ${updateEstablishmentDto.code} already exists`,
        });
      }
    }

    return this.prisma.m01Establishment.update({
      where: { id },
      data: updateEstablishmentDto,
    });
  }

  async remove(id: bigint): Promise<M01Establishment> {
    await this.findOne(id);

    return this.prisma.m01Establishment.delete({
      where: { id },
    });
  }

  async exists(id: bigint): Promise<boolean> {
    const count = await this.prisma.m01Establishment.count({
      where: { id },
    });
    return count > 0;
  }
}

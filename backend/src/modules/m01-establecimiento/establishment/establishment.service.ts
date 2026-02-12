import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEstablishmentDto, UpdateEstablishmentDto } from './dto';
import { PaginationDto, PaginatedResponse } from '../../../common/dto/pagination.dto';
import { Establishment } from '@prisma/client';

@Injectable()
export class EstablishmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEstablishmentDto: CreateEstablishmentDto): Promise<Establishment> {
    return this.prisma.establishment.create({
      data: createEstablishmentDto,
    });
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Establishment>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.establishment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.establishment.count(),
    ]);

    return {
      page,
      limit,
      total,
      data,
    };
  }

  async findOne(id: bigint): Promise<Establishment> {
    const establishment = await this.prisma.establishment.findUnique({
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

  async update(id: bigint, updateEstablishmentDto: UpdateEstablishmentDto): Promise<Establishment> {
    await this.findOne(id);

    return this.prisma.establishment.update({
      where: { id },
      data: updateEstablishmentDto,
    });
  }

  async remove(id: bigint): Promise<Establishment> {
    await this.findOne(id);

    return this.prisma.establishment.delete({
      where: { id },
    });
  }

  async exists(id: bigint): Promise<boolean> {
    const count = await this.prisma.establishment.count({
      where: { id },
    });
    return count > 0;
  }
}

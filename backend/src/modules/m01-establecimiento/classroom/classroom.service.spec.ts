import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('ClassroomService', () => {
  let service: ClassroomService;

  const mockPrismaService = {
    establishment: {
      findUnique: jest.fn(),
    },
    subject: {
      findUnique: jest.fn(),
    },
    classroom: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassroomService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClassroomService>(ClassroomService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a classroom when establishment and subject exist', async () => {
      const dto = { name: 'Classroom A', establishmentId: 1, subjectId: 1, capacity: 30 };
      const establishment = { id: BigInt(1), name: 'School A' };
      const subject = { id: BigInt(1), name: 'Math', code: 'MATH101' };
      const expected = {
        id: BigInt(1),
        name: 'Classroom A',
        establishmentId: BigInt(1),
        subjectId: BigInt(1),
        capacity: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        establishment,
        subject,
      };

      mockPrismaService.establishment.findUnique.mockResolvedValue(establishment);
      mockPrismaService.subject.findUnique.mockResolvedValue(subject);
      mockPrismaService.classroom.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrismaService.establishment.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
      expect(mockPrismaService.subject.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
    });

    it('should throw BadRequestException when establishment does not exist', async () => {
      const dto = { name: 'Classroom A', establishmentId: 999, subjectId: 1 };

      mockPrismaService.establishment.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when subject does not exist', async () => {
      const dto = { name: 'Classroom A', establishmentId: 1, subjectId: 999 };
      const establishment = { id: BigInt(1), name: 'School A' };

      mockPrismaService.establishment.findUnique.mockResolvedValue(establishment);
      mockPrismaService.subject.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });
});

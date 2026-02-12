import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('ClassroomService', () => {
  let service: ClassroomService;

  const mockPrismaService = {
    m01Establishment: {
      findUnique: jest.fn(),
    },
    m01Subject: {
      findUnique: jest.fn(),
    },
    m01Classroom: {
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
      const dto = {
        name: 'Classroom A',
        code: 'CLA001',
        establishment_id: 1,
        subject_id: 1,
        capacity: 30,
      };
      const establishment = { id: BigInt(1), name: 'School A', code: 'SA001' };
      const subject = { id: BigInt(1), name: 'Math', code: 'MATH101' };
      const expected = {
        id: BigInt(1),
        name: 'Classroom A',
        code: 'CLA001',
        establishment_id: BigInt(1),
        subject_id: BigInt(1),
        capacity: 30,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        establishment,
        subject,
      };

      mockPrismaService.m01Establishment.findUnique.mockResolvedValue(establishment);
      mockPrismaService.m01Subject.findUnique.mockResolvedValue(subject);
      mockPrismaService.m01Classroom.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
    });

    it('should throw BadRequestException when establishment does not exist', async () => {
      const dto = { name: 'Classroom A', code: 'CLA001', establishment_id: 999, subject_id: 1 };

      mockPrismaService.m01Establishment.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when subject does not exist', async () => {
      const dto = { name: 'Classroom A', code: 'CLA001', establishment_id: 1, subject_id: 999 };
      const establishment = { id: BigInt(1), name: 'School A', code: 'SA001' };

      mockPrismaService.m01Establishment.findUnique.mockResolvedValue(establishment);
      mockPrismaService.m01Subject.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });
});

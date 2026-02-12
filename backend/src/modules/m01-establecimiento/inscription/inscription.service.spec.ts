import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { InscriptionService } from './inscription.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('InscriptionService', () => {
  let service: InscriptionService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    m01Classroom: {
      findUnique: jest.fn(),
    },
    m01UserClassroom: {
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
        InscriptionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InscriptionService>(InscriptionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an inscription when user and classroom exist', async () => {
      const dto = { user_id: 1, classroom_id: 1 };
      const user = { id: BigInt(1), email: 'test@test.com', first_name: 'Test', last_name: 'User' };
      const classroom = { id: BigInt(1), name: 'Classroom A' };
      const expected = {
        id: BigInt(1),
        user_id: BigInt(1),
        classroom_id: BigInt(1),
        role: 'student',
        enrolled_at: new Date(),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        user,
        classroom,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.m01Classroom.findUnique.mockResolvedValue(classroom);
      mockPrismaService.m01UserClassroom.findUnique.mockResolvedValue(null);
      mockPrismaService.m01UserClassroom.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
    });

    it('should throw BadRequestException when user does not exist', async () => {
      const dto = { user_id: 999, classroom_id: 1 };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when classroom does not exist', async () => {
      const dto = { user_id: 1, classroom_id: 999 };
      const user = { id: BigInt(1), email: 'test@test.com' };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.m01Classroom.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when inscription already exists', async () => {
      const dto = { user_id: 1, classroom_id: 1 };
      const user = { id: BigInt(1), email: 'test@test.com' };
      const classroom = { id: BigInt(1), name: 'Classroom A' };
      const existingInscription = { id: BigInt(1), user_id: BigInt(1), classroom_id: BigInt(1) };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.m01Classroom.findUnique.mockResolvedValue(classroom);
      mockPrismaService.m01UserClassroom.findUnique.mockResolvedValue(existingInscription);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});

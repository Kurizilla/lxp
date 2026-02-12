import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { InscriptionService } from './inscription.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('InscriptionService', () => {
  let service: InscriptionService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    classroom: {
      findUnique: jest.fn(),
    },
    userClassroom: {
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
      const dto = { userId: 1, classroomId: 1 };
      const user = { id: BigInt(1), email: 'test@test.com', name: 'Test User' };
      const classroom = { id: BigInt(1), name: 'Classroom A' };
      const expected = {
        id: BigInt(1),
        userId: BigInt(1),
        classroomId: BigInt(1),
        enrolledAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user,
        classroom,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.classroom.findUnique.mockResolvedValue(classroom);
      mockPrismaService.userClassroom.findUnique.mockResolvedValue(null);
      mockPrismaService.userClassroom.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
    });

    it('should throw BadRequestException when user does not exist', async () => {
      const dto = { userId: 999, classroomId: 1 };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when classroom does not exist', async () => {
      const dto = { userId: 1, classroomId: 999 };
      const user = { id: BigInt(1), email: 'test@test.com' };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.classroom.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when inscription already exists', async () => {
      const dto = { userId: 1, classroomId: 1 };
      const user = { id: BigInt(1), email: 'test@test.com' };
      const classroom = { id: BigInt(1), name: 'Classroom A' };
      const existingInscription = { id: BigInt(1), userId: BigInt(1), classroomId: BigInt(1) };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.classroom.findUnique.mockResolvedValue(classroom);
      mockPrismaService.userClassroom.findUnique.mockResolvedValue(existingInscription);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});

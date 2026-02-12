import { Test, TestingModule } from '@nestjs/testing';
import { EstablishmentService } from './establishment.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('EstablishmentService', () => {
  let service: EstablishmentService;
  let prisma: PrismaService;

  const mockPrismaService = {
    establishment: {
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
        EstablishmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EstablishmentService>(EstablishmentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an establishment', async () => {
      const dto = { name: 'Test School', address: '123 Main St' };
      const expected = { id: BigInt(1), ...dto, createdAt: new Date(), updatedAt: new Date(), isActive: true };
      
      mockPrismaService.establishment.create.mockResolvedValue(expected);

      const result = await service.create(dto);
      
      expect(result).toEqual(expected);
      expect(mockPrismaService.establishment.create).toHaveBeenCalledWith({
        data: dto,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated establishments', async () => {
      const establishments = [
        { id: BigInt(1), name: 'School A', createdAt: new Date(), updatedAt: new Date(), isActive: true },
        { id: BigInt(2), name: 'School B', createdAt: new Date(), updatedAt: new Date(), isActive: true },
      ];

      mockPrismaService.establishment.findMany.mockResolvedValue(establishments);
      mockPrismaService.establishment.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        data: establishments,
      });
    });
  });

  describe('findOne', () => {
    it('should return an establishment by id', async () => {
      const establishment = { 
        id: BigInt(1), 
        name: 'Test School',
        createdAt: new Date(), 
        updatedAt: new Date(), 
        isActive: true,
        classrooms: [],
      };

      mockPrismaService.establishment.findUnique.mockResolvedValue(establishment);

      const result = await service.findOne(BigInt(1));

      expect(result).toEqual(establishment);
    });

    it('should throw NotFoundException when establishment not found', async () => {
      mockPrismaService.establishment.findUnique.mockResolvedValue(null);

      await expect(service.findOne(BigInt(999))).rejects.toThrow();
    });
  });
});

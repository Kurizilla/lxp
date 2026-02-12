import { Test, TestingModule } from '@nestjs/testing';
import { EstablishmentService } from './establishment.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('EstablishmentService', () => {
  let service: EstablishmentService;

  const mockPrismaService = {
    m01Establishment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
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
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an establishment', async () => {
      const dto = { name: 'Test School', code: 'TS001', address: '123 Main St' };
      const expected = {
        id: BigInt(1),
        ...dto,
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
      };

      mockPrismaService.m01Establishment.findUnique.mockResolvedValue(null);
      mockPrismaService.m01Establishment.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should return paginated establishments', async () => {
      const establishments = [
        {
          id: BigInt(1),
          name: 'School A',
          code: 'SA001',
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
        },
        {
          id: BigInt(2),
          name: 'School B',
          code: 'SB001',
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
        },
      ];

      mockPrismaService.m01Establishment.findMany.mockResolvedValue(establishments);
      mockPrismaService.m01Establishment.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.total).toEqual(2);
      expect(result.data).toEqual(establishments);
    });
  });

  describe('findOne', () => {
    it('should return an establishment by id', async () => {
      const establishment = {
        id: BigInt(1),
        name: 'Test School',
        code: 'TS001',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        classrooms: [],
      };

      mockPrismaService.m01Establishment.findUnique.mockResolvedValue(establishment);

      const result = await service.findOne(BigInt(1));

      expect(result).toEqual(establishment);
    });

    it('should throw NotFoundException when establishment not found', async () => {
      mockPrismaService.m01Establishment.findUnique.mockResolvedValue(null);

      await expect(service.findOne(BigInt(999))).rejects.toThrow();
    });
  });
});

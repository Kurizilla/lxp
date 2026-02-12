import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserService } from './user.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('UserService', () => {
  let service: UserService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    userRole: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        {
          id: BigInt(1),
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          is_active: true,
          email_verified: false,
          last_login_at: null,
          user_roles: [
            {
              id: BigInt(1),
              role_id: BigInt(1),
              assigned_at: new Date(),
              role: { name: 'admin' },
            },
          ],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(1);
      expect(result.data.length).toBe(1);
      expect(result.data[0].email).toBe('test@example.com');
    });

    it('should filter by is_active', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, is_active: true });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ is_active: true }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: BigInt(1),
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
        email_verified: false,
        last_login_at: null,
        user_roles: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow('User with ID 999 not found');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createDto = {
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
      };

      const mockUser = {
        id: BigInt(1),
        email: createDto.email,
        first_name: createDto.first_name,
        last_name: createDto.last_name,
        is_active: true,
        email_verified: false,
        last_login_at: null,
        user_roles: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(result.email).toBe('new@example.com');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: BigInt(1) });

      await expect(
        service.create({
          email: 'existing@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
        }),
      ).rejects.toThrow('User with email existing@example.com already exists');
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const existingUser = {
        id: BigInt(1),
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      };

      const updatedUser = {
        ...existingUser,
        first_name: 'Updated',
        is_active: true,
        email_verified: false,
        last_login_at: null,
        user_roles: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('1', { first_name: 'Updated' });

      expect(result.first_name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const mockUser = {
        id: BigInt(1),
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
      };
      mockPrismaService.user.findUnique.mockReset();
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue({ id: BigInt(1) });

      await service.remove('1');

      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockReset();
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow('User with ID 999 not found');
    });
  });
});

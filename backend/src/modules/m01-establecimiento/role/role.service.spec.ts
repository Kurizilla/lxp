import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { RoleService } from './role.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('RoleService', () => {
  let service: RoleService;

  const mockPrismaService = {
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    rolePermission: {
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
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
        RoleService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated roles with permissions', async () => {
      const mockRoles = [
        {
          id: BigInt(1),
          name: 'admin_nacional',
          description: 'National administrator',
          is_system: false,
          is_active: true,
          role_permissions: [
            {
              permission: {
                id: BigInt(1),
                name: 'users:read',
                resource: 'users',
                action: 'read',
              },
            },
          ],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPrismaService.role.findMany.mockResolvedValue(mockRoles);
      mockPrismaService.role.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.page).toBe(1);
      expect(result.total).toBe(1);
      expect(result.data[0].name).toBe('admin_nacional');
      expect(result.data[0].permissions.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      const mockRole = {
        id: BigInt(1),
        name: 'admin_nacional',
        description: 'National administrator',
        is_system: false,
        is_active: true,
        role_permissions: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);

      const result = await service.findOne('1');

      expect(result.name).toBe('admin_nacional');
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow('Role with ID 999 not found');
    });
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const createDto = {
        name: 'new_role',
        description: 'A new role',
      };

      const mockRole = {
        id: BigInt(1),
        name: createDto.name,
        description: createDto.description,
        is_system: false,
        is_active: true,
        role_permissions: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.role.findUnique.mockResolvedValue(null);
      mockPrismaService.role.create.mockResolvedValue(mockRole);

      const result = await service.create(createDto);

      expect(result.name).toBe('new_role');
    });

    it('should throw ConflictException if name exists', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue({ id: BigInt(1) });

      await expect(
        service.create({
          name: 'existing_role',
        }),
      ).rejects.toThrow('Role with name existing_role already exists');
    });
  });

  describe('assignPermissions', () => {
    it('should assign permissions to role', async () => {
      const roleId = '1';
      const permissionIds = ['1', '2'];

      const mockRole = {
        id: BigInt(1),
        name: 'admin',
        description: null,
        is_system: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockPermissions = [
        { id: BigInt(1), name: 'users:read', resource: 'users', action: 'read' },
        { id: BigInt(2), name: 'users:write', resource: 'users', action: 'write' },
      ];

      const mockUpdatedRole = {
        ...mockRole,
        role_permissions: mockPermissions.map((p) => ({
          permission: p,
        })),
      };

      mockPrismaService.role.findUnique
        .mockResolvedValueOnce(mockRole)
        .mockResolvedValueOnce(mockUpdatedRole);
      mockPrismaService.permission.findMany.mockResolvedValue(mockPermissions);
      mockPrismaService.rolePermission.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.rolePermission.createMany.mockResolvedValue({ count: 2 });

      const result = await service.assignPermissions(roleId, { permission_ids: permissionIds });

      expect(result.permissions.length).toBe(2);
      expect(mockPrismaService.rolePermission.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.rolePermission.createMany).toHaveBeenCalled();
    });
  });
});

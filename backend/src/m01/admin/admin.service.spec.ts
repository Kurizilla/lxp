import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminService } from './admin.service';
import { PrismaService } from '../../common/prisma';

// Mock bcrypt
jest.mock('bcrypt');

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password_hash: 'hashed-password',
    google_id: null,
    first_name: 'Test',
    last_name: 'User',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    user_roles: [
      {
        id: 'ur-123',
        user_id: 'user-123',
        role_id: 'role-123',
        granted_by: 'admin@example.com',
        granted_at: new Date(),
        role: {
          id: 'role-123',
          name: 'user',
          description: 'Standard user role',
          is_system: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      },
    ],
  };

  const mockRole = {
    id: 'role-123',
    name: 'admin',
    description: 'Administrator role',
    is_system: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPermission = {
    id: 'perm-123',
    name: 'users:manage',
    description: 'Manage users',
    resource: 'users',
    action: 'manage',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSession = {
    id: 'session-123',
    user_id: 'user-123',
    token: 'session-token',
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    created_at: new Date(),
    revoked_at: null,
  };

  const adminEmail = 'admin@example.com';

  beforeEach(async () => {
    const mockPrismaService: Record<string, unknown> = {
      m01_users: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      m01_roles: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      m01_permissions: {
        findMany: jest.fn(),
      },
      m01_user_roles: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      m01_role_permissions: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      m01_user_sessions: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    mockPrismaService.$transaction = jest.fn((callback: (tx: unknown) => unknown) => callback(mockPrismaService));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return paginated users list', async () => {
      const users = [mockUser];
      (prismaService.m01_users.findMany as jest.Mock).mockResolvedValue(users);
      (prismaService.m01_users.count as jest.Mock).mockResolvedValue(1);

      const result = await service.listUsers({ offset: 0, limit: 10 }, adminEmail);

      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(10);
      expect(prismaService.m01_users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should use default pagination values', async () => {
      (prismaService.m01_users.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.m01_users.count as jest.Mock).mockResolvedValue(0);

      const result = await service.listUsers({}, adminEmail);

      expect(result.offset).toBe(0);
      expect(result.limit).toBe(20); // DEFAULT_LIMIT
    });

    it('should cap limit at maximum', async () => {
      (prismaService.m01_users.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.m01_users.count as jest.Mock).mockResolvedValue(0);

      await service.listUsers({ limit: 500 }, adminEmail);

      expect(prismaService.m01_users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // MAX_LIMIT
        }),
      );
    });
  });

  describe('getUser', () => {
    it('should return a single user', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getUser('user-123', adminEmail);

      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getUser('non-existent', adminEmail)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createUser', () => {
    const createUserDto = {
      email: 'new@example.com',
      password: 'password123',
      first_name: 'New',
      last_name: 'User',
    };

    it('should create a new user', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prismaService.m01_users.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        id: 'new-user-123',
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
      });

      const result = await service.createUser(createUserDto, adminEmail);

      expect(result.user.email).toBe('new@example.com');
      expect(result.message).toBe('User created successfully');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw ConflictException for duplicate email', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.createUser({ ...createUserDto, email: 'test@example.com' }, adminEmail),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user without password', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.m01_users.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        password_hash: null,
      });

      const result = await service.createUser(
        { email: 'new@example.com' },
        adminEmail,
      );

      expect(result.user).toBeDefined();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const updateUserDto = {
      first_name: 'Updated',
      is_active: false,
    };

    it('should update an existing user', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.m01_users.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        first_name: 'Updated',
        is_active: false,
      });

      const result = await service.updateUser('user-123', updateUserDto, adminEmail);

      expect(result.user.first_name).toBe('Updated');
      expect(result.user.is_active).toBe(false);
      expect(result.message).toBe('User updated successfully');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateUser('non-existent', updateUserDto, adminEmail),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when changing to existing email', async () => {
      (prismaService.m01_users.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser) // First call: find user to update
        .mockResolvedValueOnce({ ...mockUser, id: 'other-user' }); // Second call: email check

      await expect(
        service.updateUser('user-123', { email: 'taken@example.com' }, adminEmail),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('assignRoles', () => {
    const assignRoleDto = {
      role_ids: ['role-123'],
    };

    it('should assign roles to a user', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.m01_roles.findMany as jest.Mock).mockResolvedValue([mockRole]);
      (prismaService.m01_user_roles.deleteMany as jest.Mock).mockResolvedValue({});
      (prismaService.m01_user_roles.createMany as jest.Mock).mockResolvedValue({});

      const result = await service.assignRoles('user-123', assignRoleDto, adminEmail);

      expect(result.message).toBe('Roles assigned successfully');
      expect(result.user_id).toBe('user-123');
      expect(result.assigned_roles).toHaveLength(1);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.assignRoles('non-existent', assignRoleDto, adminEmail),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent roles', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.m01_roles.findMany as jest.Mock).mockResolvedValue([]); // No roles found

      await expect(
        service.assignRoles('user-123', assignRoleDto, adminEmail),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignPermissions', () => {
    const assignPermissionDto = {
      permission_ids: ['perm-123'],
    };

    it('should assign permissions to a role', async () => {
      (prismaService.m01_roles.findUnique as jest.Mock).mockResolvedValue(mockRole);
      (prismaService.m01_permissions.findMany as jest.Mock).mockResolvedValue([
        mockPermission,
      ]);
      (prismaService.m01_role_permissions.deleteMany as jest.Mock).mockResolvedValue({});
      (prismaService.m01_role_permissions.createMany as jest.Mock).mockResolvedValue({});

      const result = await service.assignPermissions(
        'role-123',
        assignPermissionDto,
        adminEmail,
      );

      expect(result.message).toBe('Permissions assigned successfully');
      expect(result.role_id).toBe('role-123');
      expect(result.assigned_permissions).toHaveLength(1);
    });

    it('should throw NotFoundException for non-existent role', async () => {
      (prismaService.m01_roles.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.assignPermissions('non-existent', assignPermissionDto, adminEmail),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent permissions', async () => {
      (prismaService.m01_roles.findUnique as jest.Mock).mockResolvedValue(mockRole);
      (prismaService.m01_permissions.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        service.assignPermissions('role-123', assignPermissionDto, adminEmail),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.m01_user_sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession,
      ]);
      (prismaService.m01_user_sessions.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getUserSessions(
        'user-123',
        { offset: 0, limit: 10 },
        adminEmail,
      );

      expect(result.sessions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.sessions[0].is_current).toBe(false);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getUserSessions('non-existent', {}, adminEmail),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', async () => {
      const result = await service.getConfig(adminEmail);

      expect(result.config).toBeDefined();
      expect(result.config.site_name).toBe('M01 Application');
      expect(result.config.maintenance_mode).toBe(false);
      expect(result.config.registration_enabled).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration fields', async () => {
      const updateDto = {
        site_name: 'Updated Site',
        maintenance_mode: true,
      };

      const result = await service.updateConfig(updateDto, adminEmail);

      expect(result.config.site_name).toBe('Updated Site');
      expect(result.config.maintenance_mode).toBe(true);
      expect(result.config.updated_by).toBe(adminEmail);
      expect(result.message).toBe('Configuration updated successfully');
    });

    it('should merge feature flags', async () => {
      const updateDto = {
        feature_flags: { new_feature: true },
      };

      const result = await service.updateConfig(updateDto, adminEmail);

      expect(result.config.feature_flags.new_feature).toBe(true);
    });

    it('should merge custom settings', async () => {
      const updateDto = {
        custom_settings: { custom_key: 'custom_value' },
      };

      const result = await service.updateConfig(updateDto, adminEmail);

      expect(result.config.custom_settings.custom_key).toBe('custom_value');
    });

    it('should persist config across calls', async () => {
      await service.updateConfig({ site_name: 'Persisted Site' }, adminEmail);
      const result = await service.getConfig(adminEmail);

      expect(result.config.site_name).toBe('Persisted Site');
    });
  });
});

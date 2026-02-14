import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { M01AdminGuard, M01AdminRequest } from '../guards/m01-admin.guard';
import { M01AbilityFactory } from '../casl/m01-ability.factory';
import { PrismaService } from '../../common/prisma';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;

  const mockAdminRequest: M01AdminRequest = {
    user: {
      id: 'admin-123',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      session_id: 'session-123',
    },
  };

  const mockUserResponse = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      google_id: null,
      created_at: new Date(),
      updated_at: new Date(),
      roles: [],
    },
  };

  const mockUsersResponse = {
    users: [mockUserResponse.user],
    total: 1,
    offset: 0,
    limit: 20,
  };

  const mockAssignRoleResponse = {
    message: 'Roles assigned successfully',
    user_id: 'user-123',
    assigned_roles: [{ id: 'role-123', name: 'admin', description: 'Admin role' }],
  };

  const mockAssignPermissionResponse = {
    message: 'Permissions assigned successfully',
    role_id: 'role-123',
    assigned_permissions: [
      {
        id: 'perm-123',
        name: 'users:manage',
        resource: 'users',
        action: 'manage',
        description: 'Manage users',
      },
    ],
  };

  const mockSessionsResponse = {
    sessions: [
      {
        id: 'session-123',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date(),
        expires_at: new Date(),
        is_current: false,
      },
    ],
    total: 1,
  };

  const mockConfigResponse = {
    config: {
      assistant_model: 'gpt-4',
      assistant_enabled: true,
      system_prompt: null,
      feature_flags: {},
      settings: {},
      updated_at: new Date(),
    },
    message: 'Configuration updated successfully',
  };

  beforeEach(async () => {
    const mockAdminService = {
      listUsers: jest.fn().mockResolvedValue(mockUsersResponse),
      getUser: jest.fn().mockResolvedValue(mockUserResponse),
      createUser: jest.fn().mockResolvedValue(mockUserResponse),
      updateUser: jest.fn().mockResolvedValue(mockUserResponse),
      assignRoles: jest.fn().mockResolvedValue(mockAssignRoleResponse),
      assignPermissions: jest.fn().mockResolvedValue(mockAssignPermissionResponse),
      getUserSessions: jest.fn().mockResolvedValue(mockSessionsResponse),
      getConfig: jest.fn().mockResolvedValue(mockConfigResponse),
      updateConfig: jest.fn().mockResolvedValue(mockConfigResponse),
    };

    const mockPrismaService = {
      m01_users: {
        findUnique: jest.fn(),
      },
    };

    const mockAbilityFactory = {
      createForUser: jest.fn().mockReturnValue({ can: jest.fn() }),
      isAdmin: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: M01AbilityFactory, useValue: mockAbilityFactory },
        M01AdminGuard,
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return paginated users list', async () => {
      const result = await controller.listUsers(
        { offset: 0, limit: 10 },
        mockAdminRequest,
      );

      expect(result).toEqual(mockUsersResponse);
      expect(adminService.listUsers).toHaveBeenCalledWith(
        { offset: 0, limit: 10 },
        'admin@example.com',
      );
    });
  });

  describe('getUser', () => {
    it('should return a single user', async () => {
      const result = await controller.getUser('user-123', mockAdminRequest);

      expect(result).toEqual(mockUserResponse);
      expect(adminService.getUser).toHaveBeenCalledWith(
        'user-123',
        'admin@example.com',
      );
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createDto = { email: 'new@example.com', password: 'password123' };

      const result = await controller.createUser(createDto, mockAdminRequest);

      expect(result).toEqual(mockUserResponse);
      expect(adminService.createUser).toHaveBeenCalledWith(
        createDto,
        'admin@example.com',
      );
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const updateDto = { first_name: 'Updated' };

      const result = await controller.updateUser(
        'user-123',
        updateDto,
        mockAdminRequest,
      );

      expect(result).toEqual(mockUserResponse);
      expect(adminService.updateUser).toHaveBeenCalledWith(
        'user-123',
        updateDto,
        'admin@example.com',
      );
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to a user', async () => {
      const assignDto = { role_ids: ['role-123'] };

      const result = await controller.assignRoles(
        'user-123',
        assignDto,
        mockAdminRequest,
      );

      expect(result).toEqual(mockAssignRoleResponse);
      expect(adminService.assignRoles).toHaveBeenCalledWith(
        'user-123',
        assignDto,
        'admin@example.com',
      );
    });
  });

  describe('assignPermissions', () => {
    it('should assign permissions to a role', async () => {
      const assignDto = { permission_ids: ['perm-123'] };

      const result = await controller.assignPermissions(
        'role-123',
        assignDto,
        mockAdminRequest,
      );

      expect(result).toEqual(mockAssignPermissionResponse);
      expect(adminService.assignPermissions).toHaveBeenCalledWith(
        'role-123',
        assignDto,
        'admin@example.com',
      );
    });
  });

  describe('getUserSessions', () => {
    it('should return sessions for a user', async () => {
      const result = await controller.getUserSessions(
        'user-123',
        { offset: 0, limit: 10 },
        mockAdminRequest,
      );

      expect(result).toEqual(mockSessionsResponse);
      expect(adminService.getUserSessions).toHaveBeenCalledWith(
        'user-123',
        { offset: 0, limit: 10 },
        'admin@example.com',
      );
    });
  });

  describe('getConfig', () => {
    it('should return current config', async () => {
      const result = await controller.getConfig(mockAdminRequest);

      expect(result).toEqual(mockConfigResponse);
      expect(adminService.getConfig).toHaveBeenCalledWith('admin@example.com');
    });
  });

  describe('updateConfig', () => {
    it('should update config', async () => {
      const updateDto = {
        assistant_enabled: false,
        assistant_model: 'gpt-3.5-turbo',
      };

      const result = await controller.updateConfig(updateDto, mockAdminRequest);

      expect(result).toEqual(mockConfigResponse);
      expect(adminService.updateConfig).toHaveBeenCalledWith(
        updateDto,
        'admin@example.com',
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { M01AdminGuard } from './m01-admin.guard';
import { M01AbilityFactory } from '../casl/m01-ability.factory';
import { PrismaService } from '../../common/prisma';

describe('M01AdminGuard', () => {
  let guard: M01AdminGuard;
  let prismaService: jest.Mocked<PrismaService>;

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    is_active: true,
    google_id: null,
    password_hash: 'hashed',
    created_at: new Date(),
    updated_at: new Date(),
    user_roles: [
      {
        id: 'ur-123',
        user_id: 'admin-123',
        role_id: 'role-123',
        granted_by: null,
        granted_at: new Date(),
        role: {
          id: 'role-123',
          name: 'admin',
          description: 'Admin role',
          is_system: true,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [
            {
              id: 'rp-123',
              role_id: 'role-123',
              permission_id: 'perm-123',
              created_at: new Date(),
              permission: {
                id: 'perm-123',
                name: 'users:manage',
                description: 'Manage users',
                resource: 'users',
                action: 'manage',
                created_at: new Date(),
                updated_at: new Date(),
              },
            },
          ],
        },
      },
    ],
  };

  const mockRegularUser = {
    ...mockAdminUser,
    id: 'user-123',
    email: 'user@example.com',
    user_roles: [
      {
        ...mockAdminUser.user_roles[0],
        user_id: 'user-123',
        role: {
          ...mockAdminUser.user_roles[0].role,
          name: 'viewer',
          role_permissions: [],
        },
      },
    ],
  };

  const createMockContext = (user: { id: string; email: string } | null) => {
    const request = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const mockPrismaService = {
      m01_users: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        M01AdminGuard,
        M01AbilityFactory,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = module.get<M01AdminGuard>(M01AdminGuard);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access for admin user', async () => {
      const context = createMockContext({
        id: 'admin-123',
        email: 'admin@example.com',
      });

      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(
        mockAdminUser,
      );

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access for non-admin user', async () => {
      const context = createMockContext({
        id: 'user-123',
        email: 'user@example.com',
      });

      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(
        mockRegularUser,
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access when no user is authenticated', async () => {
      const context = createMockContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access when user is not found in database', async () => {
      const context = createMockContext({
        id: 'non-existent',
        email: 'non@example.com',
      });

      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should attach ability to request for admin user', async () => {
      const request = {
        user: { id: 'admin-123', email: 'admin@example.com' },
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as ExecutionContext;

      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(
        mockAdminUser,
      );

      await guard.canActivate(context);

      expect(request).toHaveProperty('ability');
      expect(request).toHaveProperty('userWithPermissions');
    });
  });
});

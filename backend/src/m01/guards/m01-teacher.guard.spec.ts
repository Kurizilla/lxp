import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { M01TeacherGuard } from './m01-teacher.guard';
import { PrismaService } from '../../common/prisma';
import { M01AbilityFactory } from '../casl/m01-ability.factory';

describe('M01TeacherGuard', () => {
  let guard: M01TeacherGuard;
  let prismaService: jest.Mocked<PrismaService>;
  let abilityFactory: jest.Mocked<M01AbilityFactory>;

  const mockUserWithTeacherRole = {
    id: 'teacher-123',
    email: 'teacher@example.com',
    first_name: 'Test',
    last_name: 'Teacher',
    is_active: true,
    google_id: null,
    password_hash: null,
    created_at: new Date(),
    updated_at: new Date(),
    user_roles: [
      {
        id: 'ur-123',
        user_id: 'teacher-123',
        role_id: 'role-teacher',
        granted_by: null,
        granted_at: new Date(),
        role: {
          id: 'role-teacher',
          name: 'teacher',
          description: 'Teacher role',
          is_system: false,
          created_at: new Date(),
          updated_at: new Date(),
          role_permissions: [],
        },
      },
    ],
  };

  const mockUserWithAdminRole = {
    ...mockUserWithTeacherRole,
    id: 'admin-123',
    email: 'admin@example.com',
    user_roles: [
      {
        ...mockUserWithTeacherRole.user_roles[0],
        role: {
          ...mockUserWithTeacherRole.user_roles[0].role,
          id: 'role-admin',
          name: 'admin',
          description: 'Admin role',
        },
      },
    ],
  };

  const mockUserWithStudentRole = {
    ...mockUserWithTeacherRole,
    id: 'student-123',
    email: 'student@example.com',
    user_roles: [
      {
        ...mockUserWithTeacherRole.user_roles[0],
        role: {
          ...mockUserWithTeacherRole.user_roles[0].role,
          id: 'role-student',
          name: 'student',
          description: 'Student role',
        },
      },
    ],
  };

  const createMockExecutionContext = (user: { id: string; email: string } | null): ExecutionContext => {
    const mockRequest = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const mockPrismaService = {
      m01_users: {
        findUnique: jest.fn(),
      },
    };

    const mockAbilityFactory = {
      createForUser: jest.fn().mockReturnValue({ can: jest.fn() }),
      isAdmin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        M01TeacherGuard,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: M01AbilityFactory, useValue: mockAbilityFactory },
      ],
    }).compile();

    guard = module.get<M01TeacherGuard>(M01TeacherGuard);
    prismaService = module.get(PrismaService);
    abilityFactory = module.get(M01AbilityFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access for user with teacher role', async () => {
      const context = createMockExecutionContext({
        id: 'teacher-123',
        email: 'teacher@example.com',
      });

      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(
        mockUserWithTeacherRole,
      );
      (abilityFactory.isAdmin as jest.Mock).mockReturnValue(false);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prismaService.m01_users.findUnique).toHaveBeenCalledWith({
        where: { id: 'teacher-123' },
        include: expect.any(Object),
      });
    });

    it('should allow access for user with admin role', async () => {
      const context = createMockExecutionContext({
        id: 'admin-123',
        email: 'admin@example.com',
      });

      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(
        mockUserWithAdminRole,
      );
      (abilityFactory.isAdmin as jest.Mock).mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access for user without teacher or admin role', async () => {
      const context = createMockExecutionContext({
        id: 'student-123',
        email: 'student@example.com',
      });

      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(
        mockUserWithStudentRole,
      );
      (abilityFactory.isAdmin as jest.Mock).mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('Teacher access required');
    });

    it('should deny access when no user is authenticated', async () => {
      const context = createMockExecutionContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('Authentication required');
    });

    it('should deny access when user is not found in database', async () => {
      const context = createMockExecutionContext({
        id: 'unknown-123',
        email: 'unknown@example.com',
      });

      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('User not found');
    });
  });
});

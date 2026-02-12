import { Test, TestingModule } from '@nestjs/testing';
import { AuthController, MonitoredController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard, RolesGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    requestPasswordRecovery: jest.fn(),
    resetPassword: jest.fn(),
    googleAuth: jest.fn(),
    validateUser: jest.fn(),
    createSession: jest.fn(),
    getUserSessions: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllUserSessions: jest.fn(),
  };

  const mockAuthResponse = {
    token: {
      accessToken: 'jwt-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    },
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    },
  };

  const mockRequest = {
    user: {
      userId: '1',
      email: 'test@example.com',
      role: 'user',
    },
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'Test Agent',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: Reflector,
          useValue: new Reflector(),
        },
        JwtAuthGuard,
        RolesGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return auth response on successful login', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockAuthResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  describe('register', () => {
    it('should return auth response on successful registration', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result).toEqual(mockAuthResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });
  });

  describe('requestPasswordRecovery', () => {
    it('should return success message', async () => {
      const mockResponse = { message: 'If the email exists, a recovery link has been sent' };
      mockAuthService.requestPasswordRecovery.mockResolvedValue(mockResponse);

      const result = await controller.requestPasswordRecovery({
        email: 'test@example.com',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('resetPassword', () => {
    it('should return success message on password reset', async () => {
      const mockResponse = { message: 'Password successfully reset' };
      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const result = await controller.resetPassword({
        token: 'reset-token',
        newPassword: 'newpassword123',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('googleAuth', () => {
    it('should call googleAuth service method', async () => {
      mockAuthService.googleAuth.mockResolvedValue(mockAuthResponse);

      const result = await controller.googleAuth({ idToken: 'google-token' });

      expect(mockAuthService.googleAuth).toHaveBeenCalledWith({
        idToken: 'google-token',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data', async () => {
      const userData = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };
      mockAuthService.validateUser.mockResolvedValue(userData);

      const result = await controller.getCurrentUser(mockRequest as any);

      expect(result).toEqual({ data: userData });
    });
  });

  describe('createSession', () => {
    it('should create a session and return token', async () => {
      mockAuthService.createSession.mockResolvedValue('session-token');

      const result = await controller.createSession(mockRequest as any);

      expect(result).toEqual({ data: { token: 'session-token' } });
      expect(mockAuthService.createSession).toHaveBeenCalledWith(
        BigInt(1),
        '127.0.0.1',
        'Test Agent',
      );
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions', async () => {
      const mockSessions = [
        {
          id: BigInt(1),
          ip_address: '127.0.0.1',
          user_agent: 'Test Agent',
          created_at: new Date('2024-01-01'),
          expires_at: new Date('2024-01-08'),
          last_activity: new Date('2024-01-02'),
        },
      ];
      mockAuthService.getUserSessions.mockResolvedValue(mockSessions);

      const result = await controller.getUserSessions(mockRequest as any);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('1');
      expect(result.data[0].lastActivity).toBeDefined();
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session', async () => {
      mockAuthService.revokeSession.mockResolvedValue(undefined);

      await controller.revokeSession('session-token');

      expect(mockAuthService.revokeSession).toHaveBeenCalledWith('session-token');
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke all user sessions', async () => {
      mockAuthService.revokeAllUserSessions.mockResolvedValue(undefined);

      await controller.revokeAllSessions(mockRequest as any);

      expect(mockAuthService.revokeAllUserSessions).toHaveBeenCalledWith(BigInt(1));
    });
  });

  describe('logout', () => {
    it('should logout user by revoking all sessions', async () => {
      mockAuthService.revokeAllUserSessions.mockResolvedValue(undefined);

      await controller.logout(mockRequest as any);

      expect(mockAuthService.revokeAllUserSessions).toHaveBeenCalledWith(BigInt(1));
    });
  });
});

describe('MonitoredController', () => {
  let controller: MonitoredController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitoredController],
      providers: [
        {
          provide: Reflector,
          useValue: new Reflector(),
        },
        JwtAuthGuard,
        RolesGuard,
      ],
    }).compile();

    controller = module.get<MonitoredController>(MonitoredController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create monitoring record', async () => {
      const mockRequest = {
        user: { userId: '1', email: 'test@example.com', role: 'admin' },
      };
      const dto = {
        establishmentId: 'est-123',
        metrics: { cpu: 80, memory: 60 },
      };

      const result = await controller.create(dto, mockRequest as any);

      expect(result.data).toHaveProperty('id');
      expect(result.data.establishmentId).toBe('est-123');
      expect(result.data.metrics).toEqual({ cpu: 80, memory: 60 });
      expect(result.data.createdBy).toBe('1');
    });
  });
});

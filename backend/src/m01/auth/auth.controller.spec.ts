import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockRequest = {
    headers: { 'user-agent': 'Mozilla/5.0' },
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;

  const mockAuthenticatedRequest = {
    ...mockRequest,
    user: {
      id: 'user-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      session_id: 'session-123',
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      googleLogin: jest.fn(),
      forgotPassword: jest.fn(),
      getSessions: jest.fn(),
      deleteSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const expectedResponse = {
        access_token: 'jwt-token',
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
        },
      };

      authService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto, mockRequest);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        expect.objectContaining({
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
        }),
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('googleLogin', () => {
    it('should call authService.googleLogin with correct parameters', async () => {
      const googleLoginDto = { id_token: 'google-token' };
      const expectedResponse = {
        access_token: 'jwt-token',
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: 'user-123',
          email: 'google@example.com',
          first_name: 'Google',
          last_name: 'User',
          google_id: 'google-123',
        },
        is_new_user: false,
      };

      authService.googleLogin.mockResolvedValue(expectedResponse);

      const result = await controller.googleLogin(googleLoginDto, mockRequest);

      expect(authService.googleLogin).toHaveBeenCalledWith(
        googleLoginDto,
        expect.objectContaining({
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
        }),
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword with correct parameters', async () => {
      const forgotPasswordDto = { email: 'test@example.com' };
      const expectedResponse = {
        message: 'If an account exists with this email, you will receive password reset instructions.',
      };

      authService.forgotPassword.mockResolvedValue(expectedResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getSessions', () => {
    it('should call authService.getSessions with authenticated user', async () => {
      const expectedResponse = {
        sessions: [
          {
            id: 'session-123',
            ip_address: '127.0.0.1',
            user_agent: 'Mozilla/5.0',
            created_at: new Date(),
            expires_at: new Date(),
            is_current: true,
          },
        ],
        total: 1,
      };

      authService.getSessions.mockResolvedValue(expectedResponse);

      const result = await controller.getSessions(mockAuthenticatedRequest as any);

      expect(authService.getSessions).toHaveBeenCalledWith(
        mockAuthenticatedRequest.user,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('deleteSession', () => {
    it('should call authService.deleteSession with correct parameters', async () => {
      const sessionId = 'session-456';
      const expectedResponse = {
        message: 'Session successfully revoked',
        session_id: sessionId,
      };

      authService.deleteSession.mockResolvedValue(expectedResponse);

      const result = await controller.deleteSession(
        sessionId,
        mockAuthenticatedRequest as any,
      );

      expect(authService.deleteSession).toHaveBeenCalledWith(
        sessionId,
        mockAuthenticatedRequest.user,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getIpAddress (private method via login)', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const requestWithForwarded = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      } as unknown as Request;

      authService.login.mockResolvedValue({
        access_token: 'token',
        token_type: 'Bearer',
        expires_in: 86400,
        user: { id: '1', email: 'test@example.com', first_name: null, last_name: null },
      });

      await controller.login({ email: 'test@example.com', password: 'pass' }, requestWithForwarded);

      expect(authService.login).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ ip_address: '192.168.1.1' }),
      );
    });
  });
});

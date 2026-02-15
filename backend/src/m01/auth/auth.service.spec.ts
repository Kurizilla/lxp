import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bull';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma';
import { EMAIL_QUEUE } from './email.processor';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let emailQueue: { add: jest.Mock };

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
    user: mockUser,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      m01_users: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      m01_user_sessions: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    emailQueue = {
      add: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getQueueToken(EMAIL_QUEUE), useValue: emailQueue },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };
    const metadata = { ip_address: '127.0.0.1', user_agent: 'Mozilla/5.0' };

    it('should successfully login with valid credentials', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prismaService.m01_user_sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.login(loginDto, metadata);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name,
        },
      });
      expect(prismaService.m01_users.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto, metadata)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        is_active: false,
      });

      await expect(service.login(loginDto, metadata)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for SSO-only account', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        password_hash: null,
      });

      await expect(service.login(loginDto, metadata)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto, metadata)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('googleLogin', () => {
    const metadata = { ip_address: '127.0.0.1', user_agent: 'Mozilla/5.0' };

    // Valid base64 encoded Google token mock
    const validGoogleData = {
      sub: 'google-123',
      email: 'google@example.com',
      given_name: 'Google',
      family_name: 'User',
    };
    const googleLoginDto = {
      id_token: Buffer.from(JSON.stringify(validGoogleData)).toString('base64'),
    };

    it('should login existing user with Google', async () => {
      const googleUser = { ...mockUser, google_id: 'google-123' };
      (prismaService.m01_users.findFirst as jest.Mock).mockResolvedValue(googleUser);
      (prismaService.m01_user_sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await service.googleLogin(googleLoginDto, metadata);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.is_new_user).toBe(false);
    });

    it('should create new user for new Google account', async () => {
      (prismaService.m01_users.findFirst as jest.Mock).mockResolvedValue(null);
      const newUser = {
        ...mockUser,
        id: 'new-user-123',
        email: 'google@example.com',
        google_id: 'google-123',
      };
      (prismaService.m01_users.create as jest.Mock).mockResolvedValue(newUser);
      (prismaService.m01_user_sessions.create as jest.Mock).mockResolvedValue({
        ...mockSession,
        user_id: 'new-user-123',
      });

      const result = await service.googleLogin(googleLoginDto, metadata);

      expect(result.is_new_user).toBe(true);
      expect(emailQueue.add).toHaveBeenCalledWith('send_welcome', expect.any(Object));
    });

    it('should throw BadRequestException for invalid token', async () => {
      const invalidDto = { id_token: 'invalid-token' };

      await expect(service.googleLogin(invalidDto, metadata)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException for inactive Google user', async () => {
      (prismaService.m01_users.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        google_id: 'google-123',
        is_active: false,
      });

      await expect(service.googleLogin(googleLoginDto, metadata)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto = { email: 'test@example.com' };

    it('should queue password reset email for valid user', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('If an account exists');
      expect(emailQueue.add).toHaveBeenCalledWith(
        'send_password_reset',
        expect.objectContaining({
          to: mockUser.email,
          template: 'password_reset',
        }),
      );
    });

    it('should return success message even for non-existent user', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('If an account exists');
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it('should not send email for SSO-only accounts', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        password_hash: null,
      });

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('If an account exists');
      expect(emailQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('getSessions', () => {
    const authenticatedUser = {
      id: 'user-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      session_id: 'session-123',
    };

    it('should return all active sessions for user', async () => {
      const sessions = [mockSession, { ...mockSession, id: 'session-456' }];
      (prismaService.m01_user_sessions.findMany as jest.Mock).mockResolvedValue(sessions);

      const result = await service.getSessions(authenticatedUser);

      expect(result.total).toBe(2);
      expect(result.sessions[0].is_current).toBe(true);
      expect(result.sessions[1].is_current).toBe(false);
    });

    it('should return empty array when no sessions exist', async () => {
      (prismaService.m01_user_sessions.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getSessions(authenticatedUser);

      expect(result.total).toBe(0);
      expect(result.sessions).toEqual([]);
    });
  });

  describe('deleteSession', () => {
    const authenticatedUser = {
      id: 'user-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      session_id: 'session-123',
    };

    it('should successfully revoke a session', async () => {
      (prismaService.m01_user_sessions.findFirst as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.m01_user_sessions.update as jest.Mock).mockResolvedValue({
        ...mockSession,
        revoked_at: new Date(),
      });

      const result = await service.deleteSession('session-123', authenticatedUser);

      expect(result.message).toBe('Session successfully revoked');
      expect(result.session_id).toBe('session-123');
    });

    it('should throw NotFoundException for non-existent session', async () => {
      (prismaService.m01_user_sessions.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteSession('non-existent', authenticatedUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for already revoked session', async () => {
      (prismaService.m01_user_sessions.findFirst as jest.Mock).mockResolvedValue({
        ...mockSession,
        revoked_at: new Date(),
      });

      await expect(
        service.deleteSession('session-123', authenticatedUser),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

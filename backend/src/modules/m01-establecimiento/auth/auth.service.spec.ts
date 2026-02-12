import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUser = {
    id: BigInt(1),
    email: 'test@example.com',
    password_hash: 'hashedpassword',
    name: 'Test User',
    role: 'user',
    is_active: true,
    google_id: null,
    last_login_at: null,
    password_reset_token: null,
    password_reset_expires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return auth response on valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.token.accessToken).toBe('jwt-token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on invalid email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on disabled account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        is_active: false,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user and return auth response', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result.token.accessToken).toBe('jwt-token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('requestPasswordRecovery', () => {
    it('should return success message regardless of user existence', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordRecovery({
        email: 'nonexistent@example.com',
      });

      expect(result.message).toContain('If the email exists');
    });

    it('should update user with reset token when user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.requestPasswordRecovery({
        email: 'test@example.com',
      });

      expect(result.message).toContain('If the email exists');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpassword');

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'newpassword123',
      });

      expect(result.message).toBe('Password successfully reset');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password_reset_token: null,
            password_reset_expires: null,
          }),
        }),
      );
    });

    it('should throw BadRequestException on invalid token', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'invalid-token',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('googleAuth', () => {
    it('should throw BadRequestException as SSO is not configured', async () => {
      await expect(
        service.googleAuth({ idToken: 'some-token' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('session management', () => {
    it('should create a session', async () => {
      mockPrismaService.session.create.mockResolvedValue({
        id: BigInt(1),
        token: 'session-token',
        user_id: BigInt(1),
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
        expires_at: new Date(),
        created_at: new Date(),
      });

      const result = await service.createSession(
        BigInt(1),
        '127.0.0.1',
        'Test Agent',
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should validate a valid session', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrismaService.session.findUnique.mockResolvedValue({
        user_id: BigInt(1),
        expires_at: futureDate,
      });

      const result = await service.validateSession('valid-token');

      expect(result).toEqual({ userId: BigInt(1) });
    });

    it('should return null for expired session', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      mockPrismaService.session.findUnique.mockResolvedValue({
        user_id: BigInt(1),
        expires_at: pastDate,
      });

      const result = await service.validateSession('expired-token');

      expect(result).toBeNull();
    });

    it('should return null for non-existent session', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(null);

      const result = await service.validateSession('nonexistent-token');

      expect(result).toBeNull();
    });

    it('should revoke a session', async () => {
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 1 });

      await service.revokeSession('session-token');

      expect(mockPrismaService.session.deleteMany).toHaveBeenCalledWith({
        where: { token: 'session-token' },
      });
    });

    it('should revoke all user sessions', async () => {
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 3 });

      await service.revokeAllUserSessions(BigInt(1));

      expect(mockPrismaService.session.deleteMany).toHaveBeenCalledWith({
        where: { user_id: BigInt(1) },
      });
    });

    it('should get user sessions', async () => {
      mockPrismaService.session.findMany.mockResolvedValue([
        {
          id: BigInt(1),
          ip_address: '127.0.0.1',
          user_agent: 'Test Agent',
          created_at: new Date(),
          expires_at: new Date(),
        },
      ]);

      const result = await service.getUserSessions(BigInt(1));

      expect(result).toHaveLength(1);
    });
  });

  describe('validateUser', () => {
    it('should return user data for valid active user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(BigInt(1));

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      });
    });

    it('should return null for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(BigInt(999));

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        is_active: false,
      });

      const result = await service.validateUser(BigInt(1));

      expect(result).toBeNull();
    });
  });
});

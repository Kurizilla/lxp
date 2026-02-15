import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { PrismaService } from '../../common/prisma';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
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
      m01_user_sessions: {
        findUnique: jest.fn(),
      },
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    const validPayload: JwtPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      session_id: 'session-123',
    };

    it('should return authenticated user for valid session', async () => {
      (prismaService.m01_user_sessions.findUnique as jest.Mock).mockResolvedValue(
        mockSession,
      );

      const result = await strategy.validate(validPayload);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        session_id: 'session-123',
      });
    });

    it('should throw UnauthorizedException for non-existent session', async () => {
      (prismaService.m01_user_sessions.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for revoked session', async () => {
      (prismaService.m01_user_sessions.findUnique as jest.Mock).mockResolvedValue({
        ...mockSession,
        revoked_at: new Date(),
      });

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired session', async () => {
      (prismaService.m01_user_sessions.findUnique as jest.Mock).mockResolvedValue({
        ...mockSession,
        expires_at: new Date(Date.now() - 1000),
      });

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      (prismaService.m01_user_sessions.findUnique as jest.Mock).mockResolvedValue({
        ...mockSession,
        user: { ...mockUser, is_active: false },
      });

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

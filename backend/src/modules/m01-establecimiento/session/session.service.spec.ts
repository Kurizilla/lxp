import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SessionService } from './session.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('SessionService', () => {
  let service: SessionService;

  const mockPrismaService = {
    session: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
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
        SessionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated sessions', async () => {
      const mockSessions = [
        {
          id: BigInt(1),
          user_id: BigInt(1),
          token: 'token123',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          is_valid: true,
          expires_at: new Date(Date.now() + 86400000),
          last_activity: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          user: {
            id: BigInt(1),
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
          },
        },
      ];

      mockPrismaService.session.findMany.mockResolvedValue(mockSessions);
      mockPrismaService.session.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.page).toBe(1);
      expect(result.total).toBe(1);
      expect(result.data[0].ip_address).toBe('192.168.1.1');
    });
  });

  describe('terminate', () => {
    it('should terminate a session', async () => {
      const mockSession = {
        id: BigInt(1),
        is_valid: true,
      };

      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.session.update.mockResolvedValue({ ...mockSession, is_valid: false });

      await expect(service.terminate('1')).resolves.not.toThrow();

      expect(mockPrismaService.session.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { is_valid: false },
      });
    });

    it('should throw NotFoundException if session not found', async () => {
      mockPrismaService.session.findUnique.mockResolvedValue(null);

      await expect(service.terminate('999')).rejects.toThrow('Session with ID 999 not found');
    });
  });

  describe('terminateMultiple', () => {
    it('should terminate multiple sessions', async () => {
      mockPrismaService.session.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.terminateMultiple({
        session_ids: ['1', '2', '3'],
      });

      expect(result.terminated_count).toBe(3);
    });
  });

  describe('terminateUserSessions', () => {
    it('should terminate all sessions for a user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: BigInt(1) });
      mockPrismaService.session.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.terminateUserSessions('1');

      expect(result.terminated_count).toBe(5);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.terminateUserSessions('999')).rejects.toThrow(
        'User with ID 999 not found',
      );
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', async () => {
      mockPrismaService.session.count.mockResolvedValueOnce(100).mockResolvedValueOnce(75);

      const result = await service.getSessionStats();

      expect(result.total).toBe(100);
      expect(result.active).toBe(75);
      expect(result.expired).toBe(25);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions', async () => {
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 10 });

      const result = await service.cleanupExpiredSessions();

      expect(result.cleaned_count).toBe(10);
    });
  });
});

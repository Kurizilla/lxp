import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { M09ModoClaseService } from './modo-clase.service';
import { PrismaService } from '../../common/prisma';
import { AuthenticatedUser } from '../../m01/auth/jwt.strategy';
import { M09ClassSessionState } from '../dto/modo-clase.dto';

describe('M09ModoClaseService', () => {
  let service: M09ModoClaseService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'teacher@example.com',
    first_name: 'Test',
    last_name: 'Teacher',
    session_id: 'session-123',
  };

  const mockClassroom = {
    id: 'classroom-123',
    institution_id: 'inst-123',
    subject_id: 'subj-123',
    name: 'Math 101',
    section: 'A',
    academic_year: '2025-2026',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSession = {
    id: 'session-123',
    classroom_id: 'classroom-123',
    event_id: null,
    title: 'Test Session',
    description: 'A test session',
    state: 'scheduled',
    scheduled_start: new Date('2026-02-15T10:00:00Z'),
    scheduled_end: new Date('2026-02-15T11:00:00Z'),
    actual_start: null,
    actual_end: null,
    host_id: 'user-123',
    host: { email: 'teacher@example.com', first_name: 'Test', last_name: 'Teacher' },
    join_code: null,
    max_participants: 30,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockParticipant = {
    id: 'participant-123',
    session_id: 'session-123',
    user_id: 'user-456',
    role: 'student',
    joined_at: new Date(),
    left_at: null,
    is_present: true,
    hand_raised: false,
    metadata: null,
    user: { email: 'student@example.com', first_name: 'Test', last_name: 'Student' },
  };

  beforeEach(async () => {
    const mockPrismaService = {
      m01_classrooms: {
        findUnique: jest.fn(),
      },
      m09_calendar_events: {
        findUnique: jest.fn(),
      },
      m09_class_sessions: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      m09_class_session_participants: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      m09_class_session_state_logs: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        M09ModoClaseService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<M09ModoClaseService>(M09ModoClaseService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a class session successfully', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(mockClassroom);
      (prismaService.m09_class_sessions.create as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.m09_class_session_state_logs.create as jest.Mock).mockResolvedValue({});

      const result = await service.createSession(
        {
          classroom_id: 'classroom-123',
          title: 'Test Session',
          scheduled_start: '2026-02-15T10:00:00Z',
        },
        mockUser,
      );

      expect(result.session).toBeDefined();
      expect(result.session.id).toBe(mockSession.id);
      expect(result.session.title).toBe(mockSession.title);
      expect(result.message).toBe('Session created successfully');
    });

    it('should throw NotFoundException when classroom not found', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createSession(
          {
            classroom_id: 'nonexistent',
            title: 'Test',
            scheduled_start: '2026-02-15T10:00:00Z',
          },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when event_id is provided but not found', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(mockClassroom);
      (prismaService.m09_calendar_events.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createSession(
          {
            classroom_id: 'classroom-123',
            title: 'Test',
            scheduled_start: '2026-02-15T10:00:00Z',
            event_id: 'nonexistent-event',
          },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSessionById', () => {
    it('should return session when found', async () => {
      const sessionWithCount = {
        ...mockSession,
        _count: { participants: 5 },
      };
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(sessionWithCount);

      const result = await service.getSessionById('session-123');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockSession.id);
      expect(result.title).toBe(mockSession.title);
    });

    it('should throw NotFoundException when session not found', async () => {
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getSessionById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSession', () => {
    it('should update scheduled session successfully', async () => {
      const updatedSession = { ...mockSession, title: 'Updated Title' };
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.m09_class_sessions.update as jest.Mock).mockResolvedValue(updatedSession);

      const result = await service.updateSession(
        'session-123',
        { title: 'Updated Title' },
        mockUser,
      );

      expect(result.session.title).toBe('Updated Title');
      expect(result.message).toBe('Session updated successfully');
    });

    it('should throw BadRequestException when updating non-scheduled session', async () => {
      const activeSession = { ...mockSession, state: 'active' };
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(activeSession);

      await expect(
        service.updateSession('session-123', { title: 'Test' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when session not found', async () => {
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateSession('nonexistent', { title: 'Test' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('startSession', () => {
    it('should start scheduled session successfully', async () => {
      const startedSession = {
        ...mockSession,
        state: 'active',
        actual_start: new Date(),
        join_code: 'ABC123',
      };
      (prismaService.m09_class_sessions.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce(null); // For join code uniqueness check
      (prismaService.m09_class_sessions.update as jest.Mock).mockResolvedValue(startedSession);
      (prismaService.m09_class_session_state_logs.create as jest.Mock).mockResolvedValue({});

      const result = await service.startSession(
        { session_id: 'session-123' },
        mockUser,
      );

      expect(result.session.state).toBe('active');
      expect(result.join_code).toBeDefined();
      expect(result.message).toBe('Session started successfully');
    });

    it('should throw ForbiddenException when non-host tries to start', async () => {
      const otherUserSession = { ...mockSession, host_id: 'other-user' };
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(otherUserSession);

      await expect(
        service.startSession({ session_id: 'session-123' }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when session is not in valid start state', async () => {
      const endedSession = { ...mockSession, state: 'ended' };
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(endedSession);

      await expect(
        service.startSession({ session_id: 'session-123' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when session not found', async () => {
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.startSession({ session_id: 'nonexistent' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeSessionState', () => {
    it('should pause active session successfully', async () => {
      const activeSession = { ...mockSession, state: 'active' };
      const pausedSession = { ...mockSession, state: 'paused' };
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(activeSession);
      (prismaService.m09_class_sessions.update as jest.Mock).mockResolvedValue(pausedSession);
      (prismaService.m09_class_session_state_logs.create as jest.Mock).mockResolvedValue({});

      const result = await service.changeSessionState(
        {
          session_id: 'session-123',
          new_state: M09ClassSessionState.PAUSED,
          reason: 'Break time',
        },
        mockUser,
      );

      expect(result.session.state).toBe('paused');
      expect(result.previous_state).toBe('active');
      expect(result.new_state).toBe('paused');
    });

    it('should throw BadRequestException for invalid state transition', async () => {
      const scheduledSession = { ...mockSession, state: 'scheduled' };
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(scheduledSession);

      await expect(
        service.changeSessionState(
          {
            session_id: 'session-123',
            new_state: M09ClassSessionState.PAUSED,
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when non-host tries to change state', async () => {
      const otherUserSession = { ...mockSession, host_id: 'other-user', state: 'active' };
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(otherUserSession);

      await expect(
        service.changeSessionState(
          {
            session_id: 'session-123',
            new_state: M09ClassSessionState.PAUSED,
          },
          mockUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('joinSession', () => {
    it('should join active session successfully', async () => {
      const activeSession = {
        ...mockSession,
        state: 'active',
        join_code: 'ABC123',
        participants: [],
      };
      const sessionWithParticipants = {
        ...activeSession,
        participants: [mockParticipant],
      };
      (prismaService.m09_class_sessions.findUnique as jest.Mock)
        .mockResolvedValueOnce(activeSession)
        .mockResolvedValueOnce(sessionWithParticipants);
      (prismaService.m09_class_session_participants.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.m09_class_session_participants.create as jest.Mock).mockResolvedValue(mockParticipant);

      const studentUser: AuthenticatedUser = {
        id: 'user-456',
        email: 'student@example.com',
        first_name: 'Test',
        last_name: 'Student',
        session_id: 'session-456',
      };

      const result = await service.joinSession(
        { join_code: 'ABC123' },
        studentUser,
      );

      expect(result.session).toBeDefined();
      expect(result.participant).toBeDefined();
      expect(result.message).toBe('Joined session successfully');
    });

    it('should throw NotFoundException for invalid join code', async () => {
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.joinSession({ join_code: 'INVALID' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when session is not active or waiting', async () => {
      const endedSession = { ...mockSession, state: 'ended', join_code: 'ABC123' };
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(endedSession);

      await expect(
        service.joinSession({ join_code: 'ABC123' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when session is full', async () => {
      const fullSession = {
        ...mockSession,
        state: 'active',
        join_code: 'ABC123',
        max_participants: 1,
        participants: [{ ...mockParticipant, is_present: true }],
      };
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(fullSession);

      const newUser: AuthenticatedUser = {
        id: 'new-user',
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        session_id: 'new-session',
      };

      await expect(
        service.joinSession({ join_code: 'ABC123' }, newUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listSessions', () => {
    it('should list sessions with pagination', async () => {
      const sessionWithCount = { ...mockSession, _count: { participants: 5 } };
      (prismaService.m09_class_sessions.count as jest.Mock).mockResolvedValue(1);
      (prismaService.m09_class_sessions.findMany as jest.Mock).mockResolvedValue([sessionWithCount]);

      const result = await service.listSessions({ limit: 10, offset: 0 }, mockUser);

      expect(result.sessions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should filter sessions by classroom_id', async () => {
      const sessionWithCount = { ...mockSession, _count: { participants: 5 } };
      (prismaService.m09_class_sessions.count as jest.Mock).mockResolvedValue(1);
      (prismaService.m09_class_sessions.findMany as jest.Mock).mockResolvedValue([sessionWithCount]);

      await service.listSessions(
        { classroom_id: 'classroom-123', limit: 10 },
        mockUser,
      );

      expect(prismaService.m09_class_sessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            classroom_id: 'classroom-123',
          }),
        }),
      );
    });

    it('should filter sessions by state', async () => {
      const sessionWithCount = { ...mockSession, _count: { participants: 5 } };
      (prismaService.m09_class_sessions.count as jest.Mock).mockResolvedValue(1);
      (prismaService.m09_class_sessions.findMany as jest.Mock).mockResolvedValue([sessionWithCount]);

      await service.listSessions(
        { state: M09ClassSessionState.ACTIVE },
        mockUser,
      );

      expect(prismaService.m09_class_sessions.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            state: 'active',
          }),
        }),
      );
    });

    it('should filter sessions hosted by current user', async () => {
      const sessionWithCount = { ...mockSession, _count: { participants: 5 } };
      (prismaService.m09_class_sessions.count as jest.Mock).mockResolvedValue(1);
      (prismaService.m09_class_sessions.findMany as jest.Mock).mockResolvedValue([sessionWithCount]);

      await service.listSessions({ hosted_by_me: true }, mockUser);

      expect(prismaService.m09_class_sessions.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            host_id: mockUser.id,
          }),
        }),
      );
    });
  });

  describe('getSessionDetails', () => {
    it('should return session with participants', async () => {
      const sessionWithParticipants = {
        ...mockSession,
        participants: [mockParticipant],
      };
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(
        sessionWithParticipants,
      );

      const result = await service.getSessionDetails('session-123');

      expect(result.session).toBeDefined();
      expect(result.session.participants).toHaveLength(1);
    });

    it('should throw NotFoundException when session not found', async () => {
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getSessionDetails('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSessionStateHistory', () => {
    it('should return session state history', async () => {
      const mockStateLogs = [
        {
          id: 'log-1',
          session_id: 'session-123',
          previous_state: null,
          new_state: 'scheduled',
          changed_by: 'user-123',
          reason: 'Session created',
          created_at: new Date(),
        },
        {
          id: 'log-2',
          session_id: 'session-123',
          previous_state: 'scheduled',
          new_state: 'active',
          changed_by: 'user-123',
          reason: 'Session started by host',
          created_at: new Date(),
        },
      ];
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.m09_class_session_state_logs.findMany as jest.Mock).mockResolvedValue(
        mockStateLogs,
      );

      const result = await service.getSessionStateHistory('session-123');

      expect(result.session_id).toBe('session-123');
      expect(result.state_logs).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should throw NotFoundException when session not found', async () => {
      (prismaService.m09_class_sessions.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getSessionStateHistory('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

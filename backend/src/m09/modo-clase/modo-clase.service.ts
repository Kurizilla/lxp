import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  M09ClassSessionState as PrismaClassSessionState,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma';
import { AuthenticatedUser } from '../../m01/auth/jwt.strategy';
import {
  M09CreateClassSessionDto,
  M09UpdateClassSessionDto,
  M09StartSessionDto,
  M09ChangeSessionStateDto,
  M09JoinSessionDto,
  M09ClassSessionsQueryDto,
  M09ClassSessionState,
  M09ClassSessionDto,
  M09ClassSessionWithParticipantsDto,
  M09CreateClassSessionResponseDto,
  M09UpdateClassSessionResponseDto,
  M09StartSessionResponseDto,
  M09ChangeSessionStateResponseDto,
  M09JoinSessionResponseDto,
  M09ClassSessionsResponseDto,
  M09ClassSessionDetailsResponseDto,
  M09SessionStateHistoryResponseDto,
  M09StateLogEntryDto,
} from '../dto/modo-clase.dto';

/**
 * Service for class session (modo clase) operations
 * Handles session creation, state management, and participant tracking
 */
@Injectable()
export class M09ModoClaseService {
  private readonly logger = new Logger(M09ModoClaseService.name);
  private readonly DEFAULT_LIMIT = 50;
  private readonly MAX_LIMIT = 200;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique join code for sessions
   */
  private generateJoinCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  /**
   * Validate state transition
   */
  private isValidStateTransition(
    currentState: string,
    newState: M09ClassSessionState,
  ): boolean {
    const validTransitions: Record<string, M09ClassSessionState[]> = {
      scheduled: [M09ClassSessionState.WAITING, M09ClassSessionState.CANCELLED],
      waiting: [
        M09ClassSessionState.ACTIVE,
        M09ClassSessionState.CANCELLED,
      ],
      active: [
        M09ClassSessionState.PAUSED,
        M09ClassSessionState.ENDED,
      ],
      paused: [
        M09ClassSessionState.ACTIVE,
        M09ClassSessionState.ENDED,
      ],
      ended: [], // No transitions from ended state
      cancelled: [], // No transitions from cancelled state
    };

    return validTransitions[currentState]?.includes(newState) ?? false;
  }

  /**
   * Create a new class session
   */
  async createSession(
    dto: M09CreateClassSessionDto,
    user: AuthenticatedUser,
  ): Promise<M09CreateClassSessionResponseDto> {
    // Verify classroom exists
    const classroom = await this.prisma.m01_classrooms.findUnique({
      where: { id: dto.classroom_id },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom ${dto.classroom_id} not found`);
    }

    // Verify event exists if provided
    if (dto.event_id) {
      const event = await this.prisma.m09_calendar_events.findUnique({
        where: { id: dto.event_id },
      });
      if (!event) {
        throw new NotFoundException(`Calendar event ${dto.event_id} not found`);
      }
    }

    // Create the session
    const session = await this.prisma.m09_class_sessions.create({
      data: {
        classroom_id: dto.classroom_id,
        event_id: dto.event_id || null,
        title: dto.title,
        description: dto.description || null,
        state: 'scheduled' as PrismaClassSessionState,
        scheduled_start: new Date(dto.scheduled_start),
        scheduled_end: dto.scheduled_end ? new Date(dto.scheduled_end) : null,
        host_id: user.id,
        max_participants: dto.max_participants || null,
      },
      include: {
        host: {
          select: { email: true, first_name: true, last_name: true },
        },
      },
    });

    // Log state creation
    await this.prisma.m09_class_session_state_logs.create({
      data: {
        session_id: session.id,
        previous_state: null,
        new_state: 'scheduled' as PrismaClassSessionState,
        changed_by: user.id,
        reason: 'Session created',
      },
    });

    this.logger.log(
      `Class session ${session.id} created for classroom ${dto.classroom_id} by user ${user.email}`,
    );

    return {
      session: this.mapSessionToDto(session),
      message: 'Session created successfully',
    };
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<M09ClassSessionDto> {
    const session = await this.prisma.m09_class_sessions.findUnique({
      where: { id: sessionId },
      include: {
        host: {
          select: { email: true, first_name: true, last_name: true },
        },
        _count: {
          select: { participants: { where: { is_present: true } } },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return this.mapSessionToDto(session);
  }

  /**
   * Get session details with participants
   */
  async getSessionDetails(
    sessionId: string,
  ): Promise<M09ClassSessionDetailsResponseDto> {
    const session = await this.prisma.m09_class_sessions.findUnique({
      where: { id: sessionId },
      include: {
        host: {
          select: { email: true, first_name: true, last_name: true },
        },
        participants: {
          include: {
            user: {
              select: { email: true, first_name: true, last_name: true },
            },
          },
          orderBy: { joined_at: 'desc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return {
      session: this.mapSessionWithParticipantsToDto(session),
    };
  }

  /**
   * Update a class session
   */
  async updateSession(
    sessionId: string,
    dto: M09UpdateClassSessionDto,
    user: AuthenticatedUser,
  ): Promise<M09UpdateClassSessionResponseDto> {
    // Verify session exists
    const existingSession = await this.prisma.m09_class_sessions.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Only allow updates to scheduled sessions
    if (existingSession.state !== 'scheduled') {
      throw new BadRequestException(
        'Only scheduled sessions can be updated. Use state change endpoints for other modifications.',
      );
    }

    // Build update data
    const updateData: Prisma.m09_class_sessionsUpdateInput = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.scheduled_start !== undefined) {
      updateData.scheduled_start = new Date(dto.scheduled_start);
    }
    if (dto.scheduled_end !== undefined) {
      updateData.scheduled_end = dto.scheduled_end
        ? new Date(dto.scheduled_end)
        : null;
    }
    if (dto.max_participants !== undefined) {
      updateData.max_participants = dto.max_participants;
    }

    const session = await this.prisma.m09_class_sessions.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        host: {
          select: { email: true, first_name: true, last_name: true },
        },
      },
    });

    this.logger.log(`Class session ${sessionId} updated by user ${user.email}`);

    return {
      session: this.mapSessionToDto(session),
      message: 'Session updated successfully',
    };
  }

  /**
   * Start a class session (transition to active state)
   */
  async startSession(
    dto: M09StartSessionDto,
    user: AuthenticatedUser,
  ): Promise<M09StartSessionResponseDto> {
    const session = await this.prisma.m09_class_sessions.findUnique({
      where: { id: dto.session_id },
    });

    if (!session) {
      throw new NotFoundException(`Session ${dto.session_id} not found`);
    }

    // Verify user is the host
    if (session.host_id !== user.id) {
      throw new ForbiddenException('Only the session host can start the session');
    }

    // Validate state transition (scheduled -> waiting -> active, or scheduled -> active)
    const validStartStates = ['scheduled', 'waiting'];
    if (!validStartStates.includes(session.state)) {
      throw new BadRequestException(
        `Cannot start session in ${session.state} state`,
      );
    }

    // Generate join code if not exists
    let joinCode = session.join_code;
    if (!joinCode) {
      // Ensure unique join code
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        joinCode = this.generateJoinCode();
        const existing = await this.prisma.m09_class_sessions.findUnique({
          where: { join_code: joinCode },
        });
        if (!existing) break;
        attempts++;
      }
      if (attempts === maxAttempts) {
        throw new BadRequestException('Failed to generate unique join code');
      }
    }

    const previousState = session.state;

    // Update session to active state
    const updatedSession = await this.prisma.m09_class_sessions.update({
      where: { id: dto.session_id },
      data: {
        state: 'active' as PrismaClassSessionState,
        actual_start: new Date(),
        join_code: joinCode,
      },
      include: {
        host: {
          select: { email: true, first_name: true, last_name: true },
        },
      },
    });

    // Log state change
    await this.prisma.m09_class_session_state_logs.create({
      data: {
        session_id: dto.session_id,
        previous_state: previousState as PrismaClassSessionState,
        new_state: 'active' as PrismaClassSessionState,
        changed_by: user.id,
        reason: 'Session started by host',
      },
    });

    this.logger.log(
      `Class session ${dto.session_id} started by user ${user.email}`,
    );

    return {
      session: this.mapSessionToDto(updatedSession),
      join_code: joinCode!,
      message: 'Session started successfully',
    };
  }

  /**
   * Change session state
   */
  async changeSessionState(
    dto: M09ChangeSessionStateDto,
    user: AuthenticatedUser,
  ): Promise<M09ChangeSessionStateResponseDto> {
    const session = await this.prisma.m09_class_sessions.findUnique({
      where: { id: dto.session_id },
    });

    if (!session) {
      throw new NotFoundException(`Session ${dto.session_id} not found`);
    }

    // Verify user is the host for most state changes
    if (session.host_id !== user.id) {
      throw new ForbiddenException(
        'Only the session host can change the session state',
      );
    }

    // Map DTO enum to Prisma enum
    const newState = dto.new_state as unknown as PrismaClassSessionState;

    // Validate state transition
    if (!this.isValidStateTransition(session.state, dto.new_state)) {
      throw new BadRequestException(
        `Invalid state transition from ${session.state} to ${dto.new_state}`,
      );
    }

    const previousState = session.state;

    // Build update data
    const updateData: Prisma.m09_class_sessionsUpdateInput = {
      state: newState,
    };

    // Set actual_end for ended/cancelled states
    if (
      dto.new_state === M09ClassSessionState.ENDED ||
      dto.new_state === M09ClassSessionState.CANCELLED
    ) {
      updateData.actual_end = new Date();
    }

    const updatedSession = await this.prisma.m09_class_sessions.update({
      where: { id: dto.session_id },
      data: updateData,
      include: {
        host: {
          select: { email: true, first_name: true, last_name: true },
        },
      },
    });

    // Log state change
    await this.prisma.m09_class_session_state_logs.create({
      data: {
        session_id: dto.session_id,
        previous_state: previousState as PrismaClassSessionState,
        new_state: newState,
        changed_by: user.id,
        reason: dto.reason || null,
      },
    });

    this.logger.log(
      `Class session ${dto.session_id} state changed from ${previousState} to ${dto.new_state} by user ${user.email}`,
    );

    return {
      session: this.mapSessionToDto(updatedSession),
      previous_state: previousState,
      new_state: dto.new_state,
      message: `Session state changed to ${dto.new_state}`,
    };
  }

  /**
   * Join a session using join code
   */
  async joinSession(
    dto: M09JoinSessionDto,
    user: AuthenticatedUser,
  ): Promise<M09JoinSessionResponseDto> {
    // Find session by join code
    const session = await this.prisma.m09_class_sessions.findUnique({
      where: { join_code: dto.join_code },
      include: {
        host: {
          select: { email: true, first_name: true, last_name: true },
        },
        participants: {
          include: {
            user: {
              select: { email: true, first_name: true, last_name: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Invalid join code');
    }

    // Verify session is active or waiting
    if (session.state !== 'active' && session.state !== 'waiting') {
      throw new BadRequestException(
        `Cannot join session in ${session.state} state`,
      );
    }

    // Check max participants
    const currentParticipantCount = session.participants.filter(
      (p) => p.is_present,
    ).length;
    if (
      session.max_participants &&
      currentParticipantCount >= session.max_participants
    ) {
      throw new BadRequestException('Session is full');
    }

    // Check if user is already a participant
    let participant = await this.prisma.m09_class_session_participants.findUnique({
      where: {
        session_id_user_id: {
          session_id: session.id,
          user_id: user.id,
        },
      },
    });

    if (participant) {
      // Rejoin - update presence
      participant = await this.prisma.m09_class_session_participants.update({
        where: { id: participant.id },
        data: {
          is_present: true,
          left_at: null,
          joined_at: new Date(),
        },
      });
    } else {
      // New participant
      const role = session.host_id === user.id ? 'host' : 'student';
      participant = await this.prisma.m09_class_session_participants.create({
        data: {
          session_id: session.id,
          user_id: user.id,
          role,
          is_present: true,
          hand_raised: false,
        },
      });
    }

    // Reload session with updated participants
    const updatedSession = await this.prisma.m09_class_sessions.findUnique({
      where: { id: session.id },
      include: {
        host: {
          select: { email: true, first_name: true, last_name: true },
        },
        participants: {
          include: {
            user: {
              select: { email: true, first_name: true, last_name: true },
            },
          },
        },
      },
    });

    this.logger.log(
      `User ${user.email} joined session ${session.id}`,
    );

    return {
      session: this.mapSessionWithParticipantsToDto(updatedSession!),
      participant: {
        id: participant.id,
        user_id: participant.user_id,
        user_email: user.email,
        user_first_name: user.first_name,
        user_last_name: user.last_name,
        role: participant.role,
        joined_at: participant.joined_at,
        left_at: participant.left_at,
        is_present: participant.is_present,
        hand_raised: participant.hand_raised,
      },
      message: 'Joined session successfully',
    };
  }

  /**
   * List class sessions with filtering
   */
  async listSessions(
    query: M09ClassSessionsQueryDto,
    user: AuthenticatedUser,
  ): Promise<M09ClassSessionsResponseDto> {
    const limit = Math.min(query.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
    const offset = query.offset || 0;

    // Build where conditions
    const whereConditions: Prisma.m09_class_sessionsWhereInput = {};

    if (query.classroom_id) {
      whereConditions.classroom_id = query.classroom_id;
    }

    if (query.state) {
      whereConditions.state = query.state as unknown as PrismaClassSessionState;
    }

    if (query.start_date || query.end_date) {
      whereConditions.scheduled_start = {};
      if (query.start_date) {
        whereConditions.scheduled_start.gte = new Date(query.start_date);
      }
      if (query.end_date) {
        whereConditions.scheduled_start.lte = new Date(query.end_date);
      }
    }

    if (query.hosted_by_me) {
      whereConditions.host_id = user.id;
    }

    // Get total count
    const total = await this.prisma.m09_class_sessions.count({
      where: whereConditions,
    });

    // Get sessions
    const sessions = await this.prisma.m09_class_sessions.findMany({
      where: whereConditions,
      include: {
        host: {
          select: { email: true, first_name: true, last_name: true },
        },
        _count: {
          select: { participants: { where: { is_present: true } } },
        },
      },
      orderBy: { scheduled_start: 'desc' },
      skip: offset,
      take: limit,
    });

    return {
      sessions: sessions.map((s) => this.mapSessionToDto(s)),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get session state history
   */
  async getSessionStateHistory(
    sessionId: string,
  ): Promise<M09SessionStateHistoryResponseDto> {
    // Verify session exists
    const session = await this.prisma.m09_class_sessions.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const stateLogs = await this.prisma.m09_class_session_state_logs.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'desc' },
    });

    const logs: M09StateLogEntryDto[] = stateLogs.map((log) => ({
      id: log.id,
      previous_state: log.previous_state,
      new_state: log.new_state,
      changed_by: log.changed_by,
      reason: log.reason,
      created_at: log.created_at,
    }));

    return {
      session_id: sessionId,
      state_logs: logs,
      total: logs.length,
    };
  }

  /**
   * Map Prisma session to DTO
   */
  private mapSessionToDto(session: {
    id: string;
    classroom_id: string;
    event_id: string | null;
    title: string;
    description: string | null;
    state: string;
    scheduled_start: Date;
    scheduled_end: Date | null;
    actual_start: Date | null;
    actual_end: Date | null;
    host_id: string | null;
    host?: { email: string; first_name: string | null; last_name: string | null } | null;
    join_code: string | null;
    max_participants: number | null;
    _count?: { participants: number };
    created_at: Date;
    updated_at: Date;
  }): M09ClassSessionDto {
    return {
      id: session.id,
      classroom_id: session.classroom_id,
      event_id: session.event_id,
      title: session.title,
      description: session.description,
      state: session.state,
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
      actual_start: session.actual_start,
      actual_end: session.actual_end,
      host_id: session.host_id,
      host_email: session.host?.email,
      host_first_name: session.host?.first_name,
      host_last_name: session.host?.last_name,
      join_code: session.join_code,
      max_participants: session.max_participants,
      participant_count: session._count?.participants,
      created_at: session.created_at,
      updated_at: session.updated_at,
    };
  }

  /**
   * Map Prisma session with participants to DTO
   */
  private mapSessionWithParticipantsToDto(session: {
    id: string;
    classroom_id: string;
    event_id: string | null;
    title: string;
    description: string | null;
    state: string;
    scheduled_start: Date;
    scheduled_end: Date | null;
    actual_start: Date | null;
    actual_end: Date | null;
    host_id: string | null;
    host?: { email: string; first_name: string | null; last_name: string | null } | null;
    join_code: string | null;
    max_participants: number | null;
    participants: Array<{
      id: string;
      user_id: string;
      user?: { email: string; first_name: string | null; last_name: string | null };
      role: string;
      joined_at: Date;
      left_at: Date | null;
      is_present: boolean;
      hand_raised: boolean;
    }>;
    created_at: Date;
    updated_at: Date;
  }): M09ClassSessionWithParticipantsDto {
    return {
      id: session.id,
      classroom_id: session.classroom_id,
      event_id: session.event_id,
      title: session.title,
      description: session.description,
      state: session.state,
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
      actual_start: session.actual_start,
      actual_end: session.actual_end,
      host_id: session.host_id,
      host_email: session.host?.email,
      host_first_name: session.host?.first_name,
      host_last_name: session.host?.last_name,
      join_code: session.join_code,
      max_participants: session.max_participants,
      participant_count: session.participants.filter((p) => p.is_present).length,
      created_at: session.created_at,
      updated_at: session.updated_at,
      participants: session.participants.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        user_email: p.user?.email,
        user_first_name: p.user?.first_name,
        user_last_name: p.user?.last_name,
        role: p.role,
        joined_at: p.joined_at,
        left_at: p.left_at,
        is_present: p.is_present,
        hand_raised: p.hand_raised,
      })),
    };
  }
}

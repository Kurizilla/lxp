import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { trace } from '@opentelemetry/api';
import { PrismaService } from '../../../prisma';
import { PaginatedResponseDto } from '../../../common/dto';
import {
  SessionResponseDto,
  SessionFilterDto,
  TerminateSessionsDto,
  TerminateUserSessionsDto,
} from './dto';

@Injectable()
export class SessionService {
  private readonly tracer = trace.getTracer('m01-session-service');

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async findAll(filter: SessionFilterDto): Promise<PaginatedResponseDto<SessionResponseDto>> {
    const span = this.tracer.startSpan('SessionService.findAll');

    try {
      const { page = 1, limit = 10, user_id, is_active, search } = filter;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (user_id) {
        where.user_id = BigInt(user_id);
      }

      if (is_active !== undefined) {
        where.is_active = is_active;
      }

      if (search) {
        where.OR = [
          { ip_address: { contains: search, mode: 'insensitive' } },
          { user_agent: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { first_name: { contains: search, mode: 'insensitive' } } },
          { user: { last_name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [sessions, total] = await Promise.all([
        this.prisma.session.findMany({
          where,
          skip,
          take: limit,
          include: { user: true },
          orderBy: { last_activity: 'desc' },
        }),
        this.prisma.session.count({ where }),
      ]);

      this.logger.info('Sessions fetched successfully', {
        total,
        page,
        limit,
        filters: { user_id, is_active, search },
      });

      const data = sessions.map(SessionResponseDto.fromEntity);
      span.end();
      return PaginatedResponseDto.create(data, total, page, limit);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async findOne(id: string): Promise<SessionResponseDto> {
    const span = this.tracer.startSpan('SessionService.findOne');

    try {
      const session = await this.prisma.session.findUnique({
        where: { id: BigInt(id) },
        include: { user: true },
      });

      if (!session) {
        throw new NotFoundException(`Session with ID ${id} not found`);
      }

      this.logger.info('Session fetched successfully', { sessionId: id });
      span.end();
      return SessionResponseDto.fromEntity(session);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<SessionResponseDto[]> {
    const span = this.tracer.startSpan('SessionService.findByUserId');

    try {
      const sessions = await this.prisma.session.findMany({
        where: { user_id: BigInt(userId) },
        include: { user: true },
        orderBy: { last_activity: 'desc' },
      });

      this.logger.info('User sessions fetched successfully', {
        userId,
        count: sessions.length,
      });

      span.end();
      return sessions.map(SessionResponseDto.fromEntity);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async getActiveSessions(): Promise<PaginatedResponseDto<SessionResponseDto>> {
    const span = this.tracer.startSpan('SessionService.getActiveSessions');

    try {
      const now = new Date();

      const [sessions, total] = await Promise.all([
        this.prisma.session.findMany({
          where: {
            is_active: true,
            expires_at: { gt: now },
          },
          include: { user: true },
          orderBy: { last_activity: 'desc' },
        }),
        this.prisma.session.count({
          where: {
            is_active: true,
            expires_at: { gt: now },
          },
        }),
      ]);

      this.logger.info('Active sessions fetched successfully', { total });
      span.end();
      return PaginatedResponseDto.create(
        sessions.map(SessionResponseDto.fromEntity),
        total,
        1,
        total,
      );
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async terminate(sessionId: string): Promise<void> {
    const span = this.tracer.startSpan('SessionService.terminate');

    try {
      const session = await this.prisma.session.findUnique({
        where: { id: BigInt(sessionId) },
      });

      if (!session) {
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }

      await this.prisma.session.update({
        where: { id: BigInt(sessionId) },
        data: { is_active: false },
      });

      this.logger.info('Session terminated successfully', { sessionId });
      span.end();
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async terminateMultiple(dto: TerminateSessionsDto): Promise<{ terminated_count: number }> {
    const span = this.tracer.startSpan('SessionService.terminateMultiple');

    try {
      const sessionIds = dto.session_ids.map((id) => BigInt(id));

      const result = await this.prisma.session.updateMany({
        where: {
          id: { in: sessionIds },
          is_active: true,
        },
        data: { is_active: false },
      });

      this.logger.info('Multiple sessions terminated successfully', {
        requested: dto.session_ids.length,
        terminated: result.count,
      });

      span.end();
      return { terminated_count: result.count };
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async terminateUserSessions(
    userId: string,
    dto?: TerminateUserSessionsDto,
  ): Promise<{ terminated_count: number }> {
    const span = this.tracer.startSpan('SessionService.terminateUserSessions');

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const where: any = {
        user_id: BigInt(userId),
        is_active: true,
      };

      if (dto?.exclude_session_id) {
        where.id = { not: BigInt(dto.exclude_session_id) };
      }

      const result = await this.prisma.session.updateMany({
        where,
        data: { is_active: false },
      });

      this.logger.info('User sessions terminated successfully', {
        userId,
        terminated: result.count,
        excluded: dto?.exclude_session_id,
      });

      span.end();
      return { terminated_count: result.count };
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async terminateAllSessions(): Promise<{ terminated_count: number }> {
    const span = this.tracer.startSpan('SessionService.terminateAllSessions');

    try {
      const result = await this.prisma.session.updateMany({
        where: { is_active: true },
        data: { is_active: false },
      });

      this.logger.info('All sessions terminated successfully', {
        terminated: result.count,
      });

      span.end();
      return { terminated_count: result.count };
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async cleanupExpiredSessions(): Promise<{ cleaned_count: number }> {
    const span = this.tracer.startSpan('SessionService.cleanupExpiredSessions');

    try {
      const now = new Date();

      const result = await this.prisma.session.deleteMany({
        where: {
          OR: [{ expires_at: { lt: now } }, { is_active: false }],
        },
      });

      this.logger.info('Expired sessions cleaned up', {
        cleaned: result.count,
      });

      span.end();
      return { cleaned_count: result.count };
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }

  async getSessionStats(): Promise<{
    total: number;
    active: number;
    expired: number;
  }> {
    const span = this.tracer.startSpan('SessionService.getSessionStats');

    try {
      const now = new Date();

      const [total, active] = await Promise.all([
        this.prisma.session.count(),
        this.prisma.session.count({
          where: {
            is_active: true,
            expires_at: { gt: now },
          },
        }),
      ]);

      const expired = total - active;

      this.logger.info('Session stats fetched', { total, active, expired });
      span.end();
      return { total, active, expired };
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  }
}

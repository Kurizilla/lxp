import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../m01/auth/jwt-auth.guard';
import { M01TeacherGuard } from '../../m01/guards/m01-teacher.guard';
import { AuthenticatedUser } from '../../m01/auth/jwt.strategy';
import { M09ModoClaseService } from './modo-clase.service';
import {
  M09CreateClassSessionDto,
  M09UpdateClassSessionDto,
  M09StartSessionDto,
  M09ChangeSessionStateDto,
  M09JoinSessionDto,
  M09ClassSessionsQueryDto,
  M09CreateClassSessionResponseDto,
  M09UpdateClassSessionResponseDto,
  M09StartSessionResponseDto,
  M09ChangeSessionStateResponseDto,
  M09JoinSessionResponseDto,
  M09ClassSessionsResponseDto,
  M09ClassSessionDetailsResponseDto,
  M09SessionStateHistoryResponseDto,
  M09ClassSessionDto,
} from '../dto/modo-clase.dto';

/**
 * Extended Express Request with authenticated user
 */
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Controller for modo clase (class session) endpoints
 * Provides session creation, state management, and participant tracking
 * Endpoints are protected by JWT authentication
 * Teacher-specific endpoints additionally require teacher role via CASL
 */
@Controller('m09/modo-clase')
@UseGuards(JwtAuthGuard)
export class M09ModoClaseController {
  constructor(private readonly modoClaseService: M09ModoClaseService) {}

  /**
   * POST /m09/modo-clase/sessions
   * Create a new class session (teacher only)
   */
  @Post('sessions')
  @UseGuards(M01TeacherGuard)
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Body() dto: M09CreateClassSessionDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09CreateClassSessionResponseDto> {
    return this.modoClaseService.createSession(dto, req.user);
  }

  /**
   * GET /m09/modo-clase/sessions
   * List class sessions with filtering
   */
  @Get('sessions')
  async listSessions(
    @Query() query: M09ClassSessionsQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09ClassSessionsResponseDto> {
    return this.modoClaseService.listSessions(query, req.user);
  }

  /**
   * GET /m09/modo-clase/sessions/:id
   * Get session by ID
   */
  @Get('sessions/:id')
  async getSessionById(
    @Param('id') id: string,
  ): Promise<M09ClassSessionDto> {
    return this.modoClaseService.getSessionById(id);
  }

  /**
   * GET /m09/modo-clase/sessions/:id/details
   * Get session details with participants
   */
  @Get('sessions/:id/details')
  async getSessionDetails(
    @Param('id') id: string,
  ): Promise<M09ClassSessionDetailsResponseDto> {
    return this.modoClaseService.getSessionDetails(id);
  }

  /**
   * GET /m09/modo-clase/sessions/:id/state-history
   * Get session state change history
   */
  @Get('sessions/:id/state-history')
  async getSessionStateHistory(
    @Param('id') id: string,
  ): Promise<M09SessionStateHistoryResponseDto> {
    return this.modoClaseService.getSessionStateHistory(id);
  }

  /**
   * PATCH /m09/modo-clase/sessions/:id
   * Update a class session (teacher only)
   */
  @Patch('sessions/:id')
  @UseGuards(M01TeacherGuard)
  @HttpCode(HttpStatus.OK)
  async updateSession(
    @Param('id') id: string,
    @Body() dto: M09UpdateClassSessionDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09UpdateClassSessionResponseDto> {
    return this.modoClaseService.updateSession(id, dto, req.user);
  }

  /**
   * POST /m09/modo-clase/sessions/start
   * Start a class session (teacher only)
   * Transitions session from scheduled/waiting to active state
   */
  @Post('sessions/start')
  @UseGuards(M01TeacherGuard)
  @HttpCode(HttpStatus.OK)
  async startSession(
    @Body() dto: M09StartSessionDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09StartSessionResponseDto> {
    return this.modoClaseService.startSession(dto, req.user);
  }

  /**
   * POST /m09/modo-clase/sessions/change-state
   * Change session state (teacher only)
   * Supports: pause, resume, end, cancel
   */
  @Post('sessions/change-state')
  @UseGuards(M01TeacherGuard)
  @HttpCode(HttpStatus.OK)
  async changeSessionState(
    @Body() dto: M09ChangeSessionStateDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09ChangeSessionStateResponseDto> {
    return this.modoClaseService.changeSessionState(dto, req.user);
  }

  /**
   * POST /m09/modo-clase/join
   * Join a session using join code
   * Available to all authenticated users
   */
  @Post('join')
  @HttpCode(HttpStatus.OK)
  async joinSession(
    @Body() dto: M09JoinSessionDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09JoinSessionResponseDto> {
    return this.modoClaseService.joinSession(dto, req.user);
  }
}

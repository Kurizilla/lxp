import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
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
import { M09CalendarService } from './calendar.service';
import {
  M09AssignCalendarDto,
  M09UpdateCalendarDto,
  M09CreateCalendarEventDto,
  M09UpdateCalendarEventDto,
  M09CalendarEventsQueryDto,
  M09CalendarByClassroomQueryDto,
  M09AssignCalendarResponseDto,
  M09UpdateCalendarResponseDto,
  M09CalendarEventsResponseDto,
  M09CreateCalendarEventResponseDto,
  M09UpdateCalendarEventResponseDto,
  M09DeleteCalendarEventResponseDto,
  M09CalendarDto,
} from '../dto/calendar.dto';

/**
 * Extended Express Request with authenticated user
 */
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Controller for calendar endpoints
 * Provides calendar assignment and event management
 * All endpoints require JWT authentication and teacher role via CASL
 */
@Controller('m09/calendar')
@UseGuards(JwtAuthGuard, M01TeacherGuard)
export class M09CalendarController {
  constructor(private readonly calendarService: M09CalendarService) {}

  /**
   * POST /m09/calendar/assign
   * Assign a calendar to a classroom
   */
  @Post('assign')
  @HttpCode(HttpStatus.CREATED)
  async assignCalendar(
    @Body() dto: M09AssignCalendarDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09AssignCalendarResponseDto> {
    return this.calendarService.assignCalendar(dto, req.user);
  }

  /**
   * GET /m09/calendar/:id
   * Get calendar by ID
   */
  @Get(':id')
  async getCalendarById(
    @Param('id') id: string,
  ): Promise<M09CalendarDto> {
    return this.calendarService.getCalendarById(id);
  }

  /**
   * GET /m09/calendar/classroom
   * Get calendar by classroom ID
   */
  @Get('by-classroom')
  async getCalendarByClassroom(
    @Query() query: M09CalendarByClassroomQueryDto,
  ): Promise<M09CalendarDto> {
    return this.calendarService.getCalendarByClassroom(query.classroom_id);
  }

  /**
   * PATCH /m09/calendar/:id
   * Update a calendar
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateCalendar(
    @Param('id') id: string,
    @Body() dto: M09UpdateCalendarDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09UpdateCalendarResponseDto> {
    return this.calendarService.updateCalendar(id, dto, req.user);
  }

  /**
   * POST /m09/calendar/events
   * Create a calendar event
   */
  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @Body() dto: M09CreateCalendarEventDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09CreateCalendarEventResponseDto> {
    return this.calendarService.createEvent(dto, req.user);
  }

  /**
   * GET /m09/calendar/events
   * List calendar events with filtering
   */
  @Get('events')
  async listEvents(
    @Query() query: M09CalendarEventsQueryDto,
  ): Promise<M09CalendarEventsResponseDto> {
    return this.calendarService.listEvents(query);
  }

  /**
   * GET /m09/calendar/events/:id
   * Get event by ID
   */
  @Get('events/:id')
  async getEventById(
    @Param('id') id: string,
  ): Promise<import('../dto/calendar.dto').M09CalendarEventDto> {
    return this.calendarService.getEventById(id);
  }

  /**
   * PATCH /m09/calendar/events/:id
   * Update a calendar event
   */
  @Patch('events/:id')
  @HttpCode(HttpStatus.OK)
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: M09UpdateCalendarEventDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09UpdateCalendarEventResponseDto> {
    return this.calendarService.updateEvent(id, dto, req.user);
  }

  /**
   * DELETE /m09/calendar/events/:id
   * Delete a calendar event
   */
  @Delete('events/:id')
  @HttpCode(HttpStatus.OK)
  async deleteEvent(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<M09DeleteCalendarEventResponseDto> {
    return this.calendarService.deleteEvent(id, req.user);
  }
}

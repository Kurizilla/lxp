import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma';
import { AuthenticatedUser } from '../../m01/auth/jwt.strategy';
import {
  M09AssignCalendarDto,
  M09UpdateCalendarDto,
  M09CreateCalendarEventDto,
  M09UpdateCalendarEventDto,
  M09CalendarEventsQueryDto,
  M09CalendarDto,
  M09CalendarEventDto,
  M09AssignCalendarResponseDto,
  M09UpdateCalendarResponseDto,
  M09CalendarEventsResponseDto,
  M09CreateCalendarEventResponseDto,
  M09UpdateCalendarEventResponseDto,
  M09DeleteCalendarEventResponseDto,
} from '../dto/calendar.dto';

/**
 * Service for calendar operations
 * Handles calendar assignment to classrooms and event management
 */
@Injectable()
export class M09CalendarService {
  private readonly logger = new Logger(M09CalendarService.name);
  private readonly DEFAULT_LIMIT = 50;
  private readonly MAX_LIMIT = 200;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Assign a calendar to a classroom
   * Creates a new calendar configuration for the classroom
   */
  async assignCalendar(
    dto: M09AssignCalendarDto,
    user: AuthenticatedUser,
  ): Promise<M09AssignCalendarResponseDto> {
    // Verify classroom exists
    const classroom = await this.prisma.m01_classrooms.findUnique({
      where: { id: dto.classroom_id },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom ${dto.classroom_id} not found`);
    }

    // Check if calendar already exists for this classroom
    const existingCalendar = await this.prisma.m09_calendars.findUnique({
      where: { classroom_id: dto.classroom_id },
    });

    if (existingCalendar) {
      throw new ConflictException(
        `Calendar already exists for classroom ${dto.classroom_id}`,
      );
    }

    // Create the calendar
    const calendar = await this.prisma.m09_calendars.create({
      data: {
        classroom_id: dto.classroom_id,
        name: dto.name,
        description: dto.description || null,
        timezone: dto.timezone || 'UTC',
        is_active: true,
      },
    });

    this.logger.log(
      `Calendar ${calendar.id} assigned to classroom ${dto.classroom_id} by user ${user.email}`,
    );

    return {
      calendar: this.mapCalendarToDto(calendar),
      message: 'Calendar assigned successfully',
    };
  }

  /**
   * Get calendar by ID
   */
  async getCalendarById(calendarId: string): Promise<M09CalendarDto> {
    const calendar = await this.prisma.m09_calendars.findUnique({
      where: { id: calendarId },
    });

    if (!calendar) {
      throw new NotFoundException(`Calendar ${calendarId} not found`);
    }

    return this.mapCalendarToDto(calendar);
  }

  /**
   * Get calendar by classroom ID
   */
  async getCalendarByClassroom(classroomId: string): Promise<M09CalendarDto> {
    const calendar = await this.prisma.m09_calendars.findUnique({
      where: { classroom_id: classroomId },
    });

    if (!calendar) {
      throw new NotFoundException(
        `Calendar not found for classroom ${classroomId}`,
      );
    }

    return this.mapCalendarToDto(calendar);
  }

  /**
   * Update a calendar
   */
  async updateCalendar(
    calendarId: string,
    dto: M09UpdateCalendarDto,
    user: AuthenticatedUser,
  ): Promise<M09UpdateCalendarResponseDto> {
    // Verify calendar exists
    const existingCalendar = await this.prisma.m09_calendars.findUnique({
      where: { id: calendarId },
    });

    if (!existingCalendar) {
      throw new NotFoundException(`Calendar ${calendarId} not found`);
    }

    // Build update data
    const updateData: Prisma.m09_calendarsUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.timezone !== undefined) updateData.timezone = dto.timezone;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

    const calendar = await this.prisma.m09_calendars.update({
      where: { id: calendarId },
      data: updateData,
    });

    this.logger.log(
      `Calendar ${calendarId} updated by user ${user.email}`,
    );

    return {
      calendar: this.mapCalendarToDto(calendar),
      message: 'Calendar updated successfully',
    };
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    dto: M09CreateCalendarEventDto,
    user: AuthenticatedUser,
  ): Promise<M09CreateCalendarEventResponseDto> {
    // Verify calendar exists
    const calendar = await this.prisma.m09_calendars.findUnique({
      where: { id: dto.calendar_id },
    });

    if (!calendar) {
      throw new NotFoundException(`Calendar ${dto.calendar_id} not found`);
    }

    // Validate dates
    const startTime = new Date(dto.start_time);
    const endTime = new Date(dto.end_time);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Create the event
    const event = await this.prisma.m09_calendar_events.create({
      data: {
        calendar_id: dto.calendar_id,
        title: dto.title,
        description: dto.description || null,
        event_type: dto.event_type || 'custom',
        start_time: startTime,
        end_time: endTime,
        all_day: dto.all_day || false,
        recurrence_pattern: dto.recurrence_pattern || 'none',
        recurrence_end: dto.recurrence_end ? new Date(dto.recurrence_end) : null,
        location: dto.location || null,
        color: dto.color || null,
        created_by: user.id,
      },
    });

    this.logger.log(
      `Calendar event ${event.id} created in calendar ${dto.calendar_id} by user ${user.email}`,
    );

    return {
      event: this.mapEventToDto(event),
      message: 'Event created successfully',
    };
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string): Promise<M09CalendarEventDto> {
    const event = await this.prisma.m09_calendar_events.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    return this.mapEventToDto(event);
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    eventId: string,
    dto: M09UpdateCalendarEventDto,
    user: AuthenticatedUser,
  ): Promise<M09UpdateCalendarEventResponseDto> {
    // Verify event exists
    const existingEvent = await this.prisma.m09_calendar_events.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    // Validate dates if both are provided
    if (dto.start_time && dto.end_time) {
      const startTime = new Date(dto.start_time);
      const endTime = new Date(dto.end_time);
      if (endTime <= startTime) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    // Build update data
    const updateData: Prisma.m09_calendar_eventsUpdateInput = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.event_type !== undefined) updateData.event_type = dto.event_type;
    if (dto.start_time !== undefined) updateData.start_time = new Date(dto.start_time);
    if (dto.end_time !== undefined) updateData.end_time = new Date(dto.end_time);
    if (dto.all_day !== undefined) updateData.all_day = dto.all_day;
    if (dto.recurrence_pattern !== undefined) updateData.recurrence_pattern = dto.recurrence_pattern;
    if (dto.recurrence_end !== undefined) {
      updateData.recurrence_end = dto.recurrence_end ? new Date(dto.recurrence_end) : null;
    }
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.color !== undefined) updateData.color = dto.color;

    const event = await this.prisma.m09_calendar_events.update({
      where: { id: eventId },
      data: updateData,
    });

    this.logger.log(`Calendar event ${eventId} updated by user ${user.email}`);

    return {
      event: this.mapEventToDto(event),
      message: 'Event updated successfully',
    };
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(
    eventId: string,
    user: AuthenticatedUser,
  ): Promise<M09DeleteCalendarEventResponseDto> {
    // Verify event exists
    const existingEvent = await this.prisma.m09_calendar_events.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    await this.prisma.m09_calendar_events.delete({
      where: { id: eventId },
    });

    this.logger.log(`Calendar event ${eventId} deleted by user ${user.email}`);

    return {
      deleted: true,
      message: 'Event deleted successfully',
    };
  }

  /**
   * List calendar events with filtering
   */
  async listEvents(
    query: M09CalendarEventsQueryDto,
  ): Promise<M09CalendarEventsResponseDto> {
    const limit = Math.min(query.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
    const offset = query.offset || 0;

    // Build where conditions
    const whereConditions: Prisma.m09_calendar_eventsWhereInput = {
      calendar_id: query.calendar_id,
    };

    // Filter by date range
    if (query.start_date || query.end_date) {
      whereConditions.start_time = {};
      if (query.start_date) {
        whereConditions.start_time.gte = new Date(query.start_date);
      }
      if (query.end_date) {
        whereConditions.start_time.lte = new Date(query.end_date);
      }
    }

    // Filter by event type
    if (query.event_type) {
      whereConditions.event_type = query.event_type;
    }

    // Get total count
    const total = await this.prisma.m09_calendar_events.count({
      where: whereConditions,
    });

    // Get events
    const events = await this.prisma.m09_calendar_events.findMany({
      where: whereConditions,
      orderBy: { start_time: 'asc' },
      skip: offset,
      take: limit,
    });

    return {
      events: events.map((e) => this.mapEventToDto(e)),
      total,
      limit,
      offset,
    };
  }

  /**
   * Map Prisma calendar to DTO
   */
  private mapCalendarToDto(calendar: {
    id: string;
    classroom_id: string;
    name: string;
    description: string | null;
    timezone: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }): M09CalendarDto {
    return {
      id: calendar.id,
      classroom_id: calendar.classroom_id,
      name: calendar.name,
      description: calendar.description,
      timezone: calendar.timezone,
      is_active: calendar.is_active,
      created_at: calendar.created_at,
      updated_at: calendar.updated_at,
    };
  }

  /**
   * Map Prisma event to DTO
   */
  private mapEventToDto(event: {
    id: string;
    calendar_id: string;
    title: string;
    description: string | null;
    event_type: string;
    start_time: Date;
    end_time: Date;
    all_day: boolean;
    recurrence_pattern: string;
    recurrence_end: Date | null;
    location: string | null;
    color: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
  }): M09CalendarEventDto {
    return {
      id: event.id,
      calendar_id: event.calendar_id,
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      start_time: event.start_time,
      end_time: event.end_time,
      all_day: event.all_day,
      recurrence_pattern: event.recurrence_pattern,
      recurrence_end: event.recurrence_end,
      location: event.location,
      color: event.color,
      created_by: event.created_by,
      created_at: event.created_at,
      updated_at: event.updated_at,
    };
  }
}

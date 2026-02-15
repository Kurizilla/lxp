import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

/**
 * Calendar event type enum matching Prisma schema
 */
export enum M09CalendarEventType {
  CLASS_SESSION = 'class_session',
  ASSIGNMENT_DUE = 'assignment_due',
  EXAM = 'exam',
  MEETING = 'meeting',
  HOLIDAY = 'holiday',
  CUSTOM = 'custom',
}

/**
 * Recurrence pattern enum matching Prisma schema
 */
export enum M09RecurrencePattern {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

// ============================================================================
// Request DTOs
// ============================================================================

/**
 * DTO for assigning/creating a calendar for a classroom
 */
export class M09AssignCalendarDto {
  @IsUUID('4', { message: 'classroom_id must be a valid UUID' })
  classroom_id!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}

/**
 * DTO for updating a calendar
 */
export class M09UpdateCalendarDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

/**
 * DTO for creating a calendar event
 */
export class M09CreateCalendarEventDto {
  @IsUUID('4', { message: 'calendar_id must be a valid UUID' })
  calendar_id!: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(M09CalendarEventType, { message: 'Invalid event type' })
  @IsOptional()
  event_type?: M09CalendarEventType;

  @IsDateString()
  start_time!: string;

  @IsDateString()
  end_time!: string;

  @IsBoolean()
  @IsOptional()
  all_day?: boolean;

  @IsEnum(M09RecurrencePattern, { message: 'Invalid recurrence pattern' })
  @IsOptional()
  recurrence_pattern?: M09RecurrencePattern;

  @IsDateString()
  @IsOptional()
  recurrence_end?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;
}

/**
 * DTO for updating a calendar event
 */
export class M09UpdateCalendarEventDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(M09CalendarEventType, { message: 'Invalid event type' })
  @IsOptional()
  event_type?: M09CalendarEventType;

  @IsDateString()
  @IsOptional()
  start_time?: string;

  @IsDateString()
  @IsOptional()
  end_time?: string;

  @IsBoolean()
  @IsOptional()
  all_day?: boolean;

  @IsEnum(M09RecurrencePattern, { message: 'Invalid recurrence pattern' })
  @IsOptional()
  recurrence_pattern?: M09RecurrencePattern;

  @IsDateString()
  @IsOptional()
  recurrence_end?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;
}

/**
 * Query parameters for listing calendar events
 */
export class M09CalendarEventsQueryDto {
  @IsUUID('4', { message: 'calendar_id must be a valid UUID' })
  calendar_id!: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsEnum(M09CalendarEventType, { message: 'Invalid event type' })
  @IsOptional()
  event_type?: M09CalendarEventType;

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number;
}

/**
 * Query parameters for getting calendar by classroom
 */
export class M09CalendarByClassroomQueryDto {
  @IsUUID('4', { message: 'classroom_id must be a valid UUID' })
  classroom_id!: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * Calendar response DTO
 */
export interface M09CalendarDto {
  id: string;
  classroom_id: string;
  name: string;
  description: string | null;
  timezone: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Calendar event response DTO
 */
export interface M09CalendarEventDto {
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
}

/**
 * Response DTO for assign calendar operation
 */
export interface M09AssignCalendarResponseDto {
  calendar: M09CalendarDto;
  message: string;
}

/**
 * Response DTO for update calendar operation
 */
export interface M09UpdateCalendarResponseDto {
  calendar: M09CalendarDto;
  message: string;
}

/**
 * Response DTO for calendar events list
 */
export interface M09CalendarEventsResponseDto {
  events: M09CalendarEventDto[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Response DTO for create event operation
 */
export interface M09CreateCalendarEventResponseDto {
  event: M09CalendarEventDto;
  message: string;
}

/**
 * Response DTO for update event operation
 */
export interface M09UpdateCalendarEventResponseDto {
  event: M09CalendarEventDto;
  message: string;
}

/**
 * Response DTO for delete event operation
 */
export interface M09DeleteCalendarEventResponseDto {
  deleted: boolean;
  message: string;
}

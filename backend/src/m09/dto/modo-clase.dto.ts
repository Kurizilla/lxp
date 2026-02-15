import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

/**
 * Class session state enum matching Prisma schema
 */
export enum M09ClassSessionState {
  SCHEDULED = 'scheduled',
  WAITING = 'waiting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

// ============================================================================
// Request DTOs
// ============================================================================

/**
 * DTO for creating a class session
 */
export class M09CreateClassSessionDto {
  @IsUUID('4', { message: 'classroom_id must be a valid UUID' })
  classroom_id!: string;

  @IsUUID('4', { message: 'event_id must be a valid UUID' })
  @IsOptional()
  event_id?: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  scheduled_start!: string;

  @IsDateString()
  @IsOptional()
  scheduled_end?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  max_participants?: number;
}

/**
 * DTO for updating a class session
 */
export class M09UpdateClassSessionDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  @IsOptional()
  scheduled_start?: string;

  @IsDateString()
  @IsOptional()
  scheduled_end?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  max_participants?: number;
}

/**
 * DTO for starting a class session (transition to active state)
 */
export class M09StartSessionDto {
  @IsUUID('4', { message: 'session_id must be a valid UUID' })
  session_id!: string;
}

/**
 * DTO for changing session state
 */
export class M09ChangeSessionStateDto {
  @IsUUID('4', { message: 'session_id must be a valid UUID' })
  session_id!: string;

  @IsEnum(M09ClassSessionState, { message: 'Invalid session state' })
  new_state!: M09ClassSessionState;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}

/**
 * DTO for joining a class session
 */
export class M09JoinSessionDto {
  @IsString()
  @MaxLength(10)
  join_code!: string;
}

/**
 * Query parameters for listing class sessions
 */
export class M09ClassSessionsQueryDto {
  @IsUUID('4', { message: 'classroom_id must be a valid UUID' })
  @IsOptional()
  classroom_id?: string;

  @IsEnum(M09ClassSessionState, { message: 'Invalid session state' })
  @IsOptional()
  state?: M09ClassSessionState;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsBoolean()
  @IsOptional()
  hosted_by_me?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number;
}

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * Participant summary in session response
 */
export interface M09SessionParticipantDto {
  id: string;
  user_id: string;
  user_email?: string;
  user_first_name?: string | null;
  user_last_name?: string | null;
  role: string;
  joined_at: Date;
  left_at: Date | null;
  is_present: boolean;
  hand_raised: boolean;
}

/**
 * Class session response DTO
 */
export interface M09ClassSessionDto {
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
  host_email?: string;
  host_first_name?: string | null;
  host_last_name?: string | null;
  join_code: string | null;
  max_participants: number | null;
  participant_count?: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Class session with participants
 */
export interface M09ClassSessionWithParticipantsDto extends M09ClassSessionDto {
  participants: M09SessionParticipantDto[];
}

/**
 * Response DTO for create session operation
 */
export interface M09CreateClassSessionResponseDto {
  session: M09ClassSessionDto;
  message: string;
}

/**
 * Response DTO for update session operation
 */
export interface M09UpdateClassSessionResponseDto {
  session: M09ClassSessionDto;
  message: string;
}

/**
 * Response DTO for start session operation
 */
export interface M09StartSessionResponseDto {
  session: M09ClassSessionDto;
  join_code: string;
  message: string;
}

/**
 * Response DTO for state change operation
 */
export interface M09ChangeSessionStateResponseDto {
  session: M09ClassSessionDto;
  previous_state: string | null;
  new_state: string;
  message: string;
}

/**
 * Response DTO for join session operation
 */
export interface M09JoinSessionResponseDto {
  session: M09ClassSessionWithParticipantsDto;
  participant: M09SessionParticipantDto;
  message: string;
}

/**
 * Response DTO for sessions list
 */
export interface M09ClassSessionsResponseDto {
  sessions: M09ClassSessionDto[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Response DTO for session details
 */
export interface M09ClassSessionDetailsResponseDto {
  session: M09ClassSessionWithParticipantsDto;
}

/**
 * State log entry for session history
 */
export interface M09StateLogEntryDto {
  id: string;
  previous_state: string | null;
  new_state: string;
  changed_by: string | null;
  reason: string | null;
  created_at: Date;
}

/**
 * Response DTO for session state history
 */
export interface M09SessionStateHistoryResponseDto {
  session_id: string;
  state_logs: M09StateLogEntryDto[];
  total: number;
}

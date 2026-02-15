import {
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';

/**
 * Review progress status enum matching Prisma schema
 */
export enum M21ReviewProgressStatus {
  not_started = 'not_started',
  in_progress = 'in_progress',
  review_pending = 'review_pending',
  completed = 'completed',
  archived = 'archived',
}

/**
 * DTO for creating or updating review progress
 */
export class M21UpsertReviewProgressDto {
  @IsUUID('4', { message: 'Invalid observation recording ID' })
  @IsNotEmpty({ message: 'Observation recording ID is required' })
  observation_recording_id!: string;

  @IsEnum(M21ReviewProgressStatus, { message: 'Invalid review progress status' })
  @IsOptional()
  status?: M21ReviewProgressStatus;

  @IsInt({ message: 'Progress percentage must be an integer' })
  @Min(0, { message: 'Progress percentage must be at least 0' })
  @Max(100, { message: 'Progress percentage must not exceed 100' })
  @IsOptional()
  progress_percentage?: number;
}

/**
 * DTO for updating review progress
 */
export class M21UpdateReviewProgressDto {
  @IsEnum(M21ReviewProgressStatus, { message: 'Invalid review progress status' })
  @IsOptional()
  status?: M21ReviewProgressStatus;

  @IsInt({ message: 'Progress percentage must be an integer' })
  @Min(0, { message: 'Progress percentage must be at least 0' })
  @Max(100, { message: 'Progress percentage must not exceed 100' })
  @IsOptional()
  progress_percentage?: number;
}

/**
 * Response DTO for review progress
 */
export interface M21ReviewProgressDto {
  id: string;
  observation_recording_id: string;
  reviewer_id: string;
  status: M21ReviewProgressStatus;
  progress_percentage: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Response DTO for paginated review progress list
 */
export interface M21ReviewProgressListResponseDto {
  review_progress: M21ReviewProgressDto[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Response DTO for single review progress operations
 */
export interface M21ReviewProgressResponseDto {
  review_progress: M21ReviewProgressDto;
  message?: string;
}

/**
 * Query DTO for listing review progress
 */
export class M21ListReviewProgressQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'Invalid observation recording ID' })
  observation_recording_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid reviewer ID' })
  reviewer_id?: string;

  @IsOptional()
  @IsEnum(M21ReviewProgressStatus, { message: 'Invalid review progress status' })
  status?: M21ReviewProgressStatus;

  @IsOptional()
  offset?: number;

  @IsOptional()
  limit?: number;
}

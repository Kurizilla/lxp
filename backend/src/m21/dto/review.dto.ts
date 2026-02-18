import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { M21ReviewProgressStatus } from './review-progress.dto';

/**
 * Signed playback URL response for secure video streaming
 */
export interface M21SignedPlaybackUrlResponse {
  playback_url: string;
  file_key: string;
  expires_in_seconds: number;
  s3_bucket: string;
  s3_region: string;
  mime_type: string;
  recording_id: string;
}

/**
 * Response DTO for playback URL endpoint
 */
export interface M21PlaybackUrlResponseDto {
  playback: M21SignedPlaybackUrlResponse;
  message: string;
}

/**
 * Query DTO for requesting playback URL with options
 */
export class M21PlaybackUrlQueryDto {
  @IsOptional()
  @IsInt({ message: 'Expiry must be an integer' })
  @Min(60, { message: 'Expiry must be at least 60 seconds' })
  @Max(86400, { message: 'Expiry must not exceed 86400 seconds (24 hours)' })
  expires_in_seconds?: number;
}

/**
 * DTO for patching review progress
 */
export class M21PatchReviewProgressDto {
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
 * Response for review session info
 * Contains playback URL, annotations, and progress for a review session
 */
export interface M21ReviewSessionDto {
  recording_id: string;
  playback: M21SignedPlaybackUrlResponse;
  annotations_count: number;
  review_progress: {
    status: M21ReviewProgressStatus;
    progress_percentage: number;
  } | null;
}

/**
 * Response DTO for review session
 */
export interface M21ReviewSessionResponseDto {
  session: M21ReviewSessionDto;
  message?: string;
}

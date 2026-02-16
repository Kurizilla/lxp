import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsNumber,
} from 'class-validator';

/**
 * Transcription job status enum
 */
export enum M21TranscriptionJobStatus {
  pending = 'pending',
  processing = 'processing',
  completed = 'completed',
  failed = 'failed',
}

/**
 * DTO for requesting transcription of a recording
 */
export class M21RequestTranscriptionDto {
  @IsString()
  @IsOptional()
  language?: string; // Optional language hint for transcription

  @IsOptional()
  priority?: number; // Optional job priority
}

/**
 * Segment in a transcript (speaker + text + timestamps)
 */
export class M21TranscriptSegmentDto {
  @IsNumber()
  @Min(0)
  start_seconds!: number;

  @IsNumber()
  @Min(0)
  end_seconds!: number;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsString()
  @IsOptional()
  speaker?: string;

  @IsNumber()
  @IsOptional()
  confidence?: number;
}

/**
 * Response DTO for a transcript
 */
export interface M21TranscriptDto {
  id: string;
  observation_recording_id: string;
  full_text: string;
  segments: M21TranscriptSegmentDto[] | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Response DTO for transcript retrieval
 */
export interface M21TranscriptResponseDto {
  transcript: M21TranscriptDto;
  message?: string;
}

/**
 * Response DTO for transcription job status
 */
export interface M21TranscriptionJobResponseDto {
  job_id: string;
  recording_id: string;
  status: M21TranscriptionJobStatus;
  message: string;
  created_at?: Date;
}

/**
 * Data passed to the transcription job queue
 */
export interface M21TranscribeJobData {
  recording_id: string;
  user_id: string;
  language?: string;
  priority?: number;
}

/**
 * Result from the transcription job
 */
export interface M21TranscribeJobResult {
  success: boolean;
  recording_id: string;
  transcript_id?: string;
  error?: string;
}

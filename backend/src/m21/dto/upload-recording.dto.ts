import {
  IsString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
  IsEnum,
  IsObject,
  MaxLength,
} from 'class-validator';

/**
 * Recording status enum matching Prisma schema
 */
export enum M21RecordingStatus {
  uploading = 'uploading',
  processing = 'processing',
  ready = 'ready',
  transcribing = 'transcribing',
  analyzing = 'analyzing',
  completed = 'completed',
  failed = 'failed',
  archived = 'archived',
}

/**
 * DTO for uploading a new recording
 * Used with FileInterceptor for multipart/form-data
 */
export class M21UploadRecordingDto {
  @IsUUID('4', { message: 'Invalid storage bucket ID' })
  @IsNotEmpty({ message: 'Storage bucket ID is required' })
  storage_bucket_id!: string;

  @IsUUID('4', { message: 'Invalid class ID' })
  @IsNotEmpty({ message: 'Class ID is required' })
  class_id!: string;

  @IsUUID('4', { message: 'Invalid teacher ID' })
  @IsNotEmpty({ message: 'Teacher ID is required' })
  teacher_id!: string;

  @IsUUID('4', { message: 'Invalid observer ID' })
  @IsOptional()
  observer_id?: string;

  @IsDateString({}, { message: 'Session date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'Session date is required' })
  session_date!: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * DTO for updating a recording
 */
export class M21UpdateRecordingDto {
  @IsEnum(M21RecordingStatus, { message: 'Invalid recording status' })
  @IsOptional()
  status?: M21RecordingStatus;

  @IsInt({ message: 'Duration must be an integer' })
  @Min(0, { message: 'Duration must be positive' })
  @IsOptional()
  duration_seconds?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsUUID('4', { message: 'Invalid observer ID' })
  @IsOptional()
  observer_id?: string;
}

/**
 * DTO for completing upload (after S3 upload finishes)
 */
export class M21CompleteUploadDto {
  @IsString()
  @IsNotEmpty({ message: 'File key is required' })
  @MaxLength(500, { message: 'File key must not exceed 500 characters' })
  file_key!: string;

  @IsString()
  @IsNotEmpty({ message: 'MIME type is required' })
  @MaxLength(100, { message: 'MIME type must not exceed 100 characters' })
  mime_type!: string;

  @IsInt({ message: 'File size must be an integer' })
  @Min(1, { message: 'File size must be positive' })
  file_size_bytes!: number;

  @IsInt({ message: 'Duration must be an integer' })
  @Min(0, { message: 'Duration must be positive' })
  @IsOptional()
  duration_seconds?: number;
}

/**
 * Response DTO for a recording
 */
export interface M21RecordingDto {
  id: string;
  storage_bucket_id: string;
  class_id: string;
  teacher_id: string;
  observer_id: string | null;
  session_date: Date;
  file_key: string;
  mime_type: string;
  duration_seconds: number | null;
  file_size_bytes: string | null; // BigInt serialized as string
  status: M21RecordingStatus;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Response DTO for paginated recording list
 */
export interface M21RecordingsResponseDto {
  recordings: M21RecordingDto[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Response DTO for single recording operations
 */
export interface M21RecordingResponseDto {
  recording: M21RecordingDto;
  message?: string;
  presigned_upload_url?: string; // For initial upload
}

/**
 * Query DTO for listing recordings
 */
export class M21ListRecordingsQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'Invalid class ID' })
  class_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid teacher ID' })
  teacher_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid observer ID' })
  observer_id?: string;

  @IsOptional()
  @IsEnum(M21RecordingStatus, { message: 'Invalid recording status' })
  status?: M21RecordingStatus;

  @IsOptional()
  offset?: number;

  @IsOptional()
  limit?: number;
}

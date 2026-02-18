/**
 * Observation types matching backend M21 DTOs
 * Based on contracts from backend/src/m21/dto/
 */

// ============================================
// Recording Status
// ============================================

export type RecordingStatus =
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'transcribing'
  | 'analyzing'
  | 'completed'
  | 'failed'
  | 'archived';

// ============================================
// Storage Bucket types
// ============================================

export interface StorageBucket {
  id: string;
  name: string;
  s3_bucket: string;
  s3_region: string;
  is_active: boolean;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StorageBucketsResponse {
  buckets: StorageBucket[];
  total: number;
  offset: number;
  limit: number;
}

export interface StorageBucketResponse {
  bucket: StorageBucket;
  message?: string;
}

// ============================================
// Recording types
// ============================================

export interface Recording {
  id: string;
  storage_bucket_id: string;
  class_id: string;
  teacher_id: string;
  observer_id: string | null;
  session_date: string;
  file_key: string;
  mime_type: string;
  duration_seconds: number | null;
  file_size_bytes: string | null;
  status: RecordingStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface RecordingsResponse {
  recordings: Recording[];
  total: number;
  offset: number;
  limit: number;
}

export interface RecordingResponse {
  recording: Recording;
  message?: string;
  presigned_upload_url?: string;
}

// ============================================
// Upload Recording DTO
// ============================================

export interface UploadRecordingDto {
  storage_bucket_id: string;
  class_id: string;
  teacher_id: string;
  observer_id?: string;
  session_date: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// Complete Upload DTO
// ============================================

export interface CompleteUploadDto {
  file_key: string;
  mime_type: string;
  file_size_bytes: number;
  duration_seconds?: number;
}

// ============================================
// Presigned URL types
// ============================================

export interface PresignedUrlRequest {
  storage_bucket_id: string;
  class_id: string;
  filename: string;
  mime_type: string;
  file_size_bytes?: number;
}

export interface PresignedUrlResponse {
  upload_url: string;
  file_key: string;
  expires_in_seconds: number;
  s3_bucket: string;
  s3_region: string;
}

export interface PresignedUrlResponseDto {
  presigned_url: PresignedUrlResponse;
  message: string;
}

// ============================================
// Query types
// ============================================

export interface ListBucketsQuery {
  created_by_id?: string;
  is_active?: boolean;
  offset?: number;
  limit?: number;
}

export interface ListRecordingsQuery {
  class_id?: string;
  teacher_id?: string;
  observer_id?: string;
  status?: RecordingStatus;
  offset?: number;
  limit?: number;
}

import { api } from './api.service';
import type {
  StorageBucketsResponse,
  StorageBucketResponse,
  RecordingsResponse,
  RecordingResponse,
  UploadRecordingDto,
  CompleteUploadDto,
  PresignedUrlRequest,
  PresignedUrlResponseDto,
  ListBucketsQuery,
  ListRecordingsQuery,
} from '@/types';

/**
 * Build query string from params object
 */
function build_query_string<T extends object>(params?: T): string {
  if (!params) return '';

  const search_params = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search_params.append(key, String(value));
    }
  }

  const query = search_params.toString();
  return query ? `?${query}` : '';
}

/**
 * Observation service
 * Maps to backend /observations and /m21/recordings endpoints
 */
export const observation_service = {
  // ============================================
  // Storage Buckets
  // ============================================

  /**
   * GET /observations/buckets
   * List all storage buckets with pagination
   */
  list_buckets: (params?: ListBucketsQuery): Promise<StorageBucketsResponse> =>
    api.get<StorageBucketsResponse>(`/observations/buckets${build_query_string(params)}`),

  /**
   * GET /observations/buckets/:id
   * Get a single storage bucket by ID
   */
  get_bucket: (id: string): Promise<StorageBucketResponse> =>
    api.get<StorageBucketResponse>(`/observations/buckets/${id}`),

  // ============================================
  // Recordings
  // ============================================

  /**
   * GET /m21/recordings
   * List all recordings with pagination and filters
   */
  list_recordings: (params?: ListRecordingsQuery): Promise<RecordingsResponse> =>
    api.get<RecordingsResponse>(`/m21/recordings${build_query_string(params)}`),

  /**
   * GET /m21/recordings/:id
   * Get a single recording by ID
   */
  get_recording: (id: string): Promise<RecordingResponse> =>
    api.get<RecordingResponse>(`/m21/recordings/${id}`),

  /**
   * POST /m21/recordings
   * Create a new recording (initiate upload)
   * Returns presigned URL for S3 upload
   */
  create_recording: (dto: UploadRecordingDto): Promise<RecordingResponse> =>
    api.post<RecordingResponse>('/m21/recordings', dto),

  /**
   * POST /m21/recordings/presigned-url
   * Generate a presigned URL for uploading to S3
   */
  generate_presigned_url: (dto: PresignedUrlRequest): Promise<PresignedUrlResponseDto> =>
    api.post<PresignedUrlResponseDto>('/m21/recordings/presigned-url', dto),

  /**
   * POST /m21/recordings/:id/complete
   * Complete the upload by updating file metadata
   */
  complete_upload: (id: string, dto: CompleteUploadDto): Promise<RecordingResponse> =>
    api.post<RecordingResponse>(`/m21/recordings/${id}/complete`, dto),

  /**
   * Upload file directly to S3 using presigned URL
   * This bypasses the API and uploads directly to S3
   */
  upload_to_s3: async (presigned_url: string, file: File): Promise<void> => {
    const response = await fetch(presigned_url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed with status ${response.status}`);
    }
  },
};

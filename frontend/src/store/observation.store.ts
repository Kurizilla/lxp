import { create } from 'zustand';
import { observation_service, ApiException } from '@/services';
import type {
  StorageBucket,
  Recording,
  UploadRecordingDto,
  PresignedUrlResponse,
} from '@/types';

// ============================================
// State interface
// ============================================

interface ObservationState {
  // Buckets
  buckets: StorageBucket[];
  selected_bucket_id: string | null;
  buckets_loading: boolean;
  buckets_error: string | null;

  // Upload state
  upload_progress: number;
  upload_loading: boolean;
  upload_error: string | null;
  last_recording: Recording | null;

  // Actions
  fetch_buckets: () => Promise<void>;
  select_bucket: (bucket_id: string | null) => void;
  upload_recording: (
    file: File,
    metadata: Omit<UploadRecordingDto, 'storage_bucket_id'>
  ) => Promise<Recording | null>;
  clear_upload_state: () => void;
  clear_errors: () => void;
}

// ============================================
// Store
// ============================================

export const use_observation_store = create<ObservationState>((set, get) => ({
  // Initial state
  buckets: [],
  selected_bucket_id: null,
  buckets_loading: false,
  buckets_error: null,

  upload_progress: 0,
  upload_loading: false,
  upload_error: null,
  last_recording: null,

  // Actions
  fetch_buckets: async () => {
    set({ buckets_loading: true, buckets_error: null });

    try {
      const response = await observation_service.list_buckets({ is_active: true });
      set({
        buckets: response.buckets,
        buckets_loading: false,
      });

      // Auto-select if only one bucket
      if (response.buckets.length === 1) {
        set({ selected_bucket_id: response.buckets[0].id });
      }
    } catch (err) {
      const error_message =
        err instanceof ApiException ? err.message : 'Failed to load storage buckets';
      set({ buckets_error: error_message, buckets_loading: false });
    }
  },

  select_bucket: (bucket_id) => {
    set({ selected_bucket_id: bucket_id });
  },

  upload_recording: async (file, metadata) => {
    const { selected_bucket_id } = get();

    if (!selected_bucket_id) {
      set({ upload_error: 'Please select a storage bucket first' });
      return null;
    }

    set({
      upload_loading: true,
      upload_error: null,
      upload_progress: 0,
    });

    try {
      // Step 1: Get presigned URL
      set({ upload_progress: 10 });
      const presigned_response = await observation_service.generate_presigned_url({
        storage_bucket_id: selected_bucket_id,
        class_id: metadata.class_id,
        filename: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
      });

      const presigned: PresignedUrlResponse = presigned_response.presigned_url;

      // Step 2: Upload file to S3
      set({ upload_progress: 30 });
      await observation_service.upload_to_s3(presigned.upload_url, file);

      // Step 3: Create recording metadata
      set({ upload_progress: 70 });
      const recording_response = await observation_service.create_recording({
        storage_bucket_id: selected_bucket_id,
        ...metadata,
      });

      // Step 4: Complete the upload
      set({ upload_progress: 90 });
      const complete_response = await observation_service.complete_upload(
        recording_response.recording.id,
        {
          file_key: presigned.file_key,
          mime_type: file.type,
          file_size_bytes: file.size,
        }
      );

      set({
        upload_progress: 100,
        upload_loading: false,
        last_recording: complete_response.recording,
      });

      return complete_response.recording;
    } catch (err) {
      const error_message =
        err instanceof ApiException ? err.message : 'Failed to upload recording';
      set({
        upload_error: error_message,
        upload_loading: false,
        upload_progress: 0,
      });
      return null;
    }
  },

  clear_upload_state: () => {
    set({
      upload_progress: 0,
      upload_loading: false,
      upload_error: null,
      last_recording: null,
    });
  },

  clear_errors: () => {
    set({
      buckets_error: null,
      upload_error: null,
    });
  },
}));

// Selector hooks
export const use_observation_buckets = () =>
  use_observation_store((state) => state.buckets);
export const use_selected_bucket_id = () =>
  use_observation_store((state) => state.selected_bucket_id);
export const use_buckets_loading = () =>
  use_observation_store((state) => state.buckets_loading);
export const use_upload_progress = () =>
  use_observation_store((state) => state.upload_progress);
export const use_upload_loading = () =>
  use_observation_store((state) => state.upload_loading);

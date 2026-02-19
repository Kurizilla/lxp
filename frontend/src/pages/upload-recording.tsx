import { useState, useEffect, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  Alert,
  Input,
  Select,
} from '@/components/ui';
import { use_observation_store } from '@/store/observation.store';
import { teacher_service, ApiException } from '@/services';
import { use_auth_store } from '@/store';
import type { TeacherClassroom } from '@/types';

/**
 * Format file size for display
 */
function format_file_size(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function get_today_date(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Accepted file types for recording uploads
 */
const ACCEPTED_FILE_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
];

const ACCEPTED_EXTENSIONS = '.mp4,.webm,.ogg,.mp3,.wav';

/**
 * Upload Recording Page
 * Drag-drop upload with metadata form (class, teacher, session date)
 */
export function UploadRecordingPage() {
  const file_input_ref = useRef<HTMLInputElement>(null);

  // Auth store for teacher_id
  const { user } = use_auth_store();

  // Observation store
  const {
    buckets,
    selected_bucket_id,
    upload_progress,
    upload_loading,
    upload_error,
    last_recording,
    fetch_buckets,
    upload_recording,
    clear_upload_state,
    clear_errors,
  } = use_observation_store();

  // Local state
  const [file, set_file] = useState<File | null>(null);
  const [is_dragging, set_is_dragging] = useState(false);
  const [classrooms, set_classrooms] = useState<TeacherClassroom[]>([]);
  const [classrooms_loading, set_classrooms_loading] = useState(false);
  const [classrooms_error, set_classrooms_error] = useState<string | null>(null);

  // Form state
  const [class_id, set_class_id] = useState('');
  const [session_date, set_session_date] = useState(get_today_date());
  const [form_errors, set_form_errors] = useState<Record<string, string>>({});
  const [success, set_success] = useState<string | null>(null);

  /**
   * Fetch buckets on mount if not already loaded
   */
  useEffect(() => {
    if (buckets.length === 0) {
      fetch_buckets();
    }
  }, [buckets.length, fetch_buckets]);

  /**
   * Fetch classrooms for selection
   */
  const fetch_classrooms = useCallback(async () => {
    set_classrooms_loading(true);
    set_classrooms_error(null);

    try {
      const response = await teacher_service.get_classrooms();
      set_classrooms(response.classrooms);

      // Auto-select if only one classroom
      if (response.classrooms.length === 1) {
        set_class_id(response.classrooms[0].id);
      }
    } catch (err) {
      if (err instanceof ApiException) {
        set_classrooms_error(err.message);
      } else {
        set_classrooms_error('Failed to load classrooms');
      }
    } finally {
      set_classrooms_loading(false);
    }
  }, []);

  useEffect(() => {
    fetch_classrooms();
  }, [fetch_classrooms]);

  /**
   * Clear state on unmount
   */
  useEffect(() => {
    return () => {
      clear_upload_state();
    };
  }, [clear_upload_state]);

  /**
   * Validate file type
   */
  const validate_file = (file: File): string | null => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a video (MP4, WebM) or audio (MP3, WAV) file.';
    }

    // 500MB limit
    const max_size = 500 * 1024 * 1024;
    if (file.size > max_size) {
      return 'File size exceeds 500MB limit.';
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handle_file_select = (selected_file: File) => {
    const error = validate_file(selected_file);
    if (error) {
      set_form_errors((prev) => ({ ...prev, file: error }));
      return;
    }

    set_file(selected_file);
    set_form_errors((prev) => {
      const new_errors = { ...prev };
      delete new_errors.file;
      return new_errors;
    });
  };

  /**
   * Handle drag events
   */
  const handle_drag_enter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    set_is_dragging(true);
  };

  const handle_drag_leave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    set_is_dragging(false);
  };

  const handle_drag_over = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handle_drop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    set_is_dragging(false);

    const dropped_files = e.dataTransfer.files;
    if (dropped_files.length > 0) {
      handle_file_select(dropped_files[0]);
    }
  };

  /**
   * Handle file input change
   */
  const handle_input_change = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handle_file_select(files[0]);
    }
  };

  /**
   * Trigger file input click
   */
  const handle_browse_click = () => {
    file_input_ref.current?.click();
  };

  /**
   * Remove selected file
   */
  const handle_remove_file = () => {
    set_file(null);
    if (file_input_ref.current) {
      file_input_ref.current.value = '';
    }
  };

  /**
   * Validate form
   */
  const validate_form = (): boolean => {
    const errors: Record<string, string> = {};

    if (!file) {
      errors.file = 'Please select a file to upload';
    }

    if (!class_id) {
      errors.class_id = 'Please select a classroom';
    }

    if (!session_date) {
      errors.session_date = 'Please enter a session date';
    }

    if (!selected_bucket_id) {
      errors.bucket = 'Please configure a storage bucket first';
    }

    set_form_errors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handle_submit = async () => {
    if (!validate_form() || !file || !user) return;

    const recording = await upload_recording(file, {
      class_id,
      teacher_id: user.id,
      session_date: new Date(session_date).toISOString(),
    });

    if (recording) {
      set_success('Recording uploaded successfully!');
      set_file(null);
      set_class_id('');
      set_session_date(get_today_date());
    }
  };

  // Selected bucket
  const selected_bucket = buckets.find((b) => b.id === selected_bucket_id);

  // Classroom options
  const classroom_options = classrooms.map((cls) => ({
    value: cls.id,
    label: `${cls.name}${cls.section ? ` - ${cls.section}` : ''} (${cls.subject.name})`,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader
            title="Upload Recording"
            subtitle="Upload an observation recording with metadata"
          />

          {/* Configuration check */}
          {!selected_bucket_id && (
            <Alert
              type="warning"
              message="Please configure a storage bucket before uploading"
              className="mb-4"
            />
          )}

          {/* Error alerts */}
          {upload_error && (
            <Alert
              type="error"
              message={upload_error}
              on_close={clear_errors}
              className="mb-4"
            />
          )}

          {classrooms_error && (
            <Alert
              type="error"
              message={classrooms_error}
              on_close={() => set_classrooms_error(null)}
              className="mb-4"
            />
          )}

          {form_errors.bucket && (
            <Alert type="error" message={form_errors.bucket} className="mb-4" />
          )}

          {/* Success alert */}
          {success && (
            <Alert
              type="success"
              message={success}
              on_close={() => set_success(null)}
              className="mb-4"
            />
          )}

          {/* Selected bucket display */}
          {selected_bucket && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-blue-600 font-medium">Storage Bucket:</span>
                  <span className="ml-2 text-sm text-blue-800">{selected_bucket.name}</span>
                </div>
                <Link
                  to="/observations-config"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Change
                </Link>
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div className="mb-6">
            <label className="label">Recording File</label>
            <div
              onDragEnter={handle_drag_enter}
              onDragLeave={handle_drag_leave}
              onDragOver={handle_drag_over}
              onDrop={handle_drop}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                is_dragging
                  ? 'border-primary-500 bg-primary-50'
                  : form_errors.file
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {file ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <svg
                      className="h-12 w-12 text-primary-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {format_file_size(file.size)} - {file.type}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handle_remove_file}
                    disabled={upload_loading}
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Drag and drop your recording here, or{' '}
                      <button
                        type="button"
                        onClick={handle_browse_click}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      MP4, WebM, MP3, WAV up to 500MB
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={file_input_ref}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handle_input_change}
                className="hidden"
              />
            </div>
            {form_errors.file && (
              <p className="error-message mt-1">{form_errors.file}</p>
            )}
          </div>

          {/* Metadata form */}
          <div className="space-y-4">
            {/* Classroom select */}
            {classrooms_loading ? (
              <div className="flex items-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading classrooms...</span>
              </div>
            ) : (
              <Select
                label="Classroom"
                options={classroom_options}
                value={class_id}
                onChange={(e) => set_class_id(e.target.value)}
                placeholder="Select a classroom..."
                error={form_errors.class_id}
              />
            )}

            {/* Session date */}
            <Input
              label="Session Date"
              type="date"
              value={session_date}
              onChange={(e) => set_session_date(e.target.value)}
              error={form_errors.session_date}
              max={get_today_date()}
            />
          </div>

          {/* Upload progress */}
          {upload_loading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm text-gray-500">{upload_progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${upload_progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Last recording info */}
          {last_recording && !upload_loading && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Recording Uploaded</h4>
              <p className="text-sm text-green-700">
                Recording ID: <span className="font-mono">{last_recording.id}</span>
              </p>
              <p className="text-sm text-green-700">
                Status: <span className="capitalize">{last_recording.status}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-gray-200">
            <Link to="/observations-config">
              <Button variant="secondary">Configure Storage</Button>
            </Link>
            <Button
              onClick={handle_submit}
              disabled={!file || !class_id || !session_date || !selected_bucket_id || upload_loading}
              is_loading={upload_loading}
            >
              Upload Recording
            </Button>
          </div>
        </Card>

        {/* Help text */}
        <Card>
          <CardHeader
            title="Upload Guidelines"
            subtitle="Best practices for observation recordings"
          />
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <span className="font-medium">Supported formats:</span> MP4, WebM (video),
              MP3, WAV (audio)
            </p>
            <p>
              <span className="font-medium">Maximum file size:</span> 500MB
            </p>
            <p>
              <span className="font-medium">Recording quality:</span> We recommend 720p or
              higher for video recordings to ensure clear visibility.
            </p>
            <p>
              <span className="font-medium">Session date:</span> Enter the date when the
              class session was recorded, not the upload date.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

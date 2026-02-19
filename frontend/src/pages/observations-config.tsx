import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardHeader,
  Alert,
  Select,
  Badge,
} from '@/components/ui';
import { use_observation_store } from '@/store/observation.store';
import type { StorageBucket } from '@/types';

/**
 * Format date for display
 */
function format_date(date_string: string): string {
  const date = new Date(date_string);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Observations Config Page
 * Allows user to select a storage bucket for recording uploads
 */
export function ObservationsConfigPage() {
  const navigate = useNavigate();

  // Store state
  const {
    buckets,
    selected_bucket_id,
    buckets_loading,
    buckets_error,
    fetch_buckets,
    select_bucket,
    clear_errors,
  } = use_observation_store();

  // Local state for selected bucket details
  const [selected_bucket, set_selected_bucket] = useState<StorageBucket | null>(null);
  const [success, set_success] = useState<string | null>(null);

  /**
   * Load buckets on mount
   */
  useEffect(() => {
    fetch_buckets();
  }, [fetch_buckets]);

  /**
   * Update selected bucket details when selection changes
   */
  useEffect(() => {
    if (selected_bucket_id) {
      const bucket = buckets.find((b) => b.id === selected_bucket_id) || null;
      set_selected_bucket(bucket);
    } else {
      set_selected_bucket(null);
    }
  }, [selected_bucket_id, buckets]);

  /**
   * Handle bucket selection
   */
  const handle_bucket_change = useCallback(
    (bucket_id: string) => {
      select_bucket(bucket_id || null);
    },
    [select_bucket]
  );

  /**
   * Handle save configuration
   */
  const handle_save = useCallback(() => {
    if (selected_bucket_id) {
      set_success('Storage bucket configuration saved successfully');
      setTimeout(() => {
        navigate('/upload-recording');
      }, 1000);
    }
  }, [selected_bucket_id, navigate]);

  /**
   * Handle continue to upload
   */
  const handle_continue = useCallback(() => {
    if (selected_bucket_id) {
      navigate('/upload-recording');
    }
  }, [selected_bucket_id, navigate]);

  // Build select options
  const bucket_options = buckets.map((bucket) => ({
    value: bucket.id,
    label: `${bucket.name} (${bucket.s3_region})`,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader
            title="Observations Configuration"
            subtitle="Configure storage settings for observation recordings"
          />

          {/* Error alert */}
          {buckets_error && (
            <Alert
              type="error"
              message={buckets_error}
              on_close={clear_errors}
              className="mb-4"
            />
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

          {/* Loading state */}
          {buckets_loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading storage buckets...</span>
            </div>
          ) : buckets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No storage buckets available.</p>
              <p className="text-sm text-gray-400 mt-2">
                Contact your administrator to configure storage buckets.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bucket selector */}
              <Select
                label="Storage Bucket"
                options={bucket_options}
                value={selected_bucket_id || ''}
                onChange={(e) => handle_bucket_change(e.target.value)}
                placeholder="Select a storage bucket..."
                helper_text="Select the S3 bucket where recordings will be stored"
              />

              {/* Selected bucket details */}
              {selected_bucket && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {selected_bucket.name}
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">S3 Bucket</dt>
                      <dd className="font-medium font-mono text-sm">
                        {selected_bucket.s3_bucket}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Region</dt>
                      <dd className="font-medium">{selected_bucket.s3_region}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Status</dt>
                      <dd>
                        <Badge variant={selected_bucket.is_active ? 'success' : 'danger'}>
                          {selected_bucket.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Created</dt>
                      <dd className="font-medium">{format_date(selected_bucket.created_at)}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={() => navigate(-1)}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handle_save}
                    disabled={!selected_bucket_id}
                  >
                    Save Configuration
                  </Button>
                  <Button
                    onClick={handle_continue}
                    disabled={!selected_bucket_id}
                  >
                    Continue to Upload
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Bucket list */}
        {!buckets_loading && buckets.length > 0 && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">
              Available Storage Buckets ({buckets.length})
            </h3>
            <div className="space-y-3">
              {buckets.map((bucket) => (
                <button
                  key={bucket.id}
                  onClick={() => handle_bucket_change(bucket.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selected_bucket_id === bucket.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{bucket.name}</h4>
                      <p className="text-sm text-gray-500 font-mono">
                        {bucket.s3_bucket} ({bucket.s3_region})
                      </p>
                    </div>
                    <Badge variant={bucket.is_active ? 'success' : 'danger'}>
                      {bucket.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Help text */}
        <Card className="mt-6">
          <CardHeader
            title="About Storage Buckets"
            subtitle="Understanding observation storage"
          />
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Storage buckets are AWS S3 buckets configured to store observation recordings.
              Each bucket is associated with a specific region and access credentials.
            </p>
            <p>
              <span className="font-medium">Active buckets</span> are available for
              uploading new recordings. Inactive buckets may contain existing recordings
              but cannot accept new uploads.
            </p>
            <p>
              If you need access to additional storage buckets, contact your system
              administrator.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

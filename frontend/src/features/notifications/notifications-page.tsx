import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  Alert,
  Select,
  Badge,
} from '@/components/ui';
import { notification_service, ApiException } from '@/services';
import type {
  Notification,
  NotificationPriority,
  NotificationType,
} from '@/types';

const ITEMS_PER_PAGE = 20;
const POLLING_INTERVAL = 30000; // 30 seconds for real-time updates

/**
 * Get priority badge variant based on priority level
 */
function get_priority_variant(priority: string): 'success' | 'danger' | 'warning' | 'info' | 'default' {
  switch (priority) {
    case 'urgent':
      return 'danger';
    case 'high':
      return 'warning';
    case 'normal':
      return 'info';
    case 'low':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Get type badge variant
 */
function get_type_variant(type: string): 'success' | 'danger' | 'warning' | 'info' | 'default' {
  switch (type) {
    case 'alert':
      return 'danger';
    case 'reminder':
      return 'warning';
    case 'announcement':
      return 'info';
    case 'message':
      return 'success';
    case 'system':
    default:
      return 'default';
  }
}

/**
 * Format relative time
 */
function format_relative_time(date_string: string): string {
  const date = new Date(date_string);
  const now = new Date();
  const diff_ms = now.getTime() - date.getTime();
  const diff_minutes = Math.floor(diff_ms / (1000 * 60));
  const diff_hours = Math.floor(diff_ms / (1000 * 60 * 60));
  const diff_days = Math.floor(diff_ms / (1000 * 60 * 60 * 24));

  if (diff_minutes < 1) return 'Just now';
  if (diff_minutes < 60) return `${diff_minutes}m ago`;
  if (diff_hours < 24) return `${diff_hours}h ago`;
  if (diff_days < 7) return `${diff_days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Priority options for filter
 */
const priority_options = [
  { value: '', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

/**
 * Type options for filter
 */
const type_options = [
  { value: '', label: 'All Types' },
  { value: 'system', label: 'System' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'alert', label: 'Alert' },
  { value: 'message', label: 'Message' },
];

/**
 * Notifications Page
 * Displays list of notifications with badges, filters, and real-time polling
 */
export function NotificationsPage() {
  // Data state
  const [notifications, set_notifications] = useState<Notification[]>([]);
  const [total, set_total] = useState(0);
  const [unread_count, set_unread_count] = useState(0);
  const [offset, set_offset] = useState(0);

  // Filter state
  const [unread_only, set_unread_only] = useState(false);
  const [priority_filter, set_priority_filter] = useState<string>('');
  const [type_filter, set_type_filter] = useState<string>('');

  // Loading state
  const [is_loading, set_is_loading] = useState(true);
  const [is_marking_read, set_is_marking_read] = useState<string | null>(null);
  const [error, set_error] = useState<string | null>(null);
  const [success, set_success] = useState<string | null>(null);

  // Polling ref
  const polling_ref = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch notifications
   */
  const fetch_notifications = useCallback(async (show_loading = true) => {
    if (show_loading) set_is_loading(true);
    set_error(null);

    try {
      const response = await notification_service.list({
        unread_only: unread_only || undefined,
        priority: priority_filter as NotificationPriority || undefined,
        type: type_filter as NotificationType || undefined,
        limit: ITEMS_PER_PAGE,
        offset,
      });
      set_notifications(response.notifications);
      set_total(response.total);
      set_unread_count(response.unread_count);
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to load notifications');
      }
    } finally {
      if (show_loading) set_is_loading(false);
    }
  }, [unread_only, priority_filter, type_filter, offset]);

  /**
   * Handle mark as read
   */
  const handle_mark_read = async (notification_id: string) => {
    set_is_marking_read(notification_id);

    try {
      await notification_service.mark_read(notification_id);
      set_success('Notification marked as read');

      // Update local state
      set_notifications((prev) =>
        prev.map((n) =>
          n.id === notification_id
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      set_unread_count((prev) => Math.max(0, prev - 1));
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to mark notification as read');
      }
    } finally {
      set_is_marking_read(null);
    }
  };

  /**
   * Handle filter reset
   */
  const handle_reset_filters = () => {
    set_unread_only(false);
    set_priority_filter('');
    set_type_filter('');
    set_offset(0);
  };

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetch_notifications();
  }, [fetch_notifications]);

  // Set up polling for real-time updates
  useEffect(() => {
    // Start polling
    polling_ref.current = setInterval(() => {
      fetch_notifications(false); // Silent refresh
    }, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (polling_ref.current) {
        clearInterval(polling_ref.current);
      }
    };
  }, [fetch_notifications]);

  // Clear success message after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => set_success(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Calculate pagination
  const total_pages = Math.ceil(total / ITEMS_PER_PAGE);
  const current_page = Math.floor(offset / ITEMS_PER_PAGE) + 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {unread_count > 0 ? (
                <>
                  You have{' '}
                  <span className="font-semibold text-primary-600">
                    {unread_count} unread
                  </span>{' '}
                  notification{unread_count !== 1 ? 's' : ''}
                </>
              ) : (
                'All caught up!'
              )}
            </p>
          </div>
          <Link to="/notifications/preferences">
            <Button variant="secondary">
              Preferences
            </Button>
          </Link>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            type="error"
            message={error}
            on_close={() => set_error(null)}
            className="mb-4"
          />
        )}
        {success && (
          <Alert
            type="success"
            message={success}
            on_close={() => set_success(null)}
            className="mb-4"
          />
        )}

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-4 flex flex-wrap gap-4 items-end">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="unread_only"
                checked={unread_only}
                onChange={(e) => {
                  set_unread_only(e.target.checked);
                  set_offset(0);
                }}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="unread_only" className="text-sm text-gray-700">
                Unread only
              </label>
            </div>
            <div className="w-40">
              <Select
                label="Priority"
                options={priority_options}
                value={priority_filter}
                onChange={(e) => {
                  set_priority_filter(e.target.value);
                  set_offset(0);
                }}
              />
            </div>
            <div className="w-40">
              <Select
                label="Type"
                options={type_options}
                value={type_filter}
                onChange={(e) => {
                  set_type_filter(e.target.value);
                  set_offset(0);
                }}
              />
            </div>
            <Button variant="secondary" onClick={handle_reset_filters}>
              Reset
            </Button>
          </div>
        </Card>

        {/* Notifications list */}
        <Card>
          {is_loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No notifications found.</p>
              <p className="text-sm text-gray-400 mt-2">
                {unread_only || priority_filter || type_filter
                  ? 'Try adjusting your filters.'
                  : 'Check back later for new notifications.'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors ${
                      notification.read_at
                        ? 'bg-white'
                        : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {/* Unread indicator */}
                          {!notification.read_at && (
                            <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></span>
                          )}
                          {/* Title */}
                          <h3
                            className={`font-medium truncate ${
                              notification.read_at ? 'text-gray-700' : 'text-gray-900'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {/* Badges */}
                          <Badge variant={get_priority_variant(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <Badge variant={get_type_variant(notification.type)}>
                            {notification.type}
                          </Badge>
                        </div>
                        {/* Message */}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{format_relative_time(notification.created_at)}</span>
                          {notification.sender && (
                            <span>
                              From:{' '}
                              {notification.sender.first_name
                                ? `${notification.sender.first_name} ${notification.sender.last_name || ''}`
                                : notification.sender.email}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      {!notification.read_at && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handle_mark_read(notification.id)}
                          is_loading={is_marking_read === notification.id}
                          disabled={is_marking_read !== null}
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {total_pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Page {current_page} of {total_pages} ({total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => set_offset(Math.max(0, offset - ITEMS_PER_PAGE))}
                      disabled={offset === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => set_offset(offset + ITEMS_PER_PAGE)}
                      disabled={current_page >= total_pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Polling indicator */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Auto-refreshing every 30 seconds
        </p>
      </div>
    </div>
  );
}

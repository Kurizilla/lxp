import { api } from './api.service';
import type {
  NotificationsResponse,
  NotificationsQuery,
  MarkReadResponse,
  PreferencesResponse,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
} from '@/types';

/**
 * Build query string from notifications query params
 */
function build_notifications_query(params?: NotificationsQuery): string {
  if (!params) {
    return '';
  }

  const query_params: string[] = [];

  if (params.unread_only !== undefined) {
    query_params.push(`unread_only=${params.unread_only}`);
  }
  if (params.priority) {
    query_params.push(`priority=${encodeURIComponent(params.priority)}`);
  }
  if (params.type) {
    query_params.push(`type=${encodeURIComponent(params.type)}`);
  }
  if (params.limit !== undefined) {
    query_params.push(`limit=${params.limit}`);
  }
  if (params.offset !== undefined) {
    query_params.push(`offset=${params.offset}`);
  }

  return query_params.length > 0 ? `?${query_params.join('&')}` : '';
}

/**
 * Notification service
 * Maps to backend /notifications endpoints
 */
export const notification_service = {
  /**
   * GET /notifications
   * Get notifications for authenticated user with filters and pagination
   */
  list: (params?: NotificationsQuery): Promise<NotificationsResponse> =>
    api.get<NotificationsResponse>(`/notifications${build_notifications_query(params)}`),

  /**
   * PATCH /notifications/:id/read
   * Mark a notification as read
   */
  mark_read: (notification_id: string): Promise<MarkReadResponse> =>
    api.patch<MarkReadResponse>(`/notifications/${notification_id}/read`),

  /**
   * GET /notifications/preferences
   * Get notification preferences for the authenticated user
   */
  get_preferences: (): Promise<PreferencesResponse> =>
    api.get<PreferencesResponse>('/notifications/preferences'),

  /**
   * PATCH /notifications/preferences
   * Update notification preferences
   */
  update_preferences: (data: UpdatePreferencesRequest): Promise<UpdatePreferencesResponse> =>
    api.patch<UpdatePreferencesResponse>('/notifications/preferences', data),
};

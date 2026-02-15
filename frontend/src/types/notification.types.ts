/**
 * Notification types matching backend M01 DTOs
 * Based on contracts from backend/src/m01/dto/create-notification.dto.ts
 */

// ============================================
// Notification enums
// ============================================

export enum NotificationType {
  SYSTEM = 'system',
  ANNOUNCEMENT = 'announcement',
  REMINDER = 'reminder',
  ALERT = 'alert',
  MESSAGE = 'message',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// ============================================
// Notification types
// ============================================

export interface NotificationSender {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  created_at: string;
  sender: NotificationSender | null;
  read_at: string | null;
  dismissed_at: string | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  limit: number;
  offset: number;
}

export interface NotificationsQuery {
  unread_only?: boolean;
  priority?: NotificationPriority;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

export interface MarkReadResponse {
  message: string;
  notification_id: string;
  read_at: string;
}

// ============================================
// Notification Preferences types
// Based on contracts from backend/src/m01/dto/update-preferences.dto.ts
// ============================================

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

export interface NotificationPreference {
  id: string;
  type: string;
  channel: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreferencesResponse {
  preferences: NotificationPreference[];
  total: number;
}

export interface PreferenceItem {
  type: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface UpdatePreferencesRequest {
  preferences: PreferenceItem[];
}

export interface UpdatePreferencesResponse {
  preferences: NotificationPreference[];
  message: string;
}

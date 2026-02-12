/**
 * Types for M01 Notifications, Announcements, and Preferences
 * Based on Prisma schema models
 */

export enum NotificationType {
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: Priority;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  creatorId: string;
  title: string;
  content: string;
  type: NotificationType;
  priority: Priority;
  isActive: boolean;
  publishedAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination response per foundation API patterns
 */
export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  data: T[];
}

/**
 * Error response per foundation API patterns
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Assistant chat types
 */
export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AssistantQueryRequest {
  query: string;
  context?: Record<string, unknown>;
}

export interface AssistantQueryResponse {
  id: string;
  response: string;
  timestamp: string;
}

import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  IsObject,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Notification type enum matching Prisma schema
 */
export enum M01NotificationType {
  SYSTEM = 'system',
  ANNOUNCEMENT = 'announcement',
  REMINDER = 'reminder',
  ALERT = 'alert',
  MESSAGE = 'message',
}

/**
 * Notification priority enum matching Prisma schema
 */
export enum M01NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * DTO for creating a new notification
 */
export class M01CreateNotificationDto {
  @IsString()
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title!: string;

  @IsString()
  @MinLength(1, { message: 'Message cannot be empty' })
  @MaxLength(2000, { message: 'Message must not exceed 2000 characters' })
  message!: string;

  @IsEnum(M01NotificationType, { message: 'Invalid notification type' })
  @IsOptional()
  type?: M01NotificationType;

  @IsEnum(M01NotificationPriority, { message: 'Invalid notification priority' })
  @IsOptional()
  priority?: M01NotificationPriority;

  @IsArray()
  @IsUUID('4', { each: true, message: 'Each recipient_id must be a valid UUID' })
  recipient_ids!: string[];

  @IsUUID('4', { message: 'classroom_id must be a valid UUID' })
  @IsOptional()
  classroom_id?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;
}

/**
 * Query parameters for listing notifications
 */
export class M01NotificationsQueryDto {
  @IsOptional()
  unread_only?: string; // 'true' or 'false' - query param comes as string

  @IsEnum(M01NotificationPriority, { message: 'Invalid priority filter' })
  @IsOptional()
  priority?: M01NotificationPriority;

  @IsEnum(M01NotificationType, { message: 'Invalid type filter' })
  @IsOptional()
  type?: M01NotificationType;

  @IsOptional()
  limit?: string; // query param comes as string

  @IsOptional()
  offset?: string; // query param comes as string
}

/**
 * Sender summary DTO
 */
export interface M01NotificationSenderDto {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

/**
 * Single notification DTO for response
 */
export interface M01NotificationDto {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  created_at: Date;
  sender: M01NotificationSenderDto | null;
  read_at: Date | null;
  dismissed_at: Date | null;
}

/**
 * Response DTO for paginated notifications list
 */
export interface M01NotificationsResponseDto {
  notifications: M01NotificationDto[];
  total: number;
  unread_count: number;
  limit: number;
  offset: number;
}

/**
 * Response DTO for create notification
 */
export interface M01CreateNotificationResponseDto {
  notification: {
    id: string;
    type: string;
    priority: string;
    title: string;
    message: string;
    data: Record<string, unknown> | null;
    created_at: Date;
    recipient_count: number;
  };
  message: string;
}

/**
 * Response DTO for marking notification as read
 */
export interface M01MarkReadResponseDto {
  message: string;
  notification_id: string;
  read_at: Date;
}

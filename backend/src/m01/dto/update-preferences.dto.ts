import {
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Notification channel enum matching Prisma schema
 */
export enum M01NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

/**
 * Re-export notification type from create-notification.dto for convenience
 */
export { M01NotificationType } from './create-notification.dto';

import { M01NotificationType } from './create-notification.dto';

/**
 * Single preference item for update
 */
export class M01PreferenceItemDto {
  @IsEnum(M01NotificationType, { message: 'Invalid notification type' })
  type!: M01NotificationType;

  @IsEnum(M01NotificationChannel, { message: 'Invalid notification channel' })
  channel!: M01NotificationChannel;

  @IsBoolean({ message: 'enabled must be a boolean' })
  enabled!: boolean;
}

/**
 * DTO for updating notification preferences
 */
export class M01UpdatePreferencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => M01PreferenceItemDto)
  preferences!: M01PreferenceItemDto[];
}

/**
 * Single preference DTO for response
 */
export interface M01PreferenceDto {
  id: string;
  type: string;
  channel: string;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Response DTO for preferences list
 */
export interface M01PreferencesResponseDto {
  preferences: M01PreferenceDto[];
  total: number;
}

/**
 * Response DTO for update preferences
 */
export interface M01UpdatePreferencesResponseDto {
  preferences: M01PreferenceDto[];
  message: string;
}

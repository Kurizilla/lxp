import { NotificationType, Priority } from '../../../../common/enums';

export class NotificationResponseDto {
  id: string;
  userId: string;
  type: NotificationType;
  priority: Priority;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationPreferenceResponseDto {
  id: string;
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

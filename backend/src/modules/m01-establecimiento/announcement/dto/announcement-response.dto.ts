import { NotificationType, Priority } from '../../../../common/enums';

export class AnnouncementResponseDto {
  id: string;
  creatorId: string;
  title: string;
  content: string;
  type: NotificationType;
  priority: Priority;
  isActive: boolean;
  publishedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AnnouncementWithReadCountDto extends AnnouncementResponseDto {
  totalRecipients: number;
  readCount: number;
  unreadCount: number;
}

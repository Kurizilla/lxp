import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType, NotificationPriority, NotificationChannel, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma';
import {
  M01CreateNotificationDto,
  M01NotificationsQueryDto,
  M01NotificationDto,
  M01NotificationsResponseDto,
  M01CreateNotificationResponseDto,
  M01MarkReadResponseDto,
  M01NotificationType,
  M01NotificationPriority,
} from '../dto/create-notification.dto';
import {
  M01UpdatePreferencesDto,
  M01PreferenceDto,
  M01PreferencesResponseDto,
  M01UpdatePreferencesResponseDto,
} from '../dto/update-preferences.dto';
import { AuthenticatedUser } from '../auth/jwt.strategy';

/**
 * Event payload for notification created
 */
export interface NotificationCreatedEvent {
  notification_id: string;
  sender_id: string | null;
  type: string;
  priority: string;
  title: string;
  recipient_ids: string[];
  classroom_id?: string;
}

/**
 * Service for notification operations
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new notification with recipients
   * Emits 'notification.created' event for cross-module listeners
   */
  async createNotification(
    dto: M01CreateNotificationDto,
    sender: AuthenticatedUser,
  ): Promise<M01CreateNotificationResponseDto> {
    // Validate recipient IDs exist
    const existingUsers = await this.prisma.m01_users.findMany({
      where: {
        id: { in: dto.recipient_ids },
        is_active: true,
      },
      select: { id: true },
    });

    const existingIds = new Set(existingUsers.map((u) => u.id));
    const invalidIds = dto.recipient_ids.filter((id) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid or inactive recipient IDs: ${invalidIds.join(', ')}`,
      );
    }

    // If classroom_id provided, validate it exists and sender has access
    if (dto.classroom_id) {
      const classroom = await this.prisma.m01_classrooms.findUnique({
        where: { id: dto.classroom_id },
      });

      if (!classroom) {
        throw new BadRequestException('Invalid classroom_id');
      }

      // Check sender has access to classroom (enrolled as teacher or admin)
      const enrollment = await this.prisma.m01_classroom_enrollments.findFirst({
        where: {
          user_id: sender.id,
          classroom_id: dto.classroom_id,
          dropped_at: null,
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('You do not have access to this classroom');
      }
    }

    // Map DTO enum values to Prisma enum values
    const typeValue = (dto.type || M01NotificationType.SYSTEM) as unknown as NotificationType;
    const priorityValue = (dto.priority || M01NotificationPriority.NORMAL) as unknown as NotificationPriority;

    // Create notification with recipients in a transaction
    const notification = await this.prisma.$transaction(async (tx) => {
      // Create the notification
      const newNotification = await tx.m01_notifications.create({
        data: {
          sender_id: sender.id,
          type: typeValue,
          priority: priorityValue,
          title: dto.title,
          message: dto.message,
          data: dto.data as Prisma.InputJsonValue | undefined,
        },
      });

      // Create recipient records
      await tx.m01_notification_recipients.createMany({
        data: dto.recipient_ids.map((recipientId) => ({
          notification_id: newNotification.id,
          user_id: recipientId,
        })),
      });

      return newNotification;
    });

    this.logger.log(
      `Notification ${notification.id} created by ${sender.email} for ${dto.recipient_ids.length} recipients`,
    );

    // Emit event for cross-module listeners
    const event: NotificationCreatedEvent = {
      notification_id: notification.id,
      sender_id: sender.id,
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      recipient_ids: dto.recipient_ids,
      classroom_id: dto.classroom_id,
    };

    this.eventEmitter.emit('notification.created', event);

    return {
      notification: {
        id: notification.id,
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        data: notification.data as Record<string, unknown> | null,
        created_at: notification.created_at,
        recipient_count: dto.recipient_ids.length,
      },
      message: 'Notification created successfully',
    };
  }

  /**
   * Get notifications for the authenticated user with filters and pagination
   */
  async getNotifications(
    user: AuthenticatedUser,
    query: M01NotificationsQueryDto,
  ): Promise<M01NotificationsResponseDto> {
    const limit = Math.min(
      parseInt(query.limit || String(this.DEFAULT_LIMIT), 10),
      this.MAX_LIMIT,
    );
    const offset = parseInt(query.offset || '0', 10);
    const unreadOnly = query.unread_only === 'true';

    // Check user preferences to filter out disabled notification types/channels
    const preferences = await this.prisma.m01_notification_preferences.findMany({
      where: {
        user_id: user.id,
        channel: 'in_app',
        enabled: false,
      },
    });

    const disabledTypes = preferences.map((p) => p.type);

    // Build where conditions for recipient records
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: Record<string, any> = {
      user_id: user.id,
      dismissed_at: null, // Don't show dismissed notifications
    };

    if (unreadOnly) {
      whereConditions.read_at = null;
    }

    // Build notification-level filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationWhere: Record<string, any> = {};

    if (query.priority) {
      notificationWhere.priority = query.priority;
    }

    if (query.type) {
      notificationWhere.type = query.type;
    } else if (disabledTypes.length > 0) {
      // Exclude disabled types unless specifically requested
      notificationWhere.type = { notIn: disabledTypes };
    }

    if (Object.keys(notificationWhere).length > 0) {
      whereConditions.notification = notificationWhere;
    }

    // Get total count (for pagination info)
    const totalCount = await this.prisma.m01_notification_recipients.count({
      where: whereConditions,
    });

    // Get unread count (always based on user's full notification set)
    const unreadCount = await this.prisma.m01_notification_recipients.count({
      where: {
        user_id: user.id,
        read_at: null,
        dismissed_at: null,
        ...(disabledTypes.length > 0
          ? { notification: { type: { notIn: disabledTypes } } }
          : {}),
      },
    });

    // Get notifications with pagination
    const recipients = await this.prisma.m01_notification_recipients.findMany({
      where: whereConditions,
      include: {
        notification: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        notification: {
          created_at: 'desc',
        },
      },
      skip: offset,
      take: limit,
    });

    const notifications: M01NotificationDto[] = recipients.map((r) => ({
      id: r.notification.id,
      type: r.notification.type,
      priority: r.notification.priority,
      title: r.notification.title,
      message: r.notification.message,
      data: r.notification.data as Record<string, unknown> | null,
      created_at: r.notification.created_at,
      sender: r.notification.sender
        ? {
            id: r.notification.sender.id,
            email: r.notification.sender.email,
            first_name: r.notification.sender.first_name,
            last_name: r.notification.sender.last_name,
          }
        : null,
      read_at: r.read_at,
      dismissed_at: r.dismissed_at,
    }));

    this.logger.log(
      `User ${user.email} retrieved ${notifications.length} notifications (unread: ${unreadCount})`,
    );

    return {
      notifications,
      total: totalCount,
      unread_count: unreadCount,
      limit,
      offset,
    };
  }

  /**
   * Mark a notification as read for the authenticated user
   * Atomically updates read_at timestamp
   */
  async markAsRead(
    notificationId: string,
    user: AuthenticatedUser,
  ): Promise<M01MarkReadResponseDto> {
    // Find the recipient record for this user and notification
    const recipient = await this.prisma.m01_notification_recipients.findUnique({
      where: {
        notification_id_user_id: {
          notification_id: notificationId,
          user_id: user.id,
        },
      },
    });

    if (!recipient) {
      throw new NotFoundException('Notification not found');
    }

    if (recipient.read_at) {
      // Already read, return current state
      return {
        message: 'Notification was already marked as read',
        notification_id: notificationId,
        read_at: recipient.read_at,
      };
    }

    // Atomically update read_at
    const updatedRecipient = await this.prisma.m01_notification_recipients.update({
      where: {
        notification_id_user_id: {
          notification_id: notificationId,
          user_id: user.id,
        },
      },
      data: {
        read_at: new Date(),
      },
    });

    this.logger.log(
      `Notification ${notificationId} marked as read by ${user.email}`,
    );

    return {
      message: 'Notification marked as read',
      notification_id: notificationId,
      read_at: updatedRecipient.read_at!,
    };
  }

  /**
   * Get notification preferences for the authenticated user
   */
  async getPreferences(user: AuthenticatedUser): Promise<M01PreferencesResponseDto> {
    const preferences = await this.prisma.m01_notification_preferences.findMany({
      where: { user_id: user.id },
      orderBy: [{ type: 'asc' }, { channel: 'asc' }],
    });

    const preferenceDtos: M01PreferenceDto[] = preferences.map((p) => ({
      id: p.id,
      type: p.type,
      channel: p.channel,
      enabled: p.enabled,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    return {
      preferences: preferenceDtos,
      total: preferenceDtos.length,
    };
  }

  /**
   * Update notification preferences for the authenticated user
   * Creates new preferences if they don't exist, updates if they do
   */
  async updatePreferences(
    dto: M01UpdatePreferencesDto,
    user: AuthenticatedUser,
  ): Promise<M01UpdatePreferencesResponseDto> {
    // Upsert each preference
    const updatedPreferences = await this.prisma.$transaction(
      dto.preferences.map((pref) => {
        const typeValue = pref.type as unknown as NotificationType;
        const channelValue = pref.channel as unknown as NotificationChannel;
        return this.prisma.m01_notification_preferences.upsert({
          where: {
            user_id_type_channel: {
              user_id: user.id,
              type: typeValue,
              channel: channelValue,
            },
          },
          create: {
            user_id: user.id,
            type: typeValue,
            channel: channelValue,
            enabled: pref.enabled,
          },
          update: {
            enabled: pref.enabled,
          },
        });
      }),
    );

    const preferenceDtos: M01PreferenceDto[] = updatedPreferences.map((p) => ({
      id: p.id,
      type: p.type,
      channel: p.channel,
      enabled: p.enabled,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    this.logger.log(
      `User ${user.email} updated ${preferenceDtos.length} notification preferences`,
    );

    return {
      preferences: preferenceDtos,
      message: 'Notification preferences updated successfully',
    };
  }
}

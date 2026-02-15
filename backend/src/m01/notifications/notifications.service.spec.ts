import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../common/prisma';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { M01NotificationType, M01NotificationPriority } from '../dto/create-notification.dto';
import { M01NotificationChannel } from '../dto/update-preferences.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: jest.Mocked<PrismaService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    session_id: 'session-123',
  };

  const mockRecipient = {
    id: 'recipient-456',
    email: 'recipient@example.com',
    first_name: 'Recipient',
    last_name: 'User',
    is_active: true,
  };

  const mockNotification = {
    id: 'notif-123',
    sender_id: 'user-123',
    type: 'announcement',
    priority: 'normal',
    title: 'Test Notification',
    message: 'This is a test notification',
    data: null,
    created_at: new Date(),
  };

  const mockRecipientRecord = {
    id: 'rec-123',
    notification_id: 'notif-123',
    user_id: 'user-123',
    read_at: null,
    dismissed_at: null,
    notification: {
      ...mockNotification,
      sender: {
        id: 'user-123',
        email: 'sender@example.com',
        first_name: 'Sender',
        last_name: 'User',
      },
    },
  };

  const mockPreference = {
    id: 'pref-123',
    user_id: 'user-123',
    type: 'announcement',
    channel: 'in_app',
    enabled: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      m01_users: {
        findMany: jest.fn(),
      },
      m01_classrooms: {
        findUnique: jest.fn(),
      },
      m01_classroom_enrollments: {
        findFirst: jest.fn(),
      },
      m01_notifications: {
        create: jest.fn(),
      },
      m01_notification_recipients: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      m01_notification_preferences: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get(PrismaService);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification with valid recipients', async () => {
      (prismaService.m01_users.findMany as jest.Mock).mockResolvedValue([
        mockRecipient,
      ]);

      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          const tx = {
            m01_notifications: {
              create: jest.fn().mockResolvedValue(mockNotification),
            },
            m01_notification_recipients: {
              createMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
          };
          return callback(tx);
        }
        return Promise.all(callback);
      });

      const dto = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: M01NotificationType.ANNOUNCEMENT,
        priority: M01NotificationPriority.NORMAL,
        recipient_ids: ['recipient-456'],
      };

      const result = await service.createNotification(dto, mockUser);

      expect(result.notification.title).toBe(dto.title);
      expect(result.notification.recipient_count).toBe(1);
      expect(result.message).toBe('Notification created successfully');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'notification.created',
        expect.objectContaining({
          notification_id: mockNotification.id,
          sender_id: mockUser.id,
          recipient_ids: dto.recipient_ids,
        }),
      );
    });

    it('should throw BadRequestException for invalid recipient IDs', async () => {
      (prismaService.m01_users.findMany as jest.Mock).mockResolvedValue([]);

      const dto = {
        title: 'Test',
        message: 'Test',
        recipient_ids: ['invalid-id'],
      };

      await expect(service.createNotification(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate classroom access when classroom_id is provided', async () => {
      (prismaService.m01_users.findMany as jest.Mock).mockResolvedValue([
        mockRecipient,
      ]);
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue({
        id: 'classroom-123',
      });
      (prismaService.m01_classroom_enrollments.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      const dto = {
        title: 'Test',
        message: 'Test',
        recipient_ids: ['recipient-456'],
        classroom_id: 'classroom-123',
      };

      await expect(service.createNotification(dto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException for invalid classroom_id', async () => {
      (prismaService.m01_users.findMany as jest.Mock).mockResolvedValue([
        mockRecipient,
      ]);
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(null);

      const dto = {
        title: 'Test',
        message: 'Test',
        recipient_ids: ['recipient-456'],
        classroom_id: 'invalid-classroom',
      };

      await expect(service.createNotification(dto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications for user', async () => {
      (prismaService.m01_notification_preferences.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (prismaService.m01_notification_recipients.count as jest.Mock)
        .mockResolvedValueOnce(1) // total count
        .mockResolvedValueOnce(1); // unread count
      (prismaService.m01_notification_recipients.findMany as jest.Mock).mockResolvedValue([
        mockRecipientRecord,
      ]);

      const result = await service.getNotifications(mockUser, {});

      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.unread_count).toBe(1);
      expect(result.limit).toBe(20); // default
      expect(result.offset).toBe(0); // default
    });

    it('should filter by unread_only', async () => {
      (prismaService.m01_notification_preferences.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (prismaService.m01_notification_recipients.count as jest.Mock).mockResolvedValue(0);
      (prismaService.m01_notification_recipients.findMany as jest.Mock).mockResolvedValue(
        [],
      );

      await service.getNotifications(mockUser, { unread_only: 'true' });

      expect(prismaService.m01_notification_recipients.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            read_at: null,
          }),
        }),
      );
    });

    it('should filter by priority', async () => {
      (prismaService.m01_notification_preferences.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (prismaService.m01_notification_recipients.count as jest.Mock).mockResolvedValue(0);
      (prismaService.m01_notification_recipients.findMany as jest.Mock).mockResolvedValue(
        [],
      );

      await service.getNotifications(mockUser, {
        priority: M01NotificationPriority.HIGH,
      });

      expect(prismaService.m01_notification_recipients.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            notification: expect.objectContaining({
              priority: 'high',
            }),
          }),
        }),
      );
    });

    it('should respect user preferences and exclude disabled types', async () => {
      (prismaService.m01_notification_preferences.findMany as jest.Mock).mockResolvedValue([
        { ...mockPreference, type: 'system', enabled: false },
      ]);
      (prismaService.m01_notification_recipients.count as jest.Mock).mockResolvedValue(0);
      (prismaService.m01_notification_recipients.findMany as jest.Mock).mockResolvedValue(
        [],
      );

      await service.getNotifications(mockUser, {});

      expect(prismaService.m01_notification_recipients.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            notification: expect.objectContaining({
              type: { notIn: ['system'] },
            }),
          }),
        }),
      );
    });

    it('should apply pagination limits', async () => {
      (prismaService.m01_notification_preferences.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (prismaService.m01_notification_recipients.count as jest.Mock).mockResolvedValue(0);
      (prismaService.m01_notification_recipients.findMany as jest.Mock).mockResolvedValue(
        [],
      );

      await service.getNotifications(mockUser, { limit: '10', offset: '5' });

      expect(prismaService.m01_notification_recipients.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 10,
        }),
      );
    });

    it('should cap limit at MAX_LIMIT', async () => {
      (prismaService.m01_notification_preferences.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (prismaService.m01_notification_recipients.count as jest.Mock).mockResolvedValue(0);
      (prismaService.m01_notification_recipients.findMany as jest.Mock).mockResolvedValue(
        [],
      );

      await service.getNotifications(mockUser, { limit: '999' });

      expect(prismaService.m01_notification_recipients.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // MAX_LIMIT
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read atomically', async () => {
      const readAt = new Date();
      (prismaService.m01_notification_recipients.findUnique as jest.Mock).mockResolvedValue({
        ...mockRecipientRecord,
        read_at: null,
      });
      (prismaService.m01_notification_recipients.update as jest.Mock).mockResolvedValue({
        ...mockRecipientRecord,
        read_at: readAt,
      });

      const result = await service.markAsRead('notif-123', mockUser);

      expect(result.message).toBe('Notification marked as read');
      expect(result.notification_id).toBe('notif-123');
      expect(result.read_at).toBe(readAt);

      expect(prismaService.m01_notification_recipients.update).toHaveBeenCalledWith({
        where: {
          notification_id_user_id: {
            notification_id: 'notif-123',
            user_id: mockUser.id,
          },
        },
        data: {
          read_at: expect.any(Date),
        },
      });
    });

    it('should return current state if already read', async () => {
      const readAt = new Date();
      (prismaService.m01_notification_recipients.findUnique as jest.Mock).mockResolvedValue({
        ...mockRecipientRecord,
        read_at: readAt,
      });

      const result = await service.markAsRead('notif-123', mockUser);

      expect(result.message).toBe('Notification was already marked as read');
      expect(result.read_at).toBe(readAt);
      expect(prismaService.m01_notification_recipients.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent notification', async () => {
      (prismaService.m01_notification_recipients.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.markAsRead('notif-999', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      (prismaService.m01_notification_preferences.findMany as jest.Mock).mockResolvedValue([
        mockPreference,
      ]);

      const result = await service.getPreferences(mockUser);

      expect(result.preferences).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.preferences[0].type).toBe(mockPreference.type);
      expect(result.preferences[0].channel).toBe(mockPreference.channel);
    });

    it('should return empty array when no preferences set', async () => {
      (prismaService.m01_notification_preferences.findMany as jest.Mock).mockResolvedValue(
        [],
      );

      const result = await service.getPreferences(mockUser);

      expect(result.preferences).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updatePreferences', () => {
    it('should upsert notification preferences', async () => {
      const updatedPreference = { ...mockPreference, enabled: false };
      (prismaService.$transaction as jest.Mock).mockResolvedValue([updatedPreference]);

      const dto = {
        preferences: [
          {
            type: M01NotificationType.ANNOUNCEMENT,
            channel: M01NotificationChannel.IN_APP,
            enabled: false,
          },
        ],
      };

      const result = await service.updatePreferences(dto, mockUser);

      expect(result.preferences).toHaveLength(1);
      expect(result.message).toBe('Notification preferences updated successfully');
    });

    it('should update multiple preferences at once', async () => {
      const prefs = [
        { ...mockPreference, type: 'announcement', enabled: true },
        { ...mockPreference, id: 'pref-456', type: 'alert', enabled: false },
      ];
      (prismaService.$transaction as jest.Mock).mockResolvedValue(prefs);

      const dto = {
        preferences: [
          {
            type: M01NotificationType.ANNOUNCEMENT,
            channel: M01NotificationChannel.IN_APP,
            enabled: true,
          },
          {
            type: M01NotificationType.ALERT,
            channel: M01NotificationChannel.IN_APP,
            enabled: false,
          },
        ],
      };

      const result = await service.updatePreferences(dto, mockUser);

      expect(result.preferences).toHaveLength(2);
    });
  });
});

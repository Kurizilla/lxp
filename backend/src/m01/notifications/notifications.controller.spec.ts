import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { M01NotificationType, M01NotificationPriority } from '../dto/create-notification.dto';
import { M01NotificationChannel } from '../dto/update-preferences.dto';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    session_id: 'session-123',
  };

  const mockRequest = {
    user: mockUser,
  } as unknown as { user: AuthenticatedUser };

  const mockNotification = {
    id: 'notif-123',
    type: 'announcement',
    priority: 'normal',
    title: 'Test Notification',
    message: 'This is a test',
    data: null,
    created_at: new Date(),
    sender: {
      id: 'user-456',
      email: 'sender@example.com',
      first_name: 'Sender',
      last_name: 'User',
    },
    read_at: null,
    dismissed_at: null,
  };

  const mockCreateResponse = {
    notification: {
      id: 'notif-123',
      type: 'announcement',
      priority: 'normal',
      title: 'Test Notification',
      message: 'This is a test',
      data: null,
      created_at: new Date(),
      recipient_count: 1,
    },
    message: 'Notification created successfully',
  };

  const mockListResponse = {
    notifications: [mockNotification],
    total: 1,
    unread_count: 1,
    limit: 20,
    offset: 0,
  };

  const mockMarkReadResponse = {
    message: 'Notification marked as read',
    notification_id: 'notif-123',
    read_at: new Date(),
  };

  const mockPreference = {
    id: 'pref-123',
    type: 'announcement',
    channel: 'in_app',
    enabled: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPreferencesResponse = {
    preferences: [mockPreference],
    total: 1,
  };

  const mockUpdatePreferencesResponse = {
    preferences: [mockPreference],
    message: 'Notification preferences updated successfully',
  };

  beforeEach(async () => {
    const mockNotificationsService = {
      createNotification: jest.fn(),
      getNotifications: jest.fn(),
      markAsRead: jest.fn(),
      getPreferences: jest.fn(),
      updatePreferences: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      service.createNotification.mockResolvedValue(mockCreateResponse);

      const dto = {
        title: 'Test Notification',
        message: 'This is a test',
        type: M01NotificationType.ANNOUNCEMENT,
        priority: M01NotificationPriority.NORMAL,
        recipient_ids: ['recipient-456'],
      };

      const result = await controller.createNotification(dto, mockRequest as never);

      expect(result).toEqual(mockCreateResponse);
      expect(service.createNotification).toHaveBeenCalledWith(dto, mockUser);
    });

    it('should pass classroom_id when provided', async () => {
      service.createNotification.mockResolvedValue(mockCreateResponse);

      const dto = {
        title: 'Test Notification',
        message: 'This is a test',
        recipient_ids: ['recipient-456'],
        classroom_id: 'classroom-123',
      };

      await controller.createNotification(dto, mockRequest as never);

      expect(service.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ classroom_id: 'classroom-123' }),
        mockUser,
      );
    });
  });

  describe('getNotifications', () => {
    it('should return notifications list', async () => {
      service.getNotifications.mockResolvedValue(mockListResponse);

      const result = await controller.getNotifications({}, mockRequest as never);

      expect(result).toEqual(mockListResponse);
      expect(service.getNotifications).toHaveBeenCalledWith(mockUser, {});
    });

    it('should pass query parameters', async () => {
      service.getNotifications.mockResolvedValue(mockListResponse);

      const query = {
        unread_only: 'true',
        priority: M01NotificationPriority.HIGH,
        limit: '10',
        offset: '5',
      };

      await controller.getNotifications(query, mockRequest as never);

      expect(service.getNotifications).toHaveBeenCalledWith(mockUser, query);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      service.markAsRead.mockResolvedValue(mockMarkReadResponse);

      const result = await controller.markAsRead('notif-123', mockRequest as never);

      expect(result).toEqual(mockMarkReadResponse);
      expect(service.markAsRead).toHaveBeenCalledWith('notif-123', mockUser);
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      service.getPreferences.mockResolvedValue(mockPreferencesResponse);

      const result = await controller.getPreferences(mockRequest as never);

      expect(result).toEqual(mockPreferencesResponse);
      expect(service.getPreferences).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      service.updatePreferences.mockResolvedValue(mockUpdatePreferencesResponse);

      const dto = {
        preferences: [
          {
            type: M01NotificationType.ANNOUNCEMENT,
            channel: M01NotificationChannel.IN_APP,
            enabled: true,
          },
        ],
      };

      const result = await controller.updatePreferences(dto, mockRequest as never);

      expect(result).toEqual(mockUpdatePreferencesResponse);
      expect(service.updatePreferences).toHaveBeenCalledWith(dto, mockUser);
    });
  });
});

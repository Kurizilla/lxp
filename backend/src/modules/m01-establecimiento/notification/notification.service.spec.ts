import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationType, Priority } from '../../../common/enums';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const dto = {
        userId: 1,
        type: NotificationType.IN_APP,
        priority: Priority.MEDIUM,
        title: 'Test Notification',
        message: 'Test message',
      };

      const mockNotification = {
        id: BigInt(1),
        userId: BigInt(1),
        type: 'IN_APP',
        priority: 'MEDIUM',
        title: 'Test Notification',
        message: 'Test message',
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create(dto);

      expect(result.title).toBe('Test Notification');
      expect(result.isRead).toBe(false);
      expect(mockPrismaService.notification.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a notification by id', async () => {
      const mockNotification = {
        id: BigInt(1),
        userId: BigInt(1),
        type: 'IN_APP',
        priority: 'MEDIUM',
        title: 'Test Notification',
        message: 'Test message',
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);

      const result = await service.findOne(1);

      expect(result.title).toBe('Test Notification');
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: BigInt(1),
        userId: BigInt(1),
        type: 'IN_APP',
        priority: 'MEDIUM',
        title: 'Test Notification',
        message: 'Test message',
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedNotification = {
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      };

      mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);
      mockPrismaService.notification.update.mockResolvedValue(updatedNotification);

      const result = await service.markAsRead(1);

      expect(result.isRead).toBe(true);
      expect(result.readAt).not.toBeNull();
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update notification read status', async () => {
      const mockNotification = {
        id: BigInt(1),
        userId: BigInt(1),
        type: 'IN_APP',
        priority: 'MEDIUM',
        title: 'Test Notification',
        message: 'Test message',
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedNotification = {
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      };

      mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);
      mockPrismaService.notification.update.mockResolvedValue(updatedNotification);

      const result = await service.update(1, { isRead: true });

      expect(result.isRead).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        {
          id: BigInt(1),
          userId: BigInt(1),
          type: 'IN_APP',
          priority: 'MEDIUM',
          title: 'Notification 1',
          message: 'Message 1',
          isRead: false,
          readAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrismaService.notification.count.mockResolvedValue(1);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('notification preferences', () => {
    it('should create notification preference', async () => {
      const mockPreference = {
        id: BigInt(1),
        userId: BigInt(1),
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.notificationPreference.create.mockResolvedValue(mockPreference);

      const result = await service.createPreference(1, {});

      expect(result.emailEnabled).toBe(true);
      expect(result.inAppEnabled).toBe(true);
      expect(result.pushEnabled).toBe(false);
    });

    it('should update notification preference', async () => {
      const mockPreference = {
        id: BigInt(1),
        userId: BigInt(1),
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedPreference = {
        ...mockPreference,
        pushEnabled: true,
      };

      mockPrismaService.notificationPreference.findUnique.mockResolvedValue(mockPreference);
      mockPrismaService.notificationPreference.update.mockResolvedValue(updatedPreference);

      const result = await service.updatePreference(1, { pushEnabled: true });

      expect(result.pushEnabled).toBe(true);
    });
  });
});

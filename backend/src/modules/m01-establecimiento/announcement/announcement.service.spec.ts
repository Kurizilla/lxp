import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AnnouncementService, ADMIN_CONFIG_UPDATED_EVENT } from './announcement.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationType, Priority } from '../../../common/enums';

describe('AnnouncementService', () => {
  let service: AnnouncementService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrismaService = {
    announcement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    notification: {
      count: jest.fn(),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<AnnouncementService>(AnnouncementService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an announcement and emit event', async () => {
      const dto = {
        creatorId: 1,
        title: 'Test Announcement',
        content: 'Test content',
        type: NotificationType.IN_APP,
        priority: Priority.HIGH,
      };

      const mockAnnouncement = {
        id: BigInt(1),
        creatorId: BigInt(1),
        title: 'Test Announcement',
        content: 'Test content',
        type: 'IN_APP',
        priority: 'HIGH',
        isActive: true,
        publishedAt: new Date(),
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.announcement.create.mockResolvedValue(mockAnnouncement);

      const result = await service.create(dto);

      expect(result.title).toBe('Test Announcement');
      expect(mockPrismaService.announcement.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        ADMIN_CONFIG_UPDATED_EVENT,
        expect.objectContaining({ key: 'announcement.created' }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an announcement by id', async () => {
      const mockAnnouncement = {
        id: BigInt(1),
        creatorId: BigInt(1),
        title: 'Test Announcement',
        content: 'Test content',
        type: 'IN_APP',
        priority: 'HIGH',
        isActive: true,
        publishedAt: new Date(),
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.announcement.findUnique.mockResolvedValue(mockAnnouncement);

      const result = await service.findOne(1);

      expect(result.title).toBe('Test Announcement');
    });

    it('should throw NotFoundException when announcement not found', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an announcement and emit event', async () => {
      const mockAnnouncement = {
        id: BigInt(1),
        creatorId: BigInt(1),
        title: 'Test Announcement',
        content: 'Test content',
        type: 'IN_APP',
        priority: 'HIGH',
        isActive: true,
        publishedAt: new Date(),
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedAnnouncement = {
        ...mockAnnouncement,
        title: 'Updated Title',
      };

      mockPrismaService.announcement.findUnique.mockResolvedValue(mockAnnouncement);
      mockPrismaService.announcement.update.mockResolvedValue(updatedAnnouncement);

      const result = await service.update(1, { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        ADMIN_CONFIG_UPDATED_EVENT,
        expect.objectContaining({ key: 'announcement.updated' }),
      );
    });
  });

  describe('delete', () => {
    it('should delete an announcement and emit event', async () => {
      const mockAnnouncement = {
        id: BigInt(1),
        creatorId: BigInt(1),
        title: 'Test Announcement',
        content: 'Test content',
        type: 'IN_APP',
        priority: 'HIGH',
        isActive: true,
        publishedAt: new Date(),
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.announcement.findUnique.mockResolvedValue(mockAnnouncement);
      mockPrismaService.announcement.delete.mockResolvedValue(mockAnnouncement);

      await service.delete(1);

      expect(mockPrismaService.announcement.delete).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        ADMIN_CONFIG_UPDATED_EVENT,
        expect.objectContaining({ key: 'announcement.deleted' }),
      );
    });

    it('should throw NotFoundException when announcement not found', async () => {
      mockPrismaService.announcement.findUnique.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated announcements', async () => {
      const mockAnnouncements = [
        {
          id: BigInt(1),
          creatorId: BigInt(1),
          title: 'Announcement 1',
          content: 'Content 1',
          type: 'IN_APP',
          priority: 'HIGH',
          isActive: true,
          publishedAt: new Date(),
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.announcement.findMany.mockResolvedValue(mockAnnouncements);
      mockPrismaService.announcement.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('getSentList', () => {
    it('should return sent announcements with read counts', async () => {
      const mockAnnouncements = [
        {
          id: BigInt(1),
          creatorId: BigInt(1),
          title: 'Announcement 1',
          content: 'Content 1',
          type: 'IN_APP',
          priority: 'HIGH',
          isActive: true,
          publishedAt: new Date(),
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.announcement.findMany.mockResolvedValue(mockAnnouncements);
      mockPrismaService.announcement.count.mockResolvedValue(1);
      mockPrismaService.notification.count
        .mockResolvedValueOnce(10) // total recipients
        .mockResolvedValueOnce(5); // read count

      const result = await service.getSentList(1, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].totalRecipients).toBe(10);
      expect(result.data[0].readCount).toBe(5);
      expect(result.data[0].unreadCount).toBe(5);
    });
  });
});

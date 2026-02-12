import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  CreateNotificationPreferenceDto,
  UpdateNotificationPreferenceDto,
  NotificationResponseDto,
  NotificationPreferenceResponseDto,
} from './dto';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../common/dto';
import { NotificationType as PrismaNotificationType, Priority as PrismaPriority } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: BigInt(dto.userId),
        type: dto.type as PrismaNotificationType,
        priority: dto.priority as PrismaPriority,
        title: dto.title,
        message: dto.message,
      },
    });

    return this.mapToNotificationResponse(notification);
  }

  async findAll(
    userId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId: BigInt(userId) },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId: BigInt(userId) } }),
    ]);

    return new PaginatedResponseDto(
      notifications.map((n) => this.mapToNotificationResponse(n)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: BigInt(id) },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return this.mapToNotificationResponse(notification);
  }

  async markAsRead(id: number): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: BigInt(id) },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    const updated = await this.prisma.notification.update({
      where: { id: BigInt(id) },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.mapToNotificationResponse(updated);
  }

  async update(id: number, dto: UpdateNotificationDto): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: BigInt(id) },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    const updateData: { isRead?: boolean; readAt?: Date | null } = {};

    if (dto.isRead !== undefined) {
      updateData.isRead = dto.isRead;
      updateData.readAt = dto.isRead ? new Date() : null;
    }

    const updated = await this.prisma.notification.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return this.mapToNotificationResponse(updated);
  }

  async delete(id: number): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: BigInt(id) },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    await this.prisma.notification.delete({
      where: { id: BigInt(id) },
    });
  }

  // Notification Preference methods
  async getPreference(userId: number): Promise<NotificationPreferenceResponseDto | null> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!preference) {
      return null;
    }

    return this.mapToPreferenceResponse(preference);
  }

  async createPreference(
    userId: number,
    dto: CreateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceResponseDto> {
    const preference = await this.prisma.notificationPreference.create({
      data: {
        userId: BigInt(userId),
        emailEnabled: dto.emailEnabled ?? true,
        inAppEnabled: dto.inAppEnabled ?? true,
        pushEnabled: dto.pushEnabled ?? false,
      },
    });

    return this.mapToPreferenceResponse(preference);
  }

  async updatePreference(
    userId: number,
    dto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceResponseDto> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!preference) {
      throw new NotFoundException(`Notification preferences for user ${userId} not found`);
    }

    const updated = await this.prisma.notificationPreference.update({
      where: { userId: BigInt(userId) },
      data: {
        ...(dto.emailEnabled !== undefined && { emailEnabled: dto.emailEnabled }),
        ...(dto.inAppEnabled !== undefined && { inAppEnabled: dto.inAppEnabled }),
        ...(dto.pushEnabled !== undefined && { pushEnabled: dto.pushEnabled }),
      },
    });

    return this.mapToPreferenceResponse(updated);
  }

  async upsertPreference(
    userId: number,
    dto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceResponseDto> {
    const preference = await this.prisma.notificationPreference.upsert({
      where: { userId: BigInt(userId) },
      create: {
        userId: BigInt(userId),
        emailEnabled: dto.emailEnabled ?? true,
        inAppEnabled: dto.inAppEnabled ?? true,
        pushEnabled: dto.pushEnabled ?? false,
      },
      update: {
        ...(dto.emailEnabled !== undefined && { emailEnabled: dto.emailEnabled }),
        ...(dto.inAppEnabled !== undefined && { inAppEnabled: dto.inAppEnabled }),
        ...(dto.pushEnabled !== undefined && { pushEnabled: dto.pushEnabled }),
      },
    });

    return this.mapToPreferenceResponse(preference);
  }

  private mapToNotificationResponse(notification: {
    id: bigint;
    userId: bigint;
    type: PrismaNotificationType;
    priority: PrismaPriority;
    title: string;
    message: string;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): NotificationResponseDto {
    return {
      id: notification.id.toString(),
      userId: notification.userId.toString(),
      type: notification.type as NotificationResponseDto['type'],
      priority: notification.priority as NotificationResponseDto['priority'],
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  private mapToPreferenceResponse(preference: {
    id: bigint;
    userId: bigint;
    emailEnabled: boolean;
    inAppEnabled: boolean;
    pushEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): NotificationPreferenceResponseDto {
    return {
      id: preference.id.toString(),
      userId: preference.userId.toString(),
      emailEnabled: preference.emailEnabled,
      inAppEnabled: preference.inAppEnabled,
      pushEnabled: preference.pushEnabled,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt,
    };
  }
}

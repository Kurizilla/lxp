import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementResponseDto,
  AnnouncementWithReadCountDto,
} from './dto';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../common/dto';
import { NotificationType as PrismaNotificationType, Priority as PrismaPriority } from '@prisma/client';

export const ADMIN_CONFIG_UPDATED_EVENT = 'admin-config-updated';

export interface AdminConfigUpdatedPayload {
  key: string;
  value: unknown;
}

@Injectable()
export class AnnouncementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateAnnouncementDto): Promise<AnnouncementResponseDto> {
    const announcement = await this.prisma.announcement.create({
      data: {
        creatorId: BigInt(dto.creatorId),
        title: dto.title,
        content: dto.content,
        type: dto.type as PrismaNotificationType,
        priority: dto.priority as PrismaPriority,
        isActive: dto.isActive ?? true,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    // Emit admin-config-updated event
    this.eventEmitter.emit(ADMIN_CONFIG_UPDATED_EVENT, {
      key: 'announcement.created',
      value: { id: announcement.id.toString(), title: announcement.title },
    } as AdminConfigUpdatedPayload);

    return this.mapToAnnouncementResponse(announcement);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AnnouncementResponseDto>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.announcement.count(),
    ]);

    return new PaginatedResponseDto(
      announcements.map((a) => this.mapToAnnouncementResponse(a)),
      total,
      page,
      limit,
    );
  }

  async findActive(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AnnouncementResponseDto>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where = {
      isActive: true,
      publishedAt: { lte: now },
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } },
      ],
    };

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return new PaginatedResponseDto(
      announcements.map((a) => this.mapToAnnouncementResponse(a)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number): Promise<AnnouncementResponseDto> {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: BigInt(id) },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return this.mapToAnnouncementResponse(announcement);
  }

  async update(id: number, dto: UpdateAnnouncementDto): Promise<AnnouncementResponseDto> {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: BigInt(id) },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.publishedAt !== undefined) updateData.publishedAt = new Date(dto.publishedAt);
    if (dto.expiresAt !== undefined) updateData.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const updated = await this.prisma.announcement.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    // Emit admin-config-updated event
    this.eventEmitter.emit(ADMIN_CONFIG_UPDATED_EVENT, {
      key: 'announcement.updated',
      value: { id: updated.id.toString(), changes: Object.keys(updateData) },
    } as AdminConfigUpdatedPayload);

    return this.mapToAnnouncementResponse(updated);
  }

  async delete(id: number): Promise<void> {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: BigInt(id) },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    await this.prisma.announcement.delete({
      where: { id: BigInt(id) },
    });

    // Emit admin-config-updated event
    this.eventEmitter.emit(ADMIN_CONFIG_UPDATED_EVENT, {
      key: 'announcement.deleted',
      value: { id: id.toString() },
    } as AdminConfigUpdatedPayload);
  }

  /**
   * Get sent announcements with read counts.
   * This counts notifications generated from announcements and their read status.
   */
  async getSentList(
    creatorId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AnnouncementWithReadCountDto>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = { creatorId: BigInt(creatorId) };

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    // Get read counts for each announcement
    // In a real scenario, we would have a relation between announcements and notifications
    // For now, we'll count notifications that match the announcement title/content
    const announcementsWithCounts = await Promise.all(
      announcements.map(async (announcement) => {
        // Count notifications that reference this announcement (by matching title)
        const [totalRecipients, readCount] = await Promise.all([
          this.prisma.notification.count({
            where: {
              title: announcement.title,
            },
          }),
          this.prisma.notification.count({
            where: {
              title: announcement.title,
              isRead: true,
            },
          }),
        ]);

        return {
          ...this.mapToAnnouncementResponse(announcement),
          totalRecipients,
          readCount,
          unreadCount: totalRecipients - readCount,
        };
      }),
    );

    return new PaginatedResponseDto(
      announcementsWithCounts,
      total,
      page,
      limit,
    );
  }

  private mapToAnnouncementResponse(announcement: {
    id: bigint;
    creatorId: bigint;
    title: string;
    content: string;
    type: PrismaNotificationType;
    priority: PrismaPriority;
    isActive: boolean;
    publishedAt: Date;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): AnnouncementResponseDto {
    return {
      id: announcement.id.toString(),
      creatorId: announcement.creatorId.toString(),
      title: announcement.title,
      content: announcement.content,
      type: announcement.type as AnnouncementResponseDto['type'],
      priority: announcement.priority as AnnouncementResponseDto['priority'],
      isActive: announcement.isActive,
      publishedAt: announcement.publishedAt,
      expiresAt: announcement.expiresAt,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    };
  }
}

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { NotificationsService } from './notifications.service';
import {
  M01CreateNotificationDto,
  M01NotificationsQueryDto,
  M01NotificationsResponseDto,
  M01CreateNotificationResponseDto,
  M01MarkReadResponseDto,
} from '../dto/create-notification.dto';
import {
  M01UpdatePreferencesDto,
  M01PreferencesResponseDto,
  M01UpdatePreferencesResponseDto,
} from '../dto/update-preferences.dto';

/**
 * Extended Express Request with authenticated user
 */
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Controller for notification endpoints
 * All endpoints require JWT authentication
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * POST /notifications
   * Create a new notification with optional classroom_id
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNotification(
    @Body() dto: M01CreateNotificationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M01CreateNotificationResponseDto> {
    return this.notificationsService.createNotification(dto, req.user);
  }

  /**
   * GET /notifications
   * Get notifications for authenticated user with filters and pagination
   * Query params: unread_only, priority, type, limit, offset
   */
  @Get()
  async getNotifications(
    @Query() query: M01NotificationsQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M01NotificationsResponseDto> {
    return this.notificationsService.getNotifications(req.user, query);
  }

  /**
   * PATCH /notifications/:id/read
   * Mark a notification as read for the authenticated user
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') notificationId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<M01MarkReadResponseDto> {
    return this.notificationsService.markAsRead(notificationId, req.user);
  }

  /**
   * GET /notifications/preferences
   * Get notification preferences for the authenticated user
   */
  @Get('preferences')
  async getPreferences(
    @Req() req: AuthenticatedRequest,
  ): Promise<M01PreferencesResponseDto> {
    return this.notificationsService.getPreferences(req.user);
  }

  /**
   * PATCH /notifications/preferences
   * Update notification preferences for the authenticated user
   */
  @Patch('preferences')
  @HttpCode(HttpStatus.OK)
  async updatePreferences(
    @Body() dto: M01UpdatePreferencesDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<M01UpdatePreferencesResponseDto> {
    return this.notificationsService.updatePreferences(dto, req.user);
  }
}

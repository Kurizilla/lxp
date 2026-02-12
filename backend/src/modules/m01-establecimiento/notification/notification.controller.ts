import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  CreateNotificationPreferenceDto,
  UpdateNotificationPreferenceDto,
} from './dto';
import { PaginationQueryDto } from '../../../common/dto';

@Controller('api/v1/modules/m01/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Get('user/:userId')
  async findAllByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.notificationService.findAll(userId, query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notificationService.update(id, dto);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.markAsRead(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.notificationService.delete(id);
  }

  // Notification Preferences Endpoints
  @Get('preferences/:userId')
  async getPreference(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationService.getPreference(userId);
  }

  @Post('preferences/:userId')
  async createPreference(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateNotificationPreferenceDto,
  ) {
    return this.notificationService.createPreference(userId, dto);
  }

  @Patch('preferences/:userId')
  async updatePreference(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    return this.notificationService.upsertPreference(userId, dto);
  }
}

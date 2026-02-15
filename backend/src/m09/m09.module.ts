import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../common/prisma';
import { M01Module } from '../m01/m01.module';
import { OfflineController } from './offline/offline.controller';
import { OfflineService } from './offline/offline.service';
import { M09CalendarController } from './calendar/calendar.controller';
import { M09CalendarService } from './calendar/calendar.service';
import { M09ModoClaseController } from './modo-clase/modo-clase.controller';
import { M09ModoClaseService } from './modo-clase/modo-clase.service';

/**
 * M09 Module - Calendars, Modo Clase, and Offline Sync
 * Provides:
 * - Calendar assignment and event management for classrooms
 * - Class session (modo clase) creation and state management
 * - Offline sync functionality with bidirectional sync and conflict detection
 */
@Module({
  imports: [PrismaModule, forwardRef(() => M01Module)],
  controllers: [OfflineController, M09CalendarController, M09ModoClaseController],
  providers: [OfflineService, M09CalendarService, M09ModoClaseService],
  exports: [OfflineService, M09CalendarService, M09ModoClaseService],
})
export class M09Module {}

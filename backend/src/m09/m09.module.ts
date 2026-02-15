import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma';
import { OfflineController } from './offline/offline.controller';
import { OfflineService } from './offline/offline.service';

/**
 * M09 Module - Calendars, Modo Clase, and Offline Sync
 * Provides offline sync functionality with bidirectional sync and conflict detection
 */
@Module({
  imports: [PrismaModule],
  controllers: [OfflineController],
  providers: [OfflineService],
  exports: [OfflineService],
})
export class M09Module {}

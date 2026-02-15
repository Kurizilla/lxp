import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../common/prisma';
import { ObservationsController } from './observations/observations.controller';
import { ObservationsService } from './observations/observations.service';
import { M21AbilityFactory } from './casl/m21-ability.factory';
import { M21ObservationsGuard } from './guards/m21-observations.guard';

/**
 * Queue name for M21 processing jobs
 */
export const M21_PROCESSING_QUEUE = 'm21_processing';

/**
 * M21 Module - Classroom Observations & AI Analysis
 * 
 * Provides functionality for:
 * - Storage bucket management for S3-compatible storage
 * - Observation recording uploads and management
 * - Annotations on recordings
 * - Review progress tracking
 * 
 * Roles:
 * - admin_nacional: Full access to all observations
 * - supervisor_pedagogico: Can view and manage observations in their scope
 * - observador: Can upload and manage their own recordings
 * - revisor: Can view recordings and create annotations
 */
@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: M21_PROCESSING_QUEUE,
    }),
  ],
  controllers: [ObservationsController],
  providers: [
    ObservationsService,
    M21AbilityFactory,
    M21ObservationsGuard,
  ],
  exports: [ObservationsService, M21AbilityFactory],
})
export class M21Module {}

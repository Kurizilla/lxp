import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../common/prisma';
import { CryptoModule } from '../common/crypto';
import { ObservationsController } from './observations/observations.controller';
import { ObservationsService } from './observations/observations.service';
import { RecordingsController } from './observations/recordings.controller';
import { UploadService } from './observations/upload.service';
import { TranscriptionService } from './observations/transcription.service';
import { TranscribeJobProcessor } from './observations/transcribe.job';
import { AnalysisService } from './observations/analysis.service';
import { AnalyzeJobProcessor } from './observations/analyze.job';
import { DashboardService } from './observations/dashboard.service';
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
 * 
 * Controllers:
 * - ObservationsController: Storage buckets, annotations, review progress
 * - RecordingsController: Recording uploads, metadata, status management
 * 
 * Services:
 * - ObservationsService: Core observation operations
 * - UploadService: S3 presigned URL generation and upload handling
 */
@Module({
  imports: [
    PrismaModule,
    CryptoModule,
    BullModule.registerQueue({
      name: M21_PROCESSING_QUEUE,
    }),
  ],
  controllers: [ObservationsController, RecordingsController],
  providers: [
    ObservationsService,
    UploadService,
    TranscriptionService,
    TranscribeJobProcessor,
    AnalysisService,
    AnalyzeJobProcessor,
    DashboardService,
    M21AbilityFactory,
    M21ObservationsGuard,
  ],
  exports: [ObservationsService, UploadService, TranscriptionService, AnalysisService, DashboardService, M21AbilityFactory],
})
export class M21Module {}

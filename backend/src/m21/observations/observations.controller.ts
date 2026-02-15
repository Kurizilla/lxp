import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../m01/auth/jwt-auth.guard';
import { M21ObservationsGuard, M21ObservationsRequest } from '../guards/m21-observations.guard';
import { ObservationsService } from './observations.service';
import {
  M21UpsertBucketDto,
  M21UpdateBucketDto,
  M21StorageBucketsResponseDto,
  M21StorageBucketResponseDto,
  M21ListBucketsQueryDto,
} from '../dto/upsert-bucket.dto';
import {
  M21UploadRecordingDto,
  M21UpdateRecordingDto,
  M21CompleteUploadDto,
  M21RecordingsResponseDto,
  M21RecordingResponseDto,
  M21ListRecordingsQueryDto,
} from '../dto/upload-recording.dto';
import {
  M21CreateAnnotationDto,
  M21UpdateAnnotationDto,
  M21AnnotationsResponseDto,
  M21AnnotationResponseDto,
  M21ListAnnotationsQueryDto,
} from '../dto/annotation.dto';
import {
  M21UpsertReviewProgressDto,
  M21UpdateReviewProgressDto,
  M21ReviewProgressListResponseDto,
  M21ReviewProgressResponseDto,
  M21ListReviewProgressQueryDto,
} from '../dto/review-progress.dto';

/**
 * Controller for M21 Observations module
 * Handles storage buckets, observation recordings, annotations, and review progress
 * All endpoints require JWT authentication and M21 role (admin_nacional, supervisor_pedagogico, observador, revisor)
 */
@Controller('observations')
@UseGuards(JwtAuthGuard, M21ObservationsGuard)
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  // ============================================================================
  // STORAGE BUCKETS
  // ============================================================================

  /**
   * GET /observations/buckets
   * List all storage buckets with pagination
   */
  @Get('buckets')
  async listBuckets(
    @Query() query: M21ListBucketsQueryDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21StorageBucketsResponseDto> {
    return this.observationsService.listBuckets(query, req.userWithPermissions!);
  }

  /**
   * GET /observations/buckets/:id
   * Get a single storage bucket by ID
   */
  @Get('buckets/:id')
  async getBucket(
    @Param('id') id: string,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21StorageBucketResponseDto> {
    return this.observationsService.getBucket(id, req.userWithPermissions!);
  }

  /**
   * POST /observations/buckets
   * Create a new storage bucket
   */
  @Post('buckets')
  @HttpCode(HttpStatus.CREATED)
  async createBucket(
    @Body() dto: M21UpsertBucketDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21StorageBucketResponseDto> {
    return this.observationsService.createBucket(dto, req.userWithPermissions!);
  }

  /**
   * PATCH /observations/buckets/:id
   * Update an existing storage bucket
   */
  @Patch('buckets/:id')
  async updateBucket(
    @Param('id') id: string,
    @Body() dto: M21UpdateBucketDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21StorageBucketResponseDto> {
    return this.observationsService.updateBucket(id, dto, req.userWithPermissions!);
  }

  // ============================================================================
  // OBSERVATION RECORDINGS
  // ============================================================================

  /**
   * GET /observations/recordings
   * List all recordings with pagination and filters
   */
  @Get('recordings')
  async listRecordings(
    @Query() query: M21ListRecordingsQueryDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21RecordingsResponseDto> {
    return this.observationsService.listRecordings(query, req.userWithPermissions!);
  }

  /**
   * GET /observations/recordings/:id
   * Get a single recording by ID
   */
  @Get('recordings/:id')
  async getRecording(
    @Param('id') id: string,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21RecordingResponseDto> {
    return this.observationsService.getRecording(id, req.userWithPermissions!);
  }

  /**
   * POST /observations/recordings
   * Create a new recording (initiate upload)
   * Returns presigned URL for actual file upload
   */
  @Post('recordings')
  @HttpCode(HttpStatus.CREATED)
  async createRecording(
    @Body() dto: M21UploadRecordingDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21RecordingResponseDto> {
    return this.observationsService.createRecording(dto, req.userWithPermissions!);
  }

  /**
   * POST /observations/recordings/:id/complete
   * Complete the upload by updating file metadata
   */
  @Post('recordings/:id/complete')
  @HttpCode(HttpStatus.OK)
  async completeUpload(
    @Param('id') id: string,
    @Body() dto: M21CompleteUploadDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21RecordingResponseDto> {
    return this.observationsService.completeUpload(id, dto, req.userWithPermissions!);
  }

  /**
   * PATCH /observations/recordings/:id
   * Update a recording
   */
  @Patch('recordings/:id')
  async updateRecording(
    @Param('id') id: string,
    @Body() dto: M21UpdateRecordingDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21RecordingResponseDto> {
    return this.observationsService.updateRecording(id, dto, req.userWithPermissions!);
  }

  /**
   * POST /observations/recordings/upload
   * Direct file upload endpoint using FileInterceptor
   * Max file size: 500MB, accepts video/audio files
   */
  @Post('recordings/upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadRecordingFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 500 * 1024 * 1024 }), // 500MB
          new FileTypeValidator({ fileType: /(video|audio)\/(mp4|webm|ogg|mpeg|wav)/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: M21UploadRecordingDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21RecordingResponseDto> {
    // Create the recording record first
    const result = await this.observationsService.createRecording(dto, req.userWithPermissions!);

    // TODO: Upload file to S3 and update the recording with actual file details
    // For now, this is a stub that just creates the recording record
    // The actual S3 upload would be implemented using the storage bucket credentials

    return {
      ...result,
      message: 'Recording created. File upload to S3 pending implementation.',
    };
  }

  // ============================================================================
  // ANNOTATIONS
  // ============================================================================

  /**
   * GET /observations/annotations
   * List annotations with pagination and filters
   */
  @Get('annotations')
  async listAnnotations(
    @Query() query: M21ListAnnotationsQueryDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21AnnotationsResponseDto> {
    return this.observationsService.listAnnotations(query, req.userWithPermissions!);
  }

  /**
   * GET /observations/recordings/:recordingId/annotations
   * List annotations for a specific recording
   */
  @Get('recordings/:recordingId/annotations')
  async listRecordingAnnotations(
    @Param('recordingId') recordingId: string,
    @Query() query: M21ListAnnotationsQueryDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21AnnotationsResponseDto> {
    return this.observationsService.listAnnotations(
      { ...query, observation_recording_id: recordingId },
      req.userWithPermissions!,
    );
  }

  /**
   * POST /observations/annotations
   * Create a new annotation
   */
  @Post('annotations')
  @HttpCode(HttpStatus.CREATED)
  async createAnnotation(
    @Body() dto: M21CreateAnnotationDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21AnnotationResponseDto> {
    return this.observationsService.createAnnotation(dto, req.userWithPermissions!);
  }

  /**
   * PATCH /observations/annotations/:id
   * Update an annotation
   */
  @Patch('annotations/:id')
  async updateAnnotation(
    @Param('id') id: string,
    @Body() dto: M21UpdateAnnotationDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21AnnotationResponseDto> {
    return this.observationsService.updateAnnotation(id, dto, req.userWithPermissions!);
  }

  // ============================================================================
  // REVIEW PROGRESS
  // ============================================================================

  /**
   * GET /observations/review-progress
   * List review progress with pagination and filters
   */
  @Get('review-progress')
  async listReviewProgress(
    @Query() query: M21ListReviewProgressQueryDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21ReviewProgressListResponseDto> {
    return this.observationsService.listReviewProgress(query, req.userWithPermissions!);
  }

  /**
   * GET /observations/recordings/:recordingId/review-progress
   * List review progress for a specific recording
   */
  @Get('recordings/:recordingId/review-progress')
  async listRecordingReviewProgress(
    @Param('recordingId') recordingId: string,
    @Query() query: M21ListReviewProgressQueryDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21ReviewProgressListResponseDto> {
    return this.observationsService.listReviewProgress(
      { ...query, observation_recording_id: recordingId },
      req.userWithPermissions!,
    );
  }

  /**
   * POST /observations/review-progress
   * Create or update review progress (upsert)
   */
  @Post('review-progress')
  @HttpCode(HttpStatus.OK)
  async upsertReviewProgress(
    @Body() dto: M21UpsertReviewProgressDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21ReviewProgressResponseDto> {
    return this.observationsService.upsertReviewProgress(dto, req.userWithPermissions!);
  }

  /**
   * PATCH /observations/review-progress/:id
   * Update review progress
   */
  @Patch('review-progress/:id')
  async updateReviewProgress(
    @Param('id') id: string,
    @Body() dto: M21UpdateReviewProgressDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21ReviewProgressResponseDto> {
    return this.observationsService.updateReviewProgress(id, dto, req.userWithPermissions!);
  }
}

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
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../m01/auth/jwt-auth.guard';
import { M21ObservationsGuard, M21ObservationsRequest } from '../guards/m21-observations.guard';
import { ObservationsService } from './observations.service';
import { UploadService, M21PresignedUrlResponse } from './upload.service';
import { TranscriptionService } from './transcription.service';
import { AnalysisService } from './analysis.service';
import {
  M21UploadRecordingDto,
  M21UpdateRecordingDto,
  M21CompleteUploadDto,
  M21RecordingsResponseDto,
  M21RecordingResponseDto,
  M21ListRecordingsQueryDto,
} from '../dto/upload-recording.dto';
import {
  M21RequestTranscriptionDto,
  M21TranscriptResponseDto,
  M21TranscriptionJobResponseDto,
} from '../dto/transcription.dto';
import {
  M21RequestAnalysisDto,
  M21AiReportResponseDto,
  M21AnalysisJobResponseDto,
} from '../dto/analysis.dto';

/**
 * DTO for generating a presigned URL
 */
export class M21GeneratePresignedUrlDto {
  storage_bucket_id!: string;
  class_id!: string;
  filename!: string;
  mime_type!: string;
  file_size_bytes?: number;
}

/**
 * Response DTO for presigned URL endpoint
 */
export interface M21PresignedUrlResponseDto {
  presigned_url: M21PresignedUrlResponse;
  message: string;
}

/**
 * Controller for M21 Recording operations
 * Handles recording uploads, metadata, listing, and status updates
 * 
 * All endpoints require JWT authentication and M21 role permissions
 * (admin_nacional, supervisor_pedagogico, observador, revisor)
 * 
 * Endpoints:
 * - GET /m21/recordings - List recordings with offset pagination
 * - GET /m21/recordings/:id - Get a single recording
 * - POST /m21/recordings - Create recording metadata and get presigned URL
 * - POST /m21/recordings/:id/complete - Complete upload with file metadata
 * - POST /m21/recordings/upload - Direct multipart file upload
 * - POST /m21/recordings/presigned-url - Generate presigned URL for upload
 * - PATCH /m21/recordings/:id - Update recording metadata/status
 */
@Controller('m21/recordings')
@UseGuards(JwtAuthGuard, M21ObservationsGuard)
export class RecordingsController {
  constructor(
    private readonly observationsService: ObservationsService,
    private readonly uploadService: UploadService,
    private readonly transcriptionService: TranscriptionService,
    private readonly analysisService: AnalysisService,
  ) {}

  // ============================================================================
  // LIST & GET RECORDINGS
  // ============================================================================

  /**
   * GET /m21/recordings
   * List all recordings with offset pagination and filters
   * 
   * Query parameters:
   * - offset: Number of records to skip (default: 0)
   * - limit: Maximum records to return (default: 20, max: 100)
   * - class_id: Filter by classroom ID
   * - teacher_id: Filter by teacher ID
   * - observer_id: Filter by observer ID
   * - status: Filter by recording status
   */
  @Get()
  async listRecordings(
    @Query() query: M21ListRecordingsQueryDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21RecordingsResponseDto> {
    return this.observationsService.listRecordings(query, req.userWithPermissions!);
  }

  /**
   * GET /m21/recordings/:id
   * Get a single recording by ID
   */
  @Get(':id')
  async getRecording(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21RecordingResponseDto> {
    return this.observationsService.getRecording(id, req.userWithPermissions!);
  }

  // ============================================================================
  // CREATE & UPLOAD RECORDINGS
  // ============================================================================

  /**
   * POST /m21/recordings
   * Create a new recording (initiate upload)
   * 
   * This endpoint:
   * 1. Validates metadata FKs (class_id, teacher_id)
   * 2. Creates a recording record in 'uploading' status
   * 3. Returns a presigned URL for direct S3 upload
   * 
   * After uploading to S3, call POST /m21/recordings/:id/complete
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRecording(
    @Body() dto: M21UploadRecordingDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21RecordingResponseDto> {
    return this.observationsService.createRecording(dto, req.userWithPermissions!);
  }

  /**
   * POST /m21/recordings/presigned-url
   * Generate a presigned URL for uploading to S3
   * 
   * This is a standalone endpoint for clients that want to:
   * 1. Get a presigned URL first
   * 2. Upload the file directly to S3
   * 3. Then create the recording metadata
   */
  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  async generatePresignedUrl(
    @Body() dto: M21GeneratePresignedUrlDto,
    @Req() _req: M21ObservationsRequest,
  ): Promise<M21PresignedUrlResponseDto> {
    const presignedUrl = await this.uploadService.generatePresignedUrl({
      storage_bucket_id: dto.storage_bucket_id,
      class_id: dto.class_id,
      filename: dto.filename,
      mime_type: dto.mime_type,
      file_size_bytes: dto.file_size_bytes,
    });

    return {
      presigned_url: presignedUrl,
      message: 'Presigned URL generated successfully. URL expires in ' +
        `${presignedUrl.expires_in_seconds} seconds.`,
    };
  }

  /**
   * POST /m21/recordings/:id/complete
   * Complete the upload by updating file metadata
   * 
   * Called after the client has uploaded the file directly to S3
   * Updates the recording with:
   * - Actual file_key
   * - MIME type
   * - File size
   * - Duration (optional)
   * - Sets status to 'processing'
   */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async completeUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: M21CompleteUploadDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21RecordingResponseDto> {
    return this.observationsService.completeUpload(id, dto, req.userWithPermissions!);
  }

  /**
   * POST /m21/recordings/upload
   * Direct file upload endpoint using multipart/form-data
   * 
   * This endpoint accepts the file directly and:
   * 1. Validates file size (max 500MB) and type (video/audio)
   * 2. Creates the recording record
   * 3. Uploads to S3 (stub implementation)
   * 
   * Max file size: 500MB
   * Accepted types: video/mp4, video/webm, audio/mpeg, audio/wav, etc.
   */
  @Post('upload')
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

    // STUB: In production, upload file to S3 using uploadService
    // const credentials = await this.uploadService.getBucketCredentials(dto.storage_bucket_id);
    // await this.uploadToS3(credentials, file, result.recording.file_key);

    // Update recording with actual file details
    if (result.recording && file) {
      await this.uploadService.completeUpload(result.recording.id, {
        file_key: result.recording.file_key,
        mime_type: file.mimetype,
        file_size_bytes: file.size,
      });
    }

    return {
      ...result,
      message: 'Recording created and file uploaded successfully (stub S3).',
    };
  }

  // ============================================================================
  // UPDATE RECORDINGS
  // ============================================================================

  /**
   * PATCH /m21/recordings/:id
   * Update a recording's metadata or status
   * 
   * Updatable fields:
   * - status: Recording status (uploading, processing, ready, etc.)
   * - duration_seconds: Duration of the recording
   * - metadata: Additional metadata JSON
   * - observer_id: Observer who recorded
   */
  @Patch(':id')
  async updateRecording(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: M21UpdateRecordingDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21RecordingResponseDto> {
    return this.observationsService.updateRecording(id, dto, req.userWithPermissions!);
  }

  /**
   * PATCH /m21/recordings/:id/status
   * Quick endpoint to update only the recording status
   * 
   * Useful for processing pipelines to update status without
   * needing to send full update payload
   */
  @Patch(':id/status')
  async updateRecordingStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { status: string },
    @Req() req: M21ObservationsRequest,
  ): Promise<M21RecordingResponseDto> {
    return this.observationsService.updateRecording(id, { status: dto.status as any }, req.userWithPermissions!);
  }

  // ============================================================================
  // TRANSCRIPTION
  // ============================================================================

  /**
   * POST /m21/recordings/:id/transcribe
   * Queue a transcription job for a recording
   * 
   * This endpoint:
   * 1. Validates the recording exists and is in a transcribable state
   * 2. Updates the recording status to 'transcribing'
   * 3. Queues a BullMQ job for async transcription
   * 4. Returns the job status
   * 
   * The recording must be in 'ready' or 'completed' status
   */
  @Post(':id/transcribe')
  @HttpCode(HttpStatus.ACCEPTED)
  async queueTranscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: M21RequestTranscriptionDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21TranscriptionJobResponseDto> {
    return this.transcriptionService.queueTranscription(id, dto, req.userWithPermissions!);
  }

  /**
   * GET /m21/recordings/:id/transcript
   * Get the transcript for a recording
   * 
   * Returns the full transcript with segments if transcription has completed
   * Throws 404 if transcript doesn't exist yet
   */
  @Get(':id/transcript')
  async getTranscript(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21TranscriptResponseDto> {
    return this.transcriptionService.getTranscript(id, req.userWithPermissions!);
  }

  /**
   * GET /m21/recordings/:id/transcription-status
   * Get the status of a transcription job
   * 
   * Returns the current status of the transcription:
   * - pending: Not started
   * - processing: In progress
   * - completed: Transcript available
   * - failed: Transcription failed
   */
  @Get(':id/transcription-status')
  async getTranscriptionStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21TranscriptionJobResponseDto> {
    return this.transcriptionService.getTranscriptionStatus(id, req.userWithPermissions!);
  }

  // ============================================================================
  // AI ANALYSIS
  // ============================================================================

  /**
   * POST /m21/recordings/:id/analyze
   * Queue an AI analysis job for a recording
   * 
   * This endpoint:
   * 1. Validates the recording exists and is in an analyzable state
   * 2. Updates the recording status to 'analyzing'
   * 3. Queues a BullMQ job for async AI analysis
   * 4. Returns the job status
   * 
   * The recording must be in 'ready', 'completed', or 'transcribing' status
   * 
   * Analysis generates:
   * - Teacher score (0-100)
   * - Engagement score (0-100)
   * - Insights with recommendations
   */
  @Post(':id/analyze')
  @HttpCode(HttpStatus.ACCEPTED)
  async queueAnalysis(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: M21RequestAnalysisDto,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21AnalysisJobResponseDto> {
    return this.analysisService.queueAnalysis(id, dto, req.userWithPermissions!);
  }

  /**
   * GET /m21/recordings/:id/report
   * Get the AI analysis report for a recording
   * 
   * Returns the full AI report with:
   * - teacher_score: Overall teaching effectiveness score (0-100)
   * - engagement_score: Student engagement score (0-100)
   * - insights: Array of categorized insights with recommendations
   * 
   * Throws 404 if report doesn't exist yet
   */
  @Get(':id/report')
  async getReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21AiReportResponseDto> {
    return this.analysisService.getReport(id, req.userWithPermissions!);
  }

  /**
   * GET /m21/recordings/:id/analysis-status
   * Get the status of an AI analysis job
   * 
   * Returns the current status of the analysis:
   * - pending: Not started
   * - processing: In progress
   * - completed: Report available
   * - failed: Analysis failed
   */
  @Get(':id/analysis-status')
  async getAnalysisStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: M21ObservationsRequest,
  ): Promise<M21AnalysisJobResponseDto> {
    return this.analysisService.getAnalysisStatus(id, req.userWithPermissions!);
  }
}

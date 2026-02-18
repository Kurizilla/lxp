import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CryptoService } from '../../common/crypto';
import { M21AbilityFactory, M21UserWithPermissions } from '../casl/m21-ability.factory';
import {
  M21CreateAnnotationDto,
  M21UpdateAnnotationDto,
  M21AnnotationDto,
  M21AnnotationsResponseDto,
  M21AnnotationResponseDto,
  M21ListAnnotationsQueryDto,
} from '../dto/annotation.dto';
import {
  M21UpdateReviewProgressDto,
  M21ReviewProgressDto,
  M21ReviewProgressResponseDto,
} from '../dto/review-progress.dto';

/**
 * Signed playback URL response for secure video streaming
 */
export interface M21SignedPlaybackUrlResponse {
  playback_url: string;
  file_key: string;
  expires_in_seconds: number;
  s3_bucket: string;
  s3_region: string;
  mime_type: string;
  recording_id: string;
}

/**
 * Response DTO for playback URL endpoint
 */
export interface M21PlaybackUrlResponseDto {
  playback: M21SignedPlaybackUrlResponse;
  message: string;
}

/**
 * Service for handling review operations including:
 * - Signed S3 URLs for secure playback
 * - Annotations with timestamps
 * - Review progress tracking
 * 
 * NOTE: S3 signed URL generation is a stub implementation.
 * In production, this would integrate with AWS S3 SDK.
 */
@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);
  private readonly DEFAULT_PLAYBACK_URL_EXPIRY = 3600; // 1 hour
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly abilityFactory: M21AbilityFactory,
  ) {}

  // ============================================================================
  // SIGNED PLAYBACK URLS
  // ============================================================================

  /**
   * Generate a signed URL for secure video/audio playback
   * 
   * @param recordingId - The recording ID
   * @param userWithPermissions - User requesting the playback URL
   * @returns Signed playback URL response
   * 
   * STUB: Returns a mock signed URL. In production, this would:
   * 1. Decrypt bucket credentials
   * 2. Use AWS S3 SDK to generate a presigned GET URL
   * 3. Return the URL with proper expiration
   */
  async generatePlaybackUrl(
    recordingId: string,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21PlaybackUrlResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view recordings',
      });
    }

    // Get recording with storage bucket info
    const recording = await this.prisma.m21_observation_recordings.findUnique({
      where: { id: recordingId },
      include: {
        storage_bucket: true,
      },
    });

    if (!recording) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Recording with ID ${recordingId} not found`,
      });
    }

    // Recording must be in a playable state
    const playableStates = ['ready', 'transcribing', 'analyzing', 'completed'];
    if (!playableStates.includes(recording.status)) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: `Recording is not ready for playback. Current status: ${recording.status}`,
      });
    }

    // Validate storage bucket is active
    if (!recording.storage_bucket.is_active) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Storage bucket is inactive',
      });
    }

    // STUB: Generate signed playback URL
    const signedUrl = this.generateStubSignedPlaybackUrl(
      recording.storage_bucket.s3_bucket,
      recording.storage_bucket.s3_region,
      recording.file_key,
    );

    this.logger.log(
      `Generated signed playback URL for recording ${recordingId} by user ${userWithPermissions.email}`,
    );

    return {
      playback: {
        playback_url: signedUrl,
        file_key: recording.file_key,
        expires_in_seconds: this.DEFAULT_PLAYBACK_URL_EXPIRY,
        s3_bucket: recording.storage_bucket.s3_bucket,
        s3_region: recording.storage_bucket.s3_region,
        mime_type: recording.mime_type,
        recording_id: recording.id,
      },
      message: `Signed playback URL generated. Expires in ${this.DEFAULT_PLAYBACK_URL_EXPIRY} seconds.`,
    };
  }

  // ============================================================================
  // ANNOTATIONS WITH TIMESTAMPS
  // ============================================================================

  /**
   * Get annotations for a recording with timestamp ordering
   * Returns annotations sorted by timestamp_seconds for timeline display
   */
  async getRecordingAnnotations(
    recordingId: string,
    query: M21ListAnnotationsQueryDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21AnnotationsResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'Annotation')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view annotations',
      });
    }

    // Validate recording exists
    const recording = await this.prisma.m21_observation_recordings.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Recording with ID ${recordingId} not found`,
      });
    }

    const offset = query.offset || 0;
    const limit = Math.min(query.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);

    const whereClause: Record<string, unknown> = {
      observation_recording_id: recordingId,
    };
    if (query.reviewer_id) whereClause.reviewer_id = query.reviewer_id;
    if (query.is_ai_suggestion !== undefined) {
      whereClause.is_ai_suggestion = query.is_ai_suggestion;
    }

    const [annotations, total] = await Promise.all([
      this.prisma.m21_annotations.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: { timestamp_seconds: 'asc' },
      }),
      this.prisma.m21_annotations.count({ where: whereClause }),
    ]);

    const annotationDtos: M21AnnotationDto[] = annotations.map((ann) => ({
      id: ann.id,
      observation_recording_id: ann.observation_recording_id,
      reviewer_id: ann.reviewer_id,
      timestamp_seconds: ann.timestamp_seconds,
      text: ann.text,
      is_ai_suggestion: ann.is_ai_suggestion,
      created_at: ann.created_at,
      updated_at: ann.updated_at,
    }));

    this.logger.log(
      `Listed ${annotations.length} annotations for recording ${recordingId} by user ${userWithPermissions.email}`,
    );

    return {
      annotations: annotationDtos,
      total,
      offset,
      limit,
    };
  }

  /**
   * Create a timestamped annotation on a recording
   * Validates that timestamp is within recording duration if known
   */
  async createTimestampedAnnotation(
    recordingId: string,
    dto: M21CreateAnnotationDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21AnnotationResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('create', 'Annotation')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to create annotations',
      });
    }

    // Validate recording exists
    const recording = await this.prisma.m21_observation_recordings.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Recording with ID ${recordingId} not found`,
      });
    }

    // Validate timestamp is within recording duration if duration is known
    if (recording.duration_seconds && dto.timestamp_seconds > recording.duration_seconds) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: `Timestamp ${dto.timestamp_seconds}s exceeds recording duration of ${recording.duration_seconds}s`,
      });
    }

    const annotation = await this.prisma.m21_annotations.create({
      data: {
        observation_recording_id: recordingId,
        reviewer_id: userWithPermissions.id,
        timestamp_seconds: dto.timestamp_seconds,
        text: dto.text,
        is_ai_suggestion: dto.is_ai_suggestion || false,
      },
    });

    this.logger.log(
      `Created annotation ${annotation.id} at ${dto.timestamp_seconds}s for recording ${recordingId} by user ${userWithPermissions.email}`,
    );

    return {
      annotation: {
        id: annotation.id,
        observation_recording_id: annotation.observation_recording_id,
        reviewer_id: annotation.reviewer_id,
        timestamp_seconds: annotation.timestamp_seconds,
        text: annotation.text,
        is_ai_suggestion: annotation.is_ai_suggestion,
        created_at: annotation.created_at,
        updated_at: annotation.updated_at,
      },
      message: `Annotation created at ${this.formatTimestamp(dto.timestamp_seconds)}`,
    };
  }

  /**
   * Update a timestamped annotation
   * Validates timestamp constraint if being updated
   */
  async updateTimestampedAnnotation(
    annotationId: string,
    dto: M21UpdateAnnotationDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21AnnotationResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('update', 'Annotation')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to update annotations',
      });
    }

    // Get existing annotation with recording info
    const existing = await this.prisma.m21_annotations.findUnique({
      where: { id: annotationId },
      include: {
        observation_recording: true,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Annotation with ID ${annotationId} not found`,
      });
    }

    // Validate timestamp if being updated and recording has duration
    if (
      dto.timestamp_seconds !== undefined &&
      existing.observation_recording.duration_seconds &&
      dto.timestamp_seconds > existing.observation_recording.duration_seconds
    ) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: `Timestamp ${dto.timestamp_seconds}s exceeds recording duration of ${existing.observation_recording.duration_seconds}s`,
      });
    }

    const updateData: Record<string, unknown> = {};
    if (dto.timestamp_seconds !== undefined) {
      updateData.timestamp_seconds = dto.timestamp_seconds;
    }
    if (dto.text !== undefined) {
      updateData.text = dto.text;
    }

    const annotation = await this.prisma.m21_annotations.update({
      where: { id: annotationId },
      data: updateData,
    });

    this.logger.log(
      `Updated annotation ${annotationId} by user ${userWithPermissions.email}`,
    );

    return {
      annotation: {
        id: annotation.id,
        observation_recording_id: annotation.observation_recording_id,
        reviewer_id: annotation.reviewer_id,
        timestamp_seconds: annotation.timestamp_seconds,
        text: annotation.text,
        is_ai_suggestion: annotation.is_ai_suggestion,
        created_at: annotation.created_at,
        updated_at: annotation.updated_at,
      },
      message: 'Annotation updated successfully',
    };
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(
    annotationId: string,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<{ message: string }> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('delete', 'Annotation') && !ability.can('manage', 'Annotation')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to delete annotations',
      });
    }

    const existing = await this.prisma.m21_annotations.findUnique({
      where: { id: annotationId },
    });

    if (!existing) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Annotation with ID ${annotationId} not found`,
      });
    }

    await this.prisma.m21_annotations.delete({
      where: { id: annotationId },
    });

    this.logger.log(
      `Deleted annotation ${annotationId} by user ${userWithPermissions.email}`,
    );

    return { message: 'Annotation deleted successfully' };
  }

  // ============================================================================
  // REVIEW PROGRESS PATCH
  // ============================================================================

  /**
   * Update review progress for a recording
   * Allows reviewers to track their progress through the video
   */
  async patchReviewProgress(
    progressId: string,
    dto: M21UpdateReviewProgressDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21ReviewProgressResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('update', 'ReviewProgress') && !ability.can('manage', 'ReviewProgress')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to update review progress',
      });
    }

    const existing = await this.prisma.m21_review_progress.findUnique({
      where: { id: progressId },
    });

    if (!existing) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Review progress with ID ${progressId} not found`,
      });
    }

    const updateData: Record<string, unknown> = {};
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.progress_percentage !== undefined) {
      updateData.progress_percentage = dto.progress_percentage;
    }

    const progress = await this.prisma.m21_review_progress.update({
      where: { id: progressId },
      data: updateData,
    });

    this.logger.log(
      `Updated review progress ${progressId} to ${progress.progress_percentage}% by user ${userWithPermissions.email}`,
    );

    return {
      review_progress: {
        id: progress.id,
        observation_recording_id: progress.observation_recording_id,
        reviewer_id: progress.reviewer_id,
        status: progress.status as M21ReviewProgressDto['status'],
        progress_percentage: progress.progress_percentage,
        created_at: progress.created_at,
        updated_at: progress.updated_at,
      },
      message: `Review progress updated to ${progress.progress_percentage}%`,
    };
  }

  /**
   * Get current user's review progress for a recording
   */
  async getMyReviewProgress(
    recordingId: string,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21ReviewProgressResponseDto | null> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ReviewProgress')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view review progress',
      });
    }

    const progress = await this.prisma.m21_review_progress.findUnique({
      where: {
        observation_recording_id_reviewer_id: {
          observation_recording_id: recordingId,
          reviewer_id: userWithPermissions.id,
        },
      },
    });

    if (!progress) {
      return null;
    }

    return {
      review_progress: {
        id: progress.id,
        observation_recording_id: progress.observation_recording_id,
        reviewer_id: progress.reviewer_id,
        status: progress.status as M21ReviewProgressDto['status'],
        progress_percentage: progress.progress_percentage,
        created_at: progress.created_at,
        updated_at: progress.updated_at,
      },
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Generate a stub signed URL for video playback
   * 
   * @param bucket - S3 bucket name
   * @param region - S3 region
   * @param fileKey - File key/path
   * @returns Stub signed URL
   * 
   * STUB: In production, this would use AWS S3 SDK:
   * const s3 = new S3Client({ region, credentials: {...} });
   * const command = new GetObjectCommand({ Bucket: bucket, Key: fileKey });
   * const signedUrl = await getSignedUrl(s3, command, { expiresIn: this.DEFAULT_PLAYBACK_URL_EXPIRY });
   */
  private generateStubSignedPlaybackUrl(
    bucket: string,
    region: string,
    fileKey: string,
  ): string {
    const stubSignature = Buffer.from(`stub-playback-signature-${Date.now()}`)
      .toString('base64')
      .slice(0, 40);
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = new Date().toISOString().replace(/[:-]/g, '').slice(0, 15) + 'Z';

    return (
      `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}?` +
      `X-Amz-Algorithm=AWS4-HMAC-SHA256&` +
      `X-Amz-Credential=STUB_ACCESS_KEY%2F${dateStamp}%2F${region}%2Fs3%2Faws4_request&` +
      `X-Amz-Date=${amzDate}&` +
      `X-Amz-Expires=${this.DEFAULT_PLAYBACK_URL_EXPIRY}&` +
      `X-Amz-SignedHeaders=host&` +
      `X-Amz-Signature=${stubSignature}`
    );
  }

  /**
   * Format timestamp in seconds to human-readable format (MM:SS or HH:MM:SS)
   */
  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

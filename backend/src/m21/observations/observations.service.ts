import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma';
import { M21AbilityFactory, M21UserWithPermissions } from '../casl/m21-ability.factory';
import {
  M21UpsertBucketDto,
  M21UpdateBucketDto,
  M21StorageBucketDto,
  M21StorageBucketsResponseDto,
  M21StorageBucketResponseDto,
  M21ListBucketsQueryDto,
} from '../dto/upsert-bucket.dto';
import {
  M21UploadRecordingDto,
  M21UpdateRecordingDto,
  M21CompleteUploadDto,
  M21RecordingDto,
  M21RecordingsResponseDto,
  M21RecordingResponseDto,
  M21ListRecordingsQueryDto,
  M21RecordingStatus,
} from '../dto/upload-recording.dto';
import {
  M21CreateAnnotationDto,
  M21UpdateAnnotationDto,
  M21AnnotationDto,
  M21AnnotationsResponseDto,
  M21AnnotationResponseDto,
  M21ListAnnotationsQueryDto,
} from '../dto/annotation.dto';
import {
  M21UpsertReviewProgressDto,
  M21UpdateReviewProgressDto,
  M21ReviewProgressDto,
  M21ReviewProgressListResponseDto,
  M21ReviewProgressResponseDto,
  M21ListReviewProgressQueryDto,
} from '../dto/review-progress.dto';

/**
 * Pagination parameters
 */
export interface PaginationParams {
  offset?: number;
  limit?: number;
}

/**
 * Service for M21 Observations module operations
 * Handles storage buckets, recordings, annotations, and review progress
 */
@Injectable()
export class ObservationsService {
  private readonly logger = new Logger(ObservationsService.name);
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: M21AbilityFactory,
  ) {}

  // ============================================================================
  // STORAGE BUCKETS
  // ============================================================================

  /**
   * List storage buckets with pagination and filters
   */
  async listBuckets(
    query: M21ListBucketsQueryDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21StorageBucketsResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'StorageBucket')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view storage buckets',
      });
    }

    const offset = query.offset || 0;
    const limit = Math.min(query.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);

    const whereClause: Record<string, unknown> = {};
    if (query.is_active !== undefined) {
      whereClause.is_active = query.is_active;
    }
    if (query.created_by_id) {
      whereClause.created_by_id = query.created_by_id;
    }

    const [buckets, total] = await Promise.all([
      this.prisma.m21_storage_buckets.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.m21_storage_buckets.count({ where: whereClause }),
    ]);

    const bucketDtos: M21StorageBucketDto[] = buckets.map((bucket) => ({
      id: bucket.id,
      name: bucket.name,
      s3_bucket: bucket.s3_bucket,
      s3_region: bucket.s3_region,
      is_active: bucket.is_active,
      created_by_id: bucket.created_by_id,
      created_at: bucket.created_at,
      updated_at: bucket.updated_at,
    }));

    this.logger.log(`Listed ${buckets.length} storage buckets for user ${userWithPermissions.email}`);

    return {
      buckets: bucketDtos,
      total,
      offset,
      limit,
    };
  }

  /**
   * Get a single storage bucket by ID
   */
  async getBucket(
    id: string,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21StorageBucketResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'StorageBucket')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view storage buckets',
      });
    }

    const bucket = await this.prisma.m21_storage_buckets.findUnique({
      where: { id },
    });

    if (!bucket) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Storage bucket with ID ${id} not found`,
      });
    }

    return {
      bucket: {
        id: bucket.id,
        name: bucket.name,
        s3_bucket: bucket.s3_bucket,
        s3_region: bucket.s3_region,
        is_active: bucket.is_active,
        created_by_id: bucket.created_by_id,
        created_at: bucket.created_at,
        updated_at: bucket.updated_at,
      },
    };
  }

  /**
   * Create a new storage bucket
   */
  async createBucket(
    dto: M21UpsertBucketDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21StorageBucketResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('create', 'StorageBucket')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to create storage buckets',
      });
    }

    // Check for duplicate name
    const existing = await this.prisma.m21_storage_buckets.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException({
        type: 'https://httpstatuses.com/409',
        title: 'Conflict',
        status: 409,
        detail: `Storage bucket with name '${dto.name}' already exists`,
      });
    }

    // TODO: Encrypt access_key and secret_key before storing
    // For now, storing as-is (stub implementation)
    const bucket = await this.prisma.m21_storage_buckets.create({
      data: {
        name: dto.name,
        s3_bucket: dto.s3_bucket,
        s3_region: dto.s3_region,
        access_key_encrypted: dto.access_key, // TODO: encrypt
        secret_key_encrypted: dto.secret_key, // TODO: encrypt
        is_active: dto.is_active ?? true,
        created_by_id: userWithPermissions.id,
      },
    });

    this.logger.log(`Created storage bucket ${bucket.id} by user ${userWithPermissions.email}`);

    return {
      bucket: {
        id: bucket.id,
        name: bucket.name,
        s3_bucket: bucket.s3_bucket,
        s3_region: bucket.s3_region,
        is_active: bucket.is_active,
        created_by_id: bucket.created_by_id,
        created_at: bucket.created_at,
        updated_at: bucket.updated_at,
      },
      message: 'Storage bucket created successfully',
    };
  }

  /**
   * Update an existing storage bucket
   */
  async updateBucket(
    id: string,
    dto: M21UpdateBucketDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21StorageBucketResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('update', 'StorageBucket')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to update storage buckets',
      });
    }

    const existing = await this.prisma.m21_storage_buckets.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Storage bucket with ID ${id} not found`,
      });
    }

    // Check for duplicate name if updating name
    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.m21_storage_buckets.findUnique({
        where: { name: dto.name },
      });
      if (duplicate) {
        throw new ConflictException({
          type: 'https://httpstatuses.com/409',
          title: 'Conflict',
          status: 409,
          detail: `Storage bucket with name '${dto.name}' already exists`,
        });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.s3_bucket !== undefined) updateData.s3_bucket = dto.s3_bucket;
    if (dto.s3_region !== undefined) updateData.s3_region = dto.s3_region;
    if (dto.access_key !== undefined) updateData.access_key_encrypted = dto.access_key; // TODO: encrypt
    if (dto.secret_key !== undefined) updateData.secret_key_encrypted = dto.secret_key; // TODO: encrypt
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

    const bucket = await this.prisma.m21_storage_buckets.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Updated storage bucket ${bucket.id} by user ${userWithPermissions.email}`);

    return {
      bucket: {
        id: bucket.id,
        name: bucket.name,
        s3_bucket: bucket.s3_bucket,
        s3_region: bucket.s3_region,
        is_active: bucket.is_active,
        created_by_id: bucket.created_by_id,
        created_at: bucket.created_at,
        updated_at: bucket.updated_at,
      },
      message: 'Storage bucket updated successfully',
    };
  }

  // ============================================================================
  // OBSERVATION RECORDINGS
  // ============================================================================

  /**
   * List observation recordings with pagination and filters
   */
  async listRecordings(
    query: M21ListRecordingsQueryDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21RecordingsResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view recordings',
      });
    }

    const offset = query.offset || 0;
    const limit = Math.min(query.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);

    const whereClause: Record<string, unknown> = {};
    if (query.class_id) whereClause.class_id = query.class_id;
    if (query.teacher_id) whereClause.teacher_id = query.teacher_id;
    if (query.observer_id) whereClause.observer_id = query.observer_id;
    if (query.status) whereClause.status = query.status;

    const [recordings, total] = await Promise.all([
      this.prisma.m21_observation_recordings.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.m21_observation_recordings.count({ where: whereClause }),
    ]);

    const recordingDtos: M21RecordingDto[] = recordings.map((rec) => ({
      id: rec.id,
      storage_bucket_id: rec.storage_bucket_id,
      class_id: rec.class_id,
      teacher_id: rec.teacher_id,
      observer_id: rec.observer_id,
      session_date: rec.session_date,
      file_key: rec.file_key,
      mime_type: rec.mime_type,
      duration_seconds: rec.duration_seconds,
      file_size_bytes: rec.file_size_bytes?.toString() || null,
      status: rec.status as M21RecordingStatus,
      metadata: rec.metadata as Record<string, unknown> | null,
      created_at: rec.created_at,
      updated_at: rec.updated_at,
    }));

    this.logger.log(`Listed ${recordings.length} recordings for user ${userWithPermissions.email}`);

    return {
      recordings: recordingDtos,
      total,
      offset,
      limit,
    };
  }

  /**
   * Get a single recording by ID
   */
  async getRecording(
    id: string,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21RecordingResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view recordings',
      });
    }

    const recording = await this.prisma.m21_observation_recordings.findUnique({
      where: { id },
    });

    if (!recording) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Recording with ID ${id} not found`,
      });
    }

    return {
      recording: {
        id: recording.id,
        storage_bucket_id: recording.storage_bucket_id,
        class_id: recording.class_id,
        teacher_id: recording.teacher_id,
        observer_id: recording.observer_id,
        session_date: recording.session_date,
        file_key: recording.file_key,
        mime_type: recording.mime_type,
        duration_seconds: recording.duration_seconds,
        file_size_bytes: recording.file_size_bytes?.toString() || null,
        status: recording.status as M21RecordingStatus,
        metadata: recording.metadata as Record<string, unknown> | null,
        created_at: recording.created_at,
        updated_at: recording.updated_at,
      },
    };
  }

  /**
   * Create a new recording (initiate upload)
   */
  async createRecording(
    dto: M21UploadRecordingDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21RecordingResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('create', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to create recordings',
      });
    }

    // Validate storage bucket exists
    const bucket = await this.prisma.m21_storage_buckets.findUnique({
      where: { id: dto.storage_bucket_id },
    });

    if (!bucket || !bucket.is_active) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid or inactive storage bucket',
      });
    }

    // Validate classroom exists
    const classroom = await this.prisma.m01_classrooms.findUnique({
      where: { id: dto.class_id },
    });

    if (!classroom) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid classroom ID',
      });
    }

    // Validate teacher exists
    const teacher = await this.prisma.m01_users.findUnique({
      where: { id: dto.teacher_id },
    });

    if (!teacher) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid teacher ID',
      });
    }

    // Generate a placeholder file key (will be updated after actual upload)
    const fileKey = `recordings/${dto.class_id}/${Date.now()}-placeholder`;

    const recording = await this.prisma.m21_observation_recordings.create({
      data: {
        storage_bucket_id: dto.storage_bucket_id,
        class_id: dto.class_id,
        teacher_id: dto.teacher_id,
        observer_id: dto.observer_id || userWithPermissions.id,
        session_date: new Date(dto.session_date),
        file_key: fileKey,
        mime_type: 'application/octet-stream', // Will be updated
        status: 'uploading',
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    this.logger.log(`Created recording ${recording.id} by user ${userWithPermissions.email}`);

    // TODO: Generate presigned URL for actual S3 upload
    const presignedUploadUrl = `https://${bucket.s3_bucket}.s3.${bucket.s3_region}.amazonaws.com/${fileKey}?presigned=stub`;

    return {
      recording: {
        id: recording.id,
        storage_bucket_id: recording.storage_bucket_id,
        class_id: recording.class_id,
        teacher_id: recording.teacher_id,
        observer_id: recording.observer_id,
        session_date: recording.session_date,
        file_key: recording.file_key,
        mime_type: recording.mime_type,
        duration_seconds: recording.duration_seconds,
        file_size_bytes: recording.file_size_bytes?.toString() || null,
        status: recording.status as M21RecordingStatus,
        metadata: recording.metadata as Record<string, unknown> | null,
        created_at: recording.created_at,
        updated_at: recording.updated_at,
      },
      message: 'Recording created. Use presigned URL to upload file.',
      presigned_upload_url: presignedUploadUrl,
    };
  }

  /**
   * Complete the upload by updating file metadata
   */
  async completeUpload(
    id: string,
    dto: M21CompleteUploadDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21RecordingResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('update', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to update recordings',
      });
    }

    const existing = await this.prisma.m21_observation_recordings.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Recording with ID ${id} not found`,
      });
    }

    if (existing.status !== 'uploading') {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Recording is not in uploading status',
      });
    }

    const recording = await this.prisma.m21_observation_recordings.update({
      where: { id },
      data: {
        file_key: dto.file_key,
        mime_type: dto.mime_type,
        file_size_bytes: BigInt(dto.file_size_bytes),
        duration_seconds: dto.duration_seconds,
        status: 'processing',
      },
    });

    this.logger.log(`Completed upload for recording ${recording.id} by user ${userWithPermissions.email}`);

    return {
      recording: {
        id: recording.id,
        storage_bucket_id: recording.storage_bucket_id,
        class_id: recording.class_id,
        teacher_id: recording.teacher_id,
        observer_id: recording.observer_id,
        session_date: recording.session_date,
        file_key: recording.file_key,
        mime_type: recording.mime_type,
        duration_seconds: recording.duration_seconds,
        file_size_bytes: recording.file_size_bytes?.toString() || null,
        status: recording.status as M21RecordingStatus,
        metadata: recording.metadata as Record<string, unknown> | null,
        created_at: recording.created_at,
        updated_at: recording.updated_at,
      },
      message: 'Upload completed successfully',
    };
  }

  /**
   * Update a recording
   */
  async updateRecording(
    id: string,
    dto: M21UpdateRecordingDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21RecordingResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('update', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to update recordings',
      });
    }

    const existing = await this.prisma.m21_observation_recordings.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Recording with ID ${id} not found`,
      });
    }

    const updateData: Record<string, unknown> = {};
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.duration_seconds !== undefined) updateData.duration_seconds = dto.duration_seconds;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;
    if (dto.observer_id !== undefined) updateData.observer_id = dto.observer_id;

    const recording = await this.prisma.m21_observation_recordings.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Updated recording ${recording.id} by user ${userWithPermissions.email}`);

    return {
      recording: {
        id: recording.id,
        storage_bucket_id: recording.storage_bucket_id,
        class_id: recording.class_id,
        teacher_id: recording.teacher_id,
        observer_id: recording.observer_id,
        session_date: recording.session_date,
        file_key: recording.file_key,
        mime_type: recording.mime_type,
        duration_seconds: recording.duration_seconds,
        file_size_bytes: recording.file_size_bytes?.toString() || null,
        status: recording.status as M21RecordingStatus,
        metadata: recording.metadata as Record<string, unknown> | null,
        created_at: recording.created_at,
        updated_at: recording.updated_at,
      },
      message: 'Recording updated successfully',
    };
  }

  // ============================================================================
  // ANNOTATIONS
  // ============================================================================

  /**
   * List annotations with pagination and filters
   */
  async listAnnotations(
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

    const offset = query.offset || 0;
    const limit = Math.min(query.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);

    const whereClause: Record<string, unknown> = {};
    if (query.observation_recording_id) whereClause.observation_recording_id = query.observation_recording_id;
    if (query.reviewer_id) whereClause.reviewer_id = query.reviewer_id;
    if (query.is_ai_suggestion !== undefined) whereClause.is_ai_suggestion = query.is_ai_suggestion;

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

    return {
      annotations: annotationDtos,
      total,
      offset,
      limit,
    };
  }

  /**
   * Create an annotation
   */
  async createAnnotation(
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
      where: { id: dto.observation_recording_id },
    });

    if (!recording) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid observation recording ID',
      });
    }

    const annotation = await this.prisma.m21_annotations.create({
      data: {
        observation_recording_id: dto.observation_recording_id,
        reviewer_id: userWithPermissions.id,
        timestamp_seconds: dto.timestamp_seconds,
        text: dto.text,
        is_ai_suggestion: dto.is_ai_suggestion || false,
      },
    });

    this.logger.log(`Created annotation ${annotation.id} by user ${userWithPermissions.email}`);

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
      message: 'Annotation created successfully',
    };
  }

  /**
   * Update an annotation
   */
  async updateAnnotation(
    id: string,
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

    const existing = await this.prisma.m21_annotations.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Annotation with ID ${id} not found`,
      });
    }

    const updateData: Record<string, unknown> = {};
    if (dto.timestamp_seconds !== undefined) updateData.timestamp_seconds = dto.timestamp_seconds;
    if (dto.text !== undefined) updateData.text = dto.text;

    const annotation = await this.prisma.m21_annotations.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Updated annotation ${annotation.id} by user ${userWithPermissions.email}`);

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

  // ============================================================================
  // REVIEW PROGRESS
  // ============================================================================

  /**
   * List review progress with pagination and filters
   */
  async listReviewProgress(
    query: M21ListReviewProgressQueryDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21ReviewProgressListResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ReviewProgress')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view review progress',
      });
    }

    const offset = query.offset || 0;
    const limit = Math.min(query.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);

    const whereClause: Record<string, unknown> = {};
    if (query.observation_recording_id) whereClause.observation_recording_id = query.observation_recording_id;
    if (query.reviewer_id) whereClause.reviewer_id = query.reviewer_id;
    if (query.status) whereClause.status = query.status;

    const [progress, total] = await Promise.all([
      this.prisma.m21_review_progress.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: { updated_at: 'desc' },
      }),
      this.prisma.m21_review_progress.count({ where: whereClause }),
    ]);

    const progressDtos: M21ReviewProgressDto[] = progress.map((p) => ({
      id: p.id,
      observation_recording_id: p.observation_recording_id,
      reviewer_id: p.reviewer_id,
      status: p.status as M21ReviewProgressDto['status'],
      progress_percentage: p.progress_percentage,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    return {
      review_progress: progressDtos,
      total,
      offset,
      limit,
    };
  }

  /**
   * Upsert review progress (create or update)
   */
  async upsertReviewProgress(
    dto: M21UpsertReviewProgressDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21ReviewProgressResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('manage', 'ReviewProgress') && !ability.can('create', 'ReviewProgress')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to manage review progress',
      });
    }

    // Validate recording exists
    const recording = await this.prisma.m21_observation_recordings.findUnique({
      where: { id: dto.observation_recording_id },
    });

    if (!recording) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid observation recording ID',
      });
    }

    const progress = await this.prisma.m21_review_progress.upsert({
      where: {
        observation_recording_id_reviewer_id: {
          observation_recording_id: dto.observation_recording_id,
          reviewer_id: userWithPermissions.id,
        },
      },
      create: {
        observation_recording_id: dto.observation_recording_id,
        reviewer_id: userWithPermissions.id,
        status: dto.status || 'not_started',
        progress_percentage: dto.progress_percentage || 0,
      },
      update: {
        status: dto.status,
        progress_percentage: dto.progress_percentage,
      },
    });

    this.logger.log(`Upserted review progress ${progress.id} by user ${userWithPermissions.email}`);

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
      message: 'Review progress saved successfully',
    };
  }

  /**
   * Update review progress
   */
  async updateReviewProgress(
    id: string,
    dto: M21UpdateReviewProgressDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21ReviewProgressResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('update', 'ReviewProgress')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to update review progress',
      });
    }

    const existing = await this.prisma.m21_review_progress.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Review progress with ID ${id} not found`,
      });
    }

    const updateData: Record<string, unknown> = {};
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.progress_percentage !== undefined) updateData.progress_percentage = dto.progress_percentage;

    const progress = await this.prisma.m21_review_progress.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Updated review progress ${progress.id} by user ${userWithPermissions.email}`);

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
      message: 'Review progress updated successfully',
    };
  }
}

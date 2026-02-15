import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { PrismaService } from '../../common/prisma';
import { M21AbilityFactory, M21UserWithPermissions } from '../casl/m21-ability.factory';
import { M21RecordingStatus } from '../dto/upload-recording.dto';
import { M21ReviewProgressStatus } from '../dto/review-progress.dto';

describe('ObservationsService', () => {
  let service: ObservationsService;

  const mockAdminUser: M21UserWithPermissions = {
    id: 'admin-user-123',
    email: 'admin@test.com',
    roles: [
      {
        id: 'role-1',
        name: 'admin_nacional',
        role_permissions: [],
      },
    ],
  };

  const mockObservadorUser: M21UserWithPermissions = {
    id: 'observador-user-123',
    email: 'observador@test.com',
    roles: [
      {
        id: 'role-2',
        name: 'observador',
        role_permissions: [],
      },
    ],
  };

  const mockBucket = {
    id: 'bucket-123',
    name: 'test-bucket',
    s3_bucket: 'test-s3-bucket',
    s3_region: 'us-east-1',
    access_key_encrypted: 'encrypted-key',
    secret_key_encrypted: 'encrypted-secret',
    is_active: true,
    created_by_id: 'admin-user-123',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRecording = {
    id: 'recording-123',
    storage_bucket_id: 'bucket-123',
    class_id: 'class-123',
    teacher_id: 'teacher-123',
    observer_id: 'observador-user-123',
    session_date: new Date(),
    file_key: 'recordings/class-123/test.mp4',
    mime_type: 'video/mp4',
    duration_seconds: 3600,
    file_size_bytes: BigInt(1000000),
    status: 'ready',
    metadata: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockClassroom = {
    id: 'class-123',
    institution_id: 'inst-123',
    subject_id: 'subject-123',
    name: 'Test Classroom',
  };

  const mockTeacher = {
    id: 'teacher-123',
    email: 'teacher@test.com',
    first_name: 'Teacher',
    last_name: 'Test',
  };

  const mockAnnotation = {
    id: 'annotation-123',
    observation_recording_id: 'recording-123',
    reviewer_id: 'admin-user-123',
    timestamp_seconds: 60,
    text: 'Test annotation',
    is_ai_suggestion: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockReviewProgress = {
    id: 'progress-123',
    observation_recording_id: 'recording-123',
    reviewer_id: 'admin-user-123',
    status: 'in_progress',
    progress_percentage: 50,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPrismaService = {
    m21_storage_buckets: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    m21_observation_recordings: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    m21_annotations: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    m21_review_progress: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    m01_classrooms: {
      findUnique: jest.fn(),
    },
    m01_users: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObservationsService,
        M21AbilityFactory,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ObservationsService>(ObservationsService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================================
  // STORAGE BUCKETS
  // ============================================================================

  describe('listBuckets', () => {
    it('should return paginated list of buckets for admin', async () => {
      mockPrismaService.m21_storage_buckets.findMany.mockResolvedValue([mockBucket]);
      mockPrismaService.m21_storage_buckets.count.mockResolvedValue(1);

      const result = await service.listBuckets({}, mockAdminUser);

      expect(result.buckets).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.buckets[0].name).toBe('test-bucket');
    });

    it('should respect pagination parameters', async () => {
      mockPrismaService.m21_storage_buckets.findMany.mockResolvedValue([mockBucket]);
      mockPrismaService.m21_storage_buckets.count.mockResolvedValue(10);

      const result = await service.listBuckets({ offset: 5, limit: 2 }, mockAdminUser);

      expect(mockPrismaService.m21_storage_buckets.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 2 }),
      );
      expect(result.offset).toBe(5);
      expect(result.limit).toBe(2);
    });
  });

  describe('getBucket', () => {
    it('should return bucket by ID', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(mockBucket);

      const result = await service.getBucket('bucket-123', mockAdminUser);

      expect(result.bucket.id).toBe('bucket-123');
      expect(result.bucket.name).toBe('test-bucket');
    });

    it('should throw NotFoundException if bucket not found', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(null);

      await expect(service.getBucket('nonexistent', mockAdminUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createBucket', () => {
    it('should create a new bucket', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(null);
      mockPrismaService.m21_storage_buckets.create.mockResolvedValue(mockBucket);

      const dto = {
        name: 'test-bucket',
        s3_bucket: 'test-s3-bucket',
        s3_region: 'us-east-1',
        access_key: 'access-key',
        secret_key: 'secret-key',
      };

      const result = await service.createBucket(dto, mockAdminUser);

      expect(result.bucket.name).toBe('test-bucket');
      expect(result.message).toBe('Storage bucket created successfully');
    });

    it('should throw ConflictException if bucket name exists', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(mockBucket);

      const dto = {
        name: 'test-bucket',
        s3_bucket: 'test-s3-bucket',
        s3_region: 'us-east-1',
        access_key: 'access-key',
        secret_key: 'secret-key',
      };

      await expect(service.createBucket(dto, mockAdminUser)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateBucket', () => {
    it('should update an existing bucket', async () => {
      // First call gets the existing bucket, second call checks for duplicate name
      mockPrismaService.m21_storage_buckets.findUnique
        .mockResolvedValueOnce(mockBucket)
        .mockResolvedValueOnce(null);
      mockPrismaService.m21_storage_buckets.update.mockResolvedValue({
        ...mockBucket,
        name: 'updated-bucket',
      });

      const result = await service.updateBucket('bucket-123', { name: 'updated-bucket' }, mockAdminUser);

      expect(result.bucket.name).toBe('updated-bucket');
      expect(result.message).toBe('Storage bucket updated successfully');
    });

    it('should throw NotFoundException if bucket not found', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(null);

      await expect(
        service.updateBucket('nonexistent', { name: 'updated' }, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================================
  // OBSERVATION RECORDINGS
  // ============================================================================

  describe('listRecordings', () => {
    it('should return paginated list of recordings', async () => {
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([mockRecording]);
      mockPrismaService.m21_observation_recordings.count.mockResolvedValue(1);

      const result = await service.listRecordings({}, mockAdminUser);

      expect(result.recordings).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by class_id', async () => {
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([mockRecording]);
      mockPrismaService.m21_observation_recordings.count.mockResolvedValue(1);

      await service.listRecordings({ class_id: 'class-123' }, mockAdminUser);

      expect(mockPrismaService.m21_observation_recordings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ class_id: 'class-123' }),
        }),
      );
    });
  });

  describe('getRecording', () => {
    it('should return recording by ID', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);

      const result = await service.getRecording('recording-123', mockAdminUser);

      expect(result.recording.id).toBe('recording-123');
    });

    it('should throw NotFoundException if recording not found', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      await expect(service.getRecording('nonexistent', mockAdminUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createRecording', () => {
    it('should create a new recording', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(mockBucket);
      mockPrismaService.m01_classrooms.findUnique.mockResolvedValue(mockClassroom);
      mockPrismaService.m01_users.findUnique.mockResolvedValue(mockTeacher);
      mockPrismaService.m21_observation_recordings.create.mockResolvedValue(mockRecording);

      const dto = {
        storage_bucket_id: 'bucket-123',
        class_id: 'class-123',
        teacher_id: 'teacher-123',
        session_date: '2024-01-01T00:00:00.000Z',
      };

      const result = await service.createRecording(dto, mockObservadorUser);

      expect(result.recording).toBeDefined();
      expect(result.presigned_upload_url).toBeDefined();
    });

    it('should throw BadRequestException for invalid storage bucket', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(null);

      const dto = {
        storage_bucket_id: 'invalid-bucket',
        class_id: 'class-123',
        teacher_id: 'teacher-123',
        session_date: '2024-01-01T00:00:00.000Z',
      };

      await expect(service.createRecording(dto, mockObservadorUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeUpload', () => {
    it('should complete an upload', async () => {
      const uploadingRecording = { ...mockRecording, status: 'uploading' };
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(uploadingRecording);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'processing',
      });

      const dto = {
        file_key: 'recordings/class-123/test.mp4',
        mime_type: 'video/mp4',
        file_size_bytes: 1000000,
        duration_seconds: 3600,
      };

      const result = await service.completeUpload('recording-123', dto, mockAdminUser);

      expect(result.recording.status).toBe(M21RecordingStatus.processing);
    });

    it('should throw BadRequestException if not in uploading status', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);

      const dto = {
        file_key: 'recordings/class-123/test.mp4',
        mime_type: 'video/mp4',
        file_size_bytes: 1000000,
      };

      await expect(service.completeUpload('recording-123', dto, mockAdminUser)).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================================
  // ANNOTATIONS
  // ============================================================================

  describe('listAnnotations', () => {
    it('should return paginated list of annotations', async () => {
      mockPrismaService.m21_annotations.findMany.mockResolvedValue([mockAnnotation]);
      mockPrismaService.m21_annotations.count.mockResolvedValue(1);

      const result = await service.listAnnotations({}, mockAdminUser);

      expect(result.annotations).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('createAnnotation', () => {
    it('should create a new annotation', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_annotations.create.mockResolvedValue(mockAnnotation);

      const dto = {
        observation_recording_id: 'recording-123',
        timestamp_seconds: 60,
        text: 'Test annotation',
      };

      const result = await service.createAnnotation(dto, mockAdminUser);

      expect(result.annotation.text).toBe('Test annotation');
      expect(result.message).toBe('Annotation created successfully');
    });

    it('should throw BadRequestException for invalid recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      const dto = {
        observation_recording_id: 'invalid-recording',
        timestamp_seconds: 60,
        text: 'Test annotation',
      };

      await expect(service.createAnnotation(dto, mockAdminUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAnnotation', () => {
    it('should update an annotation', async () => {
      mockPrismaService.m21_annotations.findUnique.mockResolvedValue(mockAnnotation);
      mockPrismaService.m21_annotations.update.mockResolvedValue({
        ...mockAnnotation,
        text: 'Updated annotation',
      });

      const result = await service.updateAnnotation('annotation-123', { text: 'Updated annotation' }, mockAdminUser);

      expect(result.annotation.text).toBe('Updated annotation');
    });

    it('should throw NotFoundException if annotation not found', async () => {
      mockPrismaService.m21_annotations.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAnnotation('nonexistent', { text: 'Updated' }, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================================
  // REVIEW PROGRESS
  // ============================================================================

  describe('listReviewProgress', () => {
    it('should return paginated list of review progress', async () => {
      mockPrismaService.m21_review_progress.findMany.mockResolvedValue([mockReviewProgress]);
      mockPrismaService.m21_review_progress.count.mockResolvedValue(1);

      const result = await service.listReviewProgress({}, mockAdminUser);

      expect(result.review_progress).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('upsertReviewProgress', () => {
    it('should create or update review progress', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_review_progress.upsert.mockResolvedValue(mockReviewProgress);

      const dto = {
        observation_recording_id: 'recording-123',
        status: M21ReviewProgressStatus.in_progress,
        progress_percentage: 50,
      };

      const result = await service.upsertReviewProgress(dto, mockAdminUser);

      expect(result.review_progress.status).toBe(M21ReviewProgressStatus.in_progress);
      expect(result.message).toBe('Review progress saved successfully');
    });
  });

  describe('updateReviewProgress', () => {
    it('should update review progress', async () => {
      mockPrismaService.m21_review_progress.findUnique.mockResolvedValue(mockReviewProgress);
      mockPrismaService.m21_review_progress.update.mockResolvedValue({
        ...mockReviewProgress,
        status: 'completed',
        progress_percentage: 100,
      });

      const dto = {
        status: M21ReviewProgressStatus.completed,
        progress_percentage: 100,
      };

      const result = await service.updateReviewProgress('progress-123', dto, mockAdminUser);

      expect(result.review_progress.status).toBe(M21ReviewProgressStatus.completed);
      expect(result.review_progress.progress_percentage).toBe(100);
    });

    it('should throw NotFoundException if review progress not found', async () => {
      mockPrismaService.m21_review_progress.findUnique.mockResolvedValue(null);

      await expect(
        service.updateReviewProgress('nonexistent', { progress_percentage: 100 }, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

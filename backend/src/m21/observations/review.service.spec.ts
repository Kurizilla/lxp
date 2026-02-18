import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { PrismaService } from '../../common/prisma';
import { CryptoService } from '../../common/crypto';
import { M21AbilityFactory, M21UserWithPermissions } from '../casl/m21-ability.factory';

describe('ReviewService', () => {
  let service: ReviewService;

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

  const mockRevisorUser: M21UserWithPermissions = {
    id: 'revisor-user-123',
    email: 'revisor@test.com',
    roles: [
      {
        id: 'role-2',
        name: 'revisor',
        role_permissions: [],
      },
    ],
  };

  const mockRestrictedUser: M21UserWithPermissions = {
    id: 'restricted-user-123',
    email: 'restricted@test.com',
    roles: [
      {
        id: 'role-3',
        name: 'guest',
        role_permissions: [],
      },
    ],
  };

  const mockStorageBucket = {
    id: 'bucket-123',
    name: 'test-bucket',
    s3_bucket: 'my-s3-bucket',
    s3_region: 'us-east-1',
    access_key_encrypted: 'encrypted-access-key',
    secret_key_encrypted: 'encrypted-secret-key',
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
    observer_id: 'observer-123',
    session_date: new Date('2024-01-15'),
    file_key: 'recordings/class-123/test-video.mp4',
    mime_type: 'video/mp4',
    duration_seconds: 3600,
    file_size_bytes: BigInt(1000000),
    status: 'completed',
    metadata: null,
    created_at: new Date(),
    updated_at: new Date(),
    storage_bucket: mockStorageBucket,
  };

  const mockAnnotation = {
    id: 'annotation-123',
    observation_recording_id: 'recording-123',
    reviewer_id: 'revisor-user-123',
    timestamp_seconds: 120,
    text: 'Good explanation at this point',
    is_ai_suggestion: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockReviewProgress = {
    id: 'progress-123',
    observation_recording_id: 'recording-123',
    reviewer_id: 'revisor-user-123',
    status: 'in_progress',
    progress_percentage: 50,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPrismaService = {
    m21_observation_recordings: {
      findUnique: jest.fn(),
    },
    m21_annotations: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    m21_review_progress: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCryptoService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        M21AbilityFactory,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================================
  // SIGNED PLAYBACK URLS
  // ============================================================================

  describe('generatePlaybackUrl', () => {
    it('should generate a signed playback URL for a ready recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);

      const result = await service.generatePlaybackUrl('recording-123', mockAdminUser);

      expect(result.playback.recording_id).toBe('recording-123');
      expect(result.playback.file_key).toBe('recordings/class-123/test-video.mp4');
      expect(result.playback.mime_type).toBe('video/mp4');
      expect(result.playback.s3_bucket).toBe('my-s3-bucket');
      expect(result.playback.s3_region).toBe('us-east-1');
      expect(result.playback.expires_in_seconds).toBe(3600);
      expect(result.playback.playback_url).toContain('my-s3-bucket');
      expect(result.playback.playback_url).toContain('X-Amz-Signature');
    });

    it('should throw NotFoundException for non-existent recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      await expect(
        service.generatePlaybackUrl('nonexistent', mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for recording not ready for playback', async () => {
      const uploadingRecording = { ...mockRecording, status: 'uploading' };
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(uploadingRecording);

      await expect(
        service.generatePlaybackUrl('recording-123', mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for inactive storage bucket', async () => {
      const recordingWithInactiveBucket = {
        ...mockRecording,
        storage_bucket: { ...mockStorageBucket, is_active: false },
      };
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(
        recordingWithInactiveBucket,
      );

      await expect(
        service.generatePlaybackUrl('recording-123', mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for users without read permission', async () => {
      await expect(
        service.generatePlaybackUrl('recording-123', mockRestrictedUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should work for transcribing status recordings', async () => {
      const transcribingRecording = { ...mockRecording, status: 'transcribing' };
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(
        transcribingRecording,
      );

      const result = await service.generatePlaybackUrl('recording-123', mockAdminUser);

      expect(result.playback.playback_url).toBeDefined();
    });

    it('should work for analyzing status recordings', async () => {
      const analyzingRecording = { ...mockRecording, status: 'analyzing' };
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(
        analyzingRecording,
      );

      const result = await service.generatePlaybackUrl('recording-123', mockAdminUser);

      expect(result.playback.playback_url).toBeDefined();
    });
  });

  // ============================================================================
  // ANNOTATIONS WITH TIMESTAMPS
  // ============================================================================

  describe('getRecordingAnnotations', () => {
    it('should return annotations ordered by timestamp', async () => {
      const annotations = [
        { ...mockAnnotation, timestamp_seconds: 60 },
        { ...mockAnnotation, id: 'ann-2', timestamp_seconds: 120 },
        { ...mockAnnotation, id: 'ann-3', timestamp_seconds: 180 },
      ];
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_annotations.findMany.mockResolvedValue(annotations);
      mockPrismaService.m21_annotations.count.mockResolvedValue(3);

      const result = await service.getRecordingAnnotations(
        'recording-123',
        {},
        mockAdminUser,
      );

      expect(result.annotations).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(mockPrismaService.m21_annotations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { timestamp_seconds: 'asc' },
        }),
      );
    });

    it('should throw NotFoundException for non-existent recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      await expect(
        service.getRecordingAnnotations('nonexistent', {}, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for users without read permission', async () => {
      await expect(
        service.getRecordingAnnotations('recording-123', {}, mockRestrictedUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should filter by reviewer_id', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_annotations.findMany.mockResolvedValue([mockAnnotation]);
      mockPrismaService.m21_annotations.count.mockResolvedValue(1);

      await service.getRecordingAnnotations(
        'recording-123',
        { reviewer_id: 'revisor-user-123' },
        mockAdminUser,
      );

      expect(mockPrismaService.m21_annotations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ reviewer_id: 'revisor-user-123' }),
        }),
      );
    });

    it('should filter by is_ai_suggestion', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_annotations.findMany.mockResolvedValue([]);
      mockPrismaService.m21_annotations.count.mockResolvedValue(0);

      await service.getRecordingAnnotations(
        'recording-123',
        { is_ai_suggestion: true },
        mockAdminUser,
      );

      expect(mockPrismaService.m21_annotations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ is_ai_suggestion: true }),
        }),
      );
    });

    it('should respect pagination parameters', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_annotations.findMany.mockResolvedValue([]);
      mockPrismaService.m21_annotations.count.mockResolvedValue(50);

      const result = await service.getRecordingAnnotations(
        'recording-123',
        { offset: 10, limit: 5 },
        mockAdminUser,
      );

      expect(mockPrismaService.m21_annotations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
      expect(result.offset).toBe(10);
      expect(result.limit).toBe(5);
    });
  });

  describe('createTimestampedAnnotation', () => {
    it('should create an annotation with timestamp', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_annotations.create.mockResolvedValue(mockAnnotation);

      const result = await service.createTimestampedAnnotation(
        'recording-123',
        {
          observation_recording_id: 'recording-123',
          timestamp_seconds: 120,
          text: 'Good explanation at this point',
        },
        mockRevisorUser,
      );

      expect(result.annotation.timestamp_seconds).toBe(120);
      expect(result.annotation.text).toBe('Good explanation at this point');
      expect(result.message).toContain('02:00');
    });

    it('should throw NotFoundException for non-existent recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      await expect(
        service.createTimestampedAnnotation(
          'nonexistent',
          {
            observation_recording_id: 'nonexistent',
            timestamp_seconds: 120,
            text: 'Test',
          },
          mockRevisorUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if timestamp exceeds duration', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);

      await expect(
        service.createTimestampedAnnotation(
          'recording-123',
          {
            observation_recording_id: 'recording-123',
            timestamp_seconds: 5000, // Exceeds 3600 duration
            text: 'Test',
          },
          mockRevisorUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for users without create permission', async () => {
      await expect(
        service.createTimestampedAnnotation(
          'recording-123',
          {
            observation_recording_id: 'recording-123',
            timestamp_seconds: 120,
            text: 'Test',
          },
          mockRestrictedUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow timestamp at recording boundary', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_annotations.create.mockResolvedValue({
        ...mockAnnotation,
        timestamp_seconds: 3600,
      });

      const result = await service.createTimestampedAnnotation(
        'recording-123',
        {
          observation_recording_id: 'recording-123',
          timestamp_seconds: 3600, // Exactly at duration
          text: 'End annotation',
        },
        mockRevisorUser,
      );

      expect(result.annotation.timestamp_seconds).toBe(3600);
    });

    it('should handle AI suggestions', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_annotations.create.mockResolvedValue({
        ...mockAnnotation,
        is_ai_suggestion: true,
      });

      const result = await service.createTimestampedAnnotation(
        'recording-123',
        {
          observation_recording_id: 'recording-123',
          timestamp_seconds: 120,
          text: 'AI generated annotation',
          is_ai_suggestion: true,
        },
        mockAdminUser,
      );

      expect(result.annotation.is_ai_suggestion).toBe(true);
    });
  });

  describe('updateTimestampedAnnotation', () => {
    it('should update annotation text and timestamp', async () => {
      mockPrismaService.m21_annotations.findUnique.mockResolvedValue({
        ...mockAnnotation,
        observation_recording: mockRecording,
      });
      mockPrismaService.m21_annotations.update.mockResolvedValue({
        ...mockAnnotation,
        text: 'Updated annotation',
        timestamp_seconds: 180,
      });

      const result = await service.updateTimestampedAnnotation(
        'annotation-123',
        { text: 'Updated annotation', timestamp_seconds: 180 },
        mockRevisorUser,
      );

      expect(result.annotation.text).toBe('Updated annotation');
      expect(result.annotation.timestamp_seconds).toBe(180);
    });

    it('should throw NotFoundException for non-existent annotation', async () => {
      mockPrismaService.m21_annotations.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTimestampedAnnotation(
          'nonexistent',
          { text: 'Test' },
          mockRevisorUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if updated timestamp exceeds duration', async () => {
      mockPrismaService.m21_annotations.findUnique.mockResolvedValue({
        ...mockAnnotation,
        observation_recording: mockRecording,
      });

      await expect(
        service.updateTimestampedAnnotation(
          'annotation-123',
          { timestamp_seconds: 5000 },
          mockRevisorUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for users without update permission', async () => {
      await expect(
        service.updateTimestampedAnnotation(
          'annotation-123',
          { text: 'Test' },
          mockRestrictedUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteAnnotation', () => {
    it('should delete an annotation', async () => {
      mockPrismaService.m21_annotations.findUnique.mockResolvedValue(mockAnnotation);
      mockPrismaService.m21_annotations.delete.mockResolvedValue(mockAnnotation);

      const result = await service.deleteAnnotation('annotation-123', mockAdminUser);

      expect(result.message).toBe('Annotation deleted successfully');
      expect(mockPrismaService.m21_annotations.delete).toHaveBeenCalledWith({
        where: { id: 'annotation-123' },
      });
    });

    it('should throw NotFoundException for non-existent annotation', async () => {
      mockPrismaService.m21_annotations.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteAnnotation('nonexistent', mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for users without delete permission', async () => {
      await expect(
        service.deleteAnnotation('annotation-123', mockRestrictedUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ============================================================================
  // REVIEW PROGRESS PATCH
  // ============================================================================

  describe('patchReviewProgress', () => {
    it('should update review progress', async () => {
      mockPrismaService.m21_review_progress.findUnique.mockResolvedValue(mockReviewProgress);
      mockPrismaService.m21_review_progress.update.mockResolvedValue({
        ...mockReviewProgress,
        progress_percentage: 75,
        status: 'in_progress',
      });

      const result = await service.patchReviewProgress(
        'progress-123',
        { progress_percentage: 75 },
        mockRevisorUser,
      );

      expect(result.review_progress.progress_percentage).toBe(75);
      expect(result.message).toContain('75%');
    });

    it('should update status', async () => {
      mockPrismaService.m21_review_progress.findUnique.mockResolvedValue(mockReviewProgress);
      mockPrismaService.m21_review_progress.update.mockResolvedValue({
        ...mockReviewProgress,
        status: 'completed',
        progress_percentage: 100,
      });

      const result = await service.patchReviewProgress(
        'progress-123',
        { status: 'completed' as any, progress_percentage: 100 },
        mockRevisorUser,
      );

      expect(result.review_progress.status).toBe('completed');
    });

    it('should throw NotFoundException for non-existent progress', async () => {
      mockPrismaService.m21_review_progress.findUnique.mockResolvedValue(null);

      await expect(
        service.patchReviewProgress('nonexistent', { progress_percentage: 50 }, mockRevisorUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for users without update permission', async () => {
      await expect(
        service.patchReviewProgress('progress-123', { progress_percentage: 50 }, mockRestrictedUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMyReviewProgress', () => {
    it('should return current user review progress', async () => {
      mockPrismaService.m21_review_progress.findUnique.mockResolvedValue(mockReviewProgress);

      const result = await service.getMyReviewProgress('recording-123', mockRevisorUser);

      expect(result).not.toBeNull();
      expect(result!.review_progress.progress_percentage).toBe(50);
      expect(result!.review_progress.status).toBe('in_progress');
    });

    it('should return null if no progress record exists', async () => {
      mockPrismaService.m21_review_progress.findUnique.mockResolvedValue(null);

      const result = await service.getMyReviewProgress('recording-123', mockRevisorUser);

      expect(result).toBeNull();
    });

    it('should throw ForbiddenException for users without read permission', async () => {
      await expect(
        service.getMyReviewProgress('recording-123', mockRestrictedUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should use composite key to find progress', async () => {
      mockPrismaService.m21_review_progress.findUnique.mockResolvedValue(mockReviewProgress);

      await service.getMyReviewProgress('recording-123', mockRevisorUser);

      expect(mockPrismaService.m21_review_progress.findUnique).toHaveBeenCalledWith({
        where: {
          observation_recording_id_reviewer_id: {
            observation_recording_id: 'recording-123',
            reviewer_id: 'revisor-user-123',
          },
        },
      });
    });
  });

  // ============================================================================
  // TIMESTAMP FORMATTING
  // ============================================================================

  describe('timestamp formatting', () => {
    it('should format timestamps under an hour as MM:SS', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_annotations.create.mockResolvedValue({
        ...mockAnnotation,
        timestamp_seconds: 125, // 2:05
      });

      const result = await service.createTimestampedAnnotation(
        'recording-123',
        {
          observation_recording_id: 'recording-123',
          timestamp_seconds: 125,
          text: 'Test',
        },
        mockRevisorUser,
      );

      expect(result.message).toContain('02:05');
    });

    it('should format timestamps over an hour as HH:MM:SS', async () => {
      const longRecording = { ...mockRecording, duration_seconds: 7200 };
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(longRecording);
      mockPrismaService.m21_annotations.create.mockResolvedValue({
        ...mockAnnotation,
        timestamp_seconds: 3725, // 1:02:05
      });

      const result = await service.createTimestampedAnnotation(
        'recording-123',
        {
          observation_recording_id: 'recording-123',
          timestamp_seconds: 3725,
          text: 'Test',
        },
        mockRevisorUser,
      );

      expect(result.message).toContain('01:02:05');
    });
  });
});

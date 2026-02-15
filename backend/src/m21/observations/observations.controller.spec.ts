import { Test, TestingModule } from '@nestjs/testing';
import { ObservationsController } from './observations.controller';
import { ObservationsService } from './observations.service';
import { M21ObservationsGuard, M21ObservationsRequest } from '../guards/m21-observations.guard';
import { JwtAuthGuard } from '../../m01/auth/jwt-auth.guard';
import { M21UserWithPermissions } from '../casl/m21-ability.factory';
import {
  M21StorageBucketsResponseDto,
  M21StorageBucketResponseDto,
} from '../dto/upsert-bucket.dto';
import {
  M21RecordingsResponseDto,
  M21RecordingResponseDto,
  M21RecordingStatus,
} from '../dto/upload-recording.dto';
import {
  M21AnnotationsResponseDto,
  M21AnnotationResponseDto,
} from '../dto/annotation.dto';
import {
  M21ReviewProgressListResponseDto,
  M21ReviewProgressResponseDto,
  M21ReviewProgressStatus,
} from '../dto/review-progress.dto';

describe('ObservationsController', () => {
  let controller: ObservationsController;
  let service: ObservationsService;

  const mockUserWithPermissions: M21UserWithPermissions = {
    id: 'user-123',
    email: 'admin@test.com',
    roles: [
      {
        id: 'role-1',
        name: 'admin_nacional',
        role_permissions: [],
      },
    ],
  };

  const mockRequest: M21ObservationsRequest = {
    user: {
      id: 'user-123',
      email: 'admin@test.com',
      first_name: 'Admin',
      last_name: 'User',
      session_id: 'session-123',
    },
    userWithPermissions: mockUserWithPermissions,
  };

  const mockBucket = {
    id: 'bucket-123',
    name: 'test-bucket',
    s3_bucket: 'test-s3-bucket',
    s3_region: 'us-east-1',
    is_active: true,
    created_by_id: 'user-123',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRecording = {
    id: 'recording-123',
    storage_bucket_id: 'bucket-123',
    class_id: 'class-123',
    teacher_id: 'teacher-123',
    observer_id: 'user-123',
    session_date: new Date(),
    file_key: 'recordings/class-123/test.mp4',
    mime_type: 'video/mp4',
    duration_seconds: 3600,
    file_size_bytes: '1000000',
    status: M21RecordingStatus.ready,
    metadata: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockAnnotation = {
    id: 'annotation-123',
    observation_recording_id: 'recording-123',
    reviewer_id: 'user-123',
    timestamp_seconds: 60,
    text: 'Test annotation',
    is_ai_suggestion: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockReviewProgress = {
    id: 'progress-123',
    observation_recording_id: 'recording-123',
    reviewer_id: 'user-123',
    status: M21ReviewProgressStatus.in_progress,
    progress_percentage: 50,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockObservationsService = {
    listBuckets: jest.fn(),
    getBucket: jest.fn(),
    createBucket: jest.fn(),
    updateBucket: jest.fn(),
    listRecordings: jest.fn(),
    getRecording: jest.fn(),
    createRecording: jest.fn(),
    completeUpload: jest.fn(),
    updateRecording: jest.fn(),
    listAnnotations: jest.fn(),
    createAnnotation: jest.fn(),
    updateAnnotation: jest.fn(),
    listReviewProgress: jest.fn(),
    upsertReviewProgress: jest.fn(),
    updateReviewProgress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObservationsController],
      providers: [
        {
          provide: ObservationsService,
          useValue: mockObservationsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(M21ObservationsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ObservationsController>(ObservationsController);
    service = module.get<ObservationsService>(ObservationsService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ============================================================================
  // STORAGE BUCKETS
  // ============================================================================

  describe('listBuckets', () => {
    it('should return paginated list of storage buckets', async () => {
      const response: M21StorageBucketsResponseDto = {
        buckets: [mockBucket],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockObservationsService.listBuckets.mockResolvedValue(response);

      const result = await controller.listBuckets({}, mockRequest);

      expect(result).toEqual(response);
      expect(service.listBuckets).toHaveBeenCalledWith({}, mockUserWithPermissions);
    });
  });

  describe('getBucket', () => {
    it('should return a single bucket', async () => {
      const response: M21StorageBucketResponseDto = { bucket: mockBucket };

      mockObservationsService.getBucket.mockResolvedValue(response);

      const result = await controller.getBucket('bucket-123', mockRequest);

      expect(result).toEqual(response);
      expect(service.getBucket).toHaveBeenCalledWith('bucket-123', mockUserWithPermissions);
    });
  });

  describe('createBucket', () => {
    it('should create a new bucket', async () => {
      const dto = {
        name: 'test-bucket',
        s3_bucket: 'test-s3-bucket',
        s3_region: 'us-east-1',
        access_key: 'access-key',
        secret_key: 'secret-key',
      };

      const response: M21StorageBucketResponseDto = {
        bucket: mockBucket,
        message: 'Storage bucket created successfully',
      };

      mockObservationsService.createBucket.mockResolvedValue(response);

      const result = await controller.createBucket(dto, mockRequest);

      expect(result).toEqual(response);
      expect(service.createBucket).toHaveBeenCalledWith(dto, mockUserWithPermissions);
    });
  });

  describe('updateBucket', () => {
    it('should update an existing bucket', async () => {
      const dto = { name: 'updated-bucket' };

      const response: M21StorageBucketResponseDto = {
        bucket: { ...mockBucket, name: 'updated-bucket' },
        message: 'Storage bucket updated successfully',
      };

      mockObservationsService.updateBucket.mockResolvedValue(response);

      const result = await controller.updateBucket('bucket-123', dto, mockRequest);

      expect(result).toEqual(response);
      expect(service.updateBucket).toHaveBeenCalledWith('bucket-123', dto, mockUserWithPermissions);
    });
  });

  // ============================================================================
  // OBSERVATION RECORDINGS
  // ============================================================================

  describe('listRecordings', () => {
    it('should return paginated list of recordings', async () => {
      const response: M21RecordingsResponseDto = {
        recordings: [mockRecording],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockObservationsService.listRecordings.mockResolvedValue(response);

      const result = await controller.listRecordings({}, mockRequest);

      expect(result).toEqual(response);
      expect(service.listRecordings).toHaveBeenCalledWith({}, mockUserWithPermissions);
    });
  });

  describe('getRecording', () => {
    it('should return a single recording', async () => {
      const response: M21RecordingResponseDto = { recording: mockRecording };

      mockObservationsService.getRecording.mockResolvedValue(response);

      const result = await controller.getRecording('recording-123', mockRequest);

      expect(result).toEqual(response);
      expect(service.getRecording).toHaveBeenCalledWith('recording-123', mockUserWithPermissions);
    });
  });

  describe('createRecording', () => {
    it('should create a new recording', async () => {
      const dto = {
        storage_bucket_id: 'bucket-123',
        class_id: 'class-123',
        teacher_id: 'teacher-123',
        session_date: '2024-01-01T00:00:00.000Z',
      };

      const response: M21RecordingResponseDto = {
        recording: mockRecording,
        message: 'Recording created. Use presigned URL to upload file.',
        presigned_upload_url: 'https://test.s3.amazonaws.com/test?presigned=stub',
      };

      mockObservationsService.createRecording.mockResolvedValue(response);

      const result = await controller.createRecording(dto, mockRequest);

      expect(result).toEqual(response);
      expect(service.createRecording).toHaveBeenCalledWith(dto, mockUserWithPermissions);
    });
  });

  describe('completeUpload', () => {
    it('should complete the upload', async () => {
      const dto = {
        file_key: 'recordings/class-123/test.mp4',
        mime_type: 'video/mp4',
        file_size_bytes: 1000000,
        duration_seconds: 3600,
      };

      const response: M21RecordingResponseDto = {
        recording: { ...mockRecording, status: M21RecordingStatus.processing },
        message: 'Upload completed successfully',
      };

      mockObservationsService.completeUpload.mockResolvedValue(response);

      const result = await controller.completeUpload('recording-123', dto, mockRequest);

      expect(result).toEqual(response);
      expect(service.completeUpload).toHaveBeenCalledWith('recording-123', dto, mockUserWithPermissions);
    });
  });

  describe('updateRecording', () => {
    it('should update a recording', async () => {
      const dto = { status: M21RecordingStatus.completed };

      const response: M21RecordingResponseDto = {
        recording: { ...mockRecording, status: M21RecordingStatus.completed },
        message: 'Recording updated successfully',
      };

      mockObservationsService.updateRecording.mockResolvedValue(response);

      const result = await controller.updateRecording('recording-123', dto, mockRequest);

      expect(result).toEqual(response);
      expect(service.updateRecording).toHaveBeenCalledWith('recording-123', dto, mockUserWithPermissions);
    });
  });

  // ============================================================================
  // ANNOTATIONS
  // ============================================================================

  describe('listAnnotations', () => {
    it('should return paginated list of annotations', async () => {
      const response: M21AnnotationsResponseDto = {
        annotations: [mockAnnotation],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockObservationsService.listAnnotations.mockResolvedValue(response);

      const result = await controller.listAnnotations({}, mockRequest);

      expect(result).toEqual(response);
      expect(service.listAnnotations).toHaveBeenCalledWith({}, mockUserWithPermissions);
    });
  });

  describe('listRecordingAnnotations', () => {
    it('should return annotations for a specific recording', async () => {
      const response: M21AnnotationsResponseDto = {
        annotations: [mockAnnotation],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockObservationsService.listAnnotations.mockResolvedValue(response);

      const result = await controller.listRecordingAnnotations('recording-123', {}, mockRequest);

      expect(result).toEqual(response);
      expect(service.listAnnotations).toHaveBeenCalledWith(
        { observation_recording_id: 'recording-123' },
        mockUserWithPermissions,
      );
    });
  });

  describe('createAnnotation', () => {
    it('should create a new annotation', async () => {
      const dto = {
        observation_recording_id: 'recording-123',
        timestamp_seconds: 60,
        text: 'Test annotation',
      };

      const response: M21AnnotationResponseDto = {
        annotation: mockAnnotation,
        message: 'Annotation created successfully',
      };

      mockObservationsService.createAnnotation.mockResolvedValue(response);

      const result = await controller.createAnnotation(dto, mockRequest);

      expect(result).toEqual(response);
      expect(service.createAnnotation).toHaveBeenCalledWith(dto, mockUserWithPermissions);
    });
  });

  describe('updateAnnotation', () => {
    it('should update an annotation', async () => {
      const dto = { text: 'Updated annotation' };

      const response: M21AnnotationResponseDto = {
        annotation: { ...mockAnnotation, text: 'Updated annotation' },
        message: 'Annotation updated successfully',
      };

      mockObservationsService.updateAnnotation.mockResolvedValue(response);

      const result = await controller.updateAnnotation('annotation-123', dto, mockRequest);

      expect(result).toEqual(response);
      expect(service.updateAnnotation).toHaveBeenCalledWith('annotation-123', dto, mockUserWithPermissions);
    });
  });

  // ============================================================================
  // REVIEW PROGRESS
  // ============================================================================

  describe('listReviewProgress', () => {
    it('should return paginated list of review progress', async () => {
      const response: M21ReviewProgressListResponseDto = {
        review_progress: [mockReviewProgress],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockObservationsService.listReviewProgress.mockResolvedValue(response);

      const result = await controller.listReviewProgress({}, mockRequest);

      expect(result).toEqual(response);
      expect(service.listReviewProgress).toHaveBeenCalledWith({}, mockUserWithPermissions);
    });
  });

  describe('listRecordingReviewProgress', () => {
    it('should return review progress for a specific recording', async () => {
      const response: M21ReviewProgressListResponseDto = {
        review_progress: [mockReviewProgress],
        total: 1,
        offset: 0,
        limit: 20,
      };

      mockObservationsService.listReviewProgress.mockResolvedValue(response);

      const result = await controller.listRecordingReviewProgress('recording-123', {}, mockRequest);

      expect(result).toEqual(response);
      expect(service.listReviewProgress).toHaveBeenCalledWith(
        { observation_recording_id: 'recording-123' },
        mockUserWithPermissions,
      );
    });
  });

  describe('upsertReviewProgress', () => {
    it('should create or update review progress', async () => {
      const dto = {
        observation_recording_id: 'recording-123',
        status: M21ReviewProgressStatus.in_progress,
        progress_percentage: 50,
      };

      const response: M21ReviewProgressResponseDto = {
        review_progress: mockReviewProgress,
        message: 'Review progress saved successfully',
      };

      mockObservationsService.upsertReviewProgress.mockResolvedValue(response);

      const result = await controller.upsertReviewProgress(dto, mockRequest);

      expect(result).toEqual(response);
      expect(service.upsertReviewProgress).toHaveBeenCalledWith(dto, mockUserWithPermissions);
    });
  });

  describe('updateReviewProgress', () => {
    it('should update review progress', async () => {
      const dto = {
        status: M21ReviewProgressStatus.completed,
        progress_percentage: 100,
      };

      const response: M21ReviewProgressResponseDto = {
        review_progress: {
          ...mockReviewProgress,
          status: M21ReviewProgressStatus.completed,
          progress_percentage: 100,
        },
        message: 'Review progress updated successfully',
      };

      mockObservationsService.updateReviewProgress.mockResolvedValue(response);

      const result = await controller.updateReviewProgress('progress-123', dto, mockRequest);

      expect(result).toEqual(response);
      expect(service.updateReviewProgress).toHaveBeenCalledWith('progress-123', dto, mockUserWithPermissions);
    });
  });
});

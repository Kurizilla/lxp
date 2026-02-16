import { Test, TestingModule } from '@nestjs/testing';
import { RecordingsController, M21GeneratePresignedUrlDto } from './recordings.controller';
import { ObservationsService } from './observations.service';
import { UploadService, M21PresignedUrlResponse } from './upload.service';
import { TranscriptionService } from './transcription.service';
import { M21ObservationsGuard, M21ObservationsRequest } from '../guards/m21-observations.guard';
import { JwtAuthGuard } from '../../m01/auth/jwt-auth.guard';
import { M21UserWithPermissions } from '../casl/m21-ability.factory';
import {
  M21RecordingsResponseDto,
  M21RecordingResponseDto,
  M21RecordingStatus,
} from '../dto/upload-recording.dto';
import { M21TranscriptionJobStatus } from '../dto/transcription.dto';

describe('RecordingsController', () => {
  let controller: RecordingsController;
  let observationsService: ObservationsService;
  let uploadService: UploadService;

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

  const mockPresignedUrlResponse: M21PresignedUrlResponse = {
    upload_url: 'https://test-bucket.s3.us-east-1.amazonaws.com/test?presigned=stub',
    file_key: 'recordings/class-123/test.mp4',
    expires_in_seconds: 3600,
    s3_bucket: 'test-bucket',
    s3_region: 'us-east-1',
  };

  const mockObservationsService = {
    listRecordings: jest.fn(),
    getRecording: jest.fn(),
    createRecording: jest.fn(),
    completeUpload: jest.fn(),
    updateRecording: jest.fn(),
  };

  const mockUploadService = {
    generatePresignedUrl: jest.fn(),
    getBucketCredentials: jest.fn(),
    completeUpload: jest.fn(),
    updateRecordingStatus: jest.fn(),
  };

  const mockTranscriptionService = {
    queueTranscription: jest.fn(),
    getTranscript: jest.fn(),
    getTranscriptionStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordingsController],
      providers: [
        {
          provide: ObservationsService,
          useValue: mockObservationsService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
        {
          provide: TranscriptionService,
          useValue: mockTranscriptionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(M21ObservationsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RecordingsController>(RecordingsController);
    observationsService = module.get<ObservationsService>(ObservationsService);
    uploadService = module.get<UploadService>(UploadService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ============================================================================
  // LIST & GET RECORDINGS
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
      expect(observationsService.listRecordings).toHaveBeenCalledWith({}, mockUserWithPermissions);
    });

    it('should pass query parameters for filtering', async () => {
      const query = {
        class_id: 'class-123',
        teacher_id: 'teacher-123',
        status: M21RecordingStatus.ready,
        offset: 10,
        limit: 5,
      };

      const response: M21RecordingsResponseDto = {
        recordings: [mockRecording],
        total: 1,
        offset: 10,
        limit: 5,
      };

      mockObservationsService.listRecordings.mockResolvedValue(response);

      const result = await controller.listRecordings(query, mockRequest);

      expect(result.offset).toBe(10);
      expect(result.limit).toBe(5);
      expect(observationsService.listRecordings).toHaveBeenCalledWith(query, mockUserWithPermissions);
    });
  });

  describe('getRecording', () => {
    it('should return a single recording', async () => {
      const response: M21RecordingResponseDto = { recording: mockRecording };

      mockObservationsService.getRecording.mockResolvedValue(response);

      const result = await controller.getRecording('recording-123', mockRequest);

      expect(result).toEqual(response);
      expect(observationsService.getRecording).toHaveBeenCalledWith('recording-123', mockUserWithPermissions);
    });
  });

  // ============================================================================
  // CREATE & UPLOAD RECORDINGS
  // ============================================================================

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
      expect(observationsService.createRecording).toHaveBeenCalledWith(dto, mockUserWithPermissions);
    });
  });

  describe('generatePresignedUrl', () => {
    it('should generate a presigned URL', async () => {
      const dto: M21GeneratePresignedUrlDto = {
        storage_bucket_id: 'bucket-123',
        class_id: 'class-123',
        filename: 'test-video.mp4',
        mime_type: 'video/mp4',
      };

      mockUploadService.generatePresignedUrl.mockResolvedValue(mockPresignedUrlResponse);

      const result = await controller.generatePresignedUrl(dto, mockRequest);

      expect(result.presigned_url).toEqual(mockPresignedUrlResponse);
      expect(result.message).toContain('Presigned URL generated successfully');
      expect(uploadService.generatePresignedUrl).toHaveBeenCalledWith({
        storage_bucket_id: 'bucket-123',
        class_id: 'class-123',
        filename: 'test-video.mp4',
        mime_type: 'video/mp4',
        file_size_bytes: undefined,
      });
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
      expect(observationsService.completeUpload).toHaveBeenCalledWith('recording-123', dto, mockUserWithPermissions);
    });
  });

  describe('uploadRecordingFile', () => {
    it('should upload a recording file directly', async () => {
      const dto = {
        storage_bucket_id: 'bucket-123',
        class_id: 'class-123',
        teacher_id: 'teacher-123',
        session_date: '2024-01-01T00:00:00.000Z',
      };

      const mockFile = {
        fieldname: 'file',
        originalname: 'test.mp4',
        encoding: '7bit',
        mimetype: 'video/mp4',
        size: 1000000,
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      const createResponse: M21RecordingResponseDto = {
        recording: mockRecording,
        message: 'Recording created.',
        presigned_upload_url: 'https://test.s3.amazonaws.com/test',
      };

      mockObservationsService.createRecording.mockResolvedValue(createResponse);
      mockUploadService.completeUpload.mockResolvedValue(mockRecording);

      const result = await controller.uploadRecordingFile(mockFile, dto, mockRequest);

      expect(result.message).toContain('successfully');
      expect(observationsService.createRecording).toHaveBeenCalledWith(dto, mockUserWithPermissions);
      expect(uploadService.completeUpload).toHaveBeenCalledWith(mockRecording.id, {
        file_key: mockRecording.file_key,
        mime_type: 'video/mp4',
        file_size_bytes: 1000000,
      });
    });
  });

  // ============================================================================
  // UPDATE RECORDINGS
  // ============================================================================

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
      expect(observationsService.updateRecording).toHaveBeenCalledWith('recording-123', dto, mockUserWithPermissions);
    });
  });

  describe('updateRecordingStatus', () => {
    it('should update only the recording status', async () => {
      const dto = { status: 'completed' };

      const response: M21RecordingResponseDto = {
        recording: { ...mockRecording, status: M21RecordingStatus.completed },
        message: 'Recording updated successfully',
      };

      mockObservationsService.updateRecording.mockResolvedValue(response);

      const result = await controller.updateRecordingStatus('recording-123', dto, mockRequest);

      expect(result).toEqual(response);
      expect(observationsService.updateRecording).toHaveBeenCalledWith(
        'recording-123',
        { status: 'completed' },
        mockUserWithPermissions,
      );
    });
  });

  // ============================================================================
  // TRANSCRIPTION
  // ============================================================================

  describe('queueTranscription', () => {
    it('should queue a transcription job', async () => {
      const response = {
        job_id: 'job-123',
        recording_id: 'recording-123',
        status: M21TranscriptionJobStatus.pending,
        message: 'Transcription job queued successfully',
        created_at: new Date(),
      };

      mockTranscriptionService.queueTranscription.mockResolvedValue(response);

      const result = await controller.queueTranscription('recording-123', { language: 'es' }, mockRequest);

      expect(result).toEqual(response);
      expect(mockTranscriptionService.queueTranscription).toHaveBeenCalledWith(
        'recording-123',
        { language: 'es' },
        mockUserWithPermissions,
      );
    });
  });

  describe('getTranscript', () => {
    it('should return the transcript for a recording', async () => {
      const response = {
        transcript: {
          id: 'transcript-123',
          observation_recording_id: 'recording-123',
          full_text: 'Test transcript text',
          segments: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
      };

      mockTranscriptionService.getTranscript.mockResolvedValue(response);

      const result = await controller.getTranscript('recording-123', mockRequest);

      expect(result).toEqual(response);
      expect(mockTranscriptionService.getTranscript).toHaveBeenCalledWith('recording-123', mockUserWithPermissions);
    });
  });

  describe('getTranscriptionStatus', () => {
    it('should return the transcription status', async () => {
      const response = {
        job_id: 'status-check',
        recording_id: 'recording-123',
        status: M21TranscriptionJobStatus.completed,
        message: 'Transcription completed',
      };

      mockTranscriptionService.getTranscriptionStatus.mockResolvedValue(response);

      const result = await controller.getTranscriptionStatus('recording-123', mockRequest);

      expect(result).toEqual(response);
      expect(mockTranscriptionService.getTranscriptionStatus).toHaveBeenCalledWith('recording-123', mockUserWithPermissions);
    });
  });
});

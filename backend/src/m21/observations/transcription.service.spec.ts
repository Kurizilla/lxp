import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { TranscriptionService, M21_TRANSCRIBE_JOB } from './transcription.service';
import { PrismaService } from '../../common/prisma';
import { M21AbilityFactory, M21UserWithPermissions } from '../casl/m21-ability.factory';
import { M21_PROCESSING_QUEUE } from '../m21.module';
import { M21TranscriptionJobStatus } from '../dto/transcription.dto';

describe('TranscriptionService', () => {
  let service: TranscriptionService;

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

  const mockRecording = {
    id: 'recording-123',
    storage_bucket_id: 'bucket-123',
    class_id: 'class-123',
    teacher_id: 'teacher-123',
    observer_id: 'observer-123',
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

  const mockTranscript = {
    id: 'transcript-123',
    observation_recording_id: 'recording-123',
    full_text: 'This is a test transcript.',
    segments: [
      {
        start_seconds: 0,
        end_seconds: 5,
        text: 'This is a test transcript.',
        speaker: 'Teacher',
        confidence: 0.95,
      },
    ],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPrismaService = {
    m21_observation_recordings: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    m21_transcripts: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionService,
        M21AbilityFactory,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken(M21_PROCESSING_QUEUE),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<TranscriptionService>(TranscriptionService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================================
  // queueTranscription
  // ============================================================================

  describe('queueTranscription', () => {
    it('should queue a transcription job for a valid recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(null);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'transcribing',
      });

      const result = await service.queueTranscription(
        'recording-123',
        { language: 'es' },
        mockAdminUser,
      );

      expect(result.status).toBe(M21TranscriptionJobStatus.pending);
      expect(result.job_id).toBe('job-123');
      expect(result.message).toBe('Transcription job queued successfully');
      expect(mockQueue.add).toHaveBeenCalledWith(
        M21_TRANSCRIBE_JOB,
        {
          recording_id: 'recording-123',
          user_id: 'admin-user-123',
          language: 'es',
          priority: undefined,
        },
        expect.objectContaining({
          attempts: 3,
          removeOnComplete: true,
        }),
      );
    });

    it('should throw NotFoundException for non-existent recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      await expect(
        service.queueTranscription('nonexistent', {}, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if recording is not in ready/completed status', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue({
        ...mockRecording,
        status: 'uploading',
      });

      await expect(
        service.queueTranscription('recording-123', {}, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if transcript already exists', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(mockTranscript);

      await expect(
        service.queueTranscription('recording-123', {}, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update recording status to transcribing', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(null);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'transcribing',
      });

      await service.queueTranscription('recording-123', {}, mockAdminUser);

      expect(mockPrismaService.m21_observation_recordings.update).toHaveBeenCalledWith({
        where: { id: 'recording-123' },
        data: { status: 'transcribing' },
      });
    });
  });

  // ============================================================================
  // getTranscript
  // ============================================================================

  describe('getTranscript', () => {
    it('should return transcript for a recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(mockTranscript);

      const result = await service.getTranscript('recording-123', mockAdminUser);

      expect(result.transcript.id).toBe('transcript-123');
      expect(result.transcript.full_text).toBe('This is a test transcript.');
      expect(result.transcript.segments).toHaveLength(1);
    });

    it('should throw NotFoundException for non-existent recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      await expect(
        service.getTranscript('nonexistent', mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if transcript does not exist', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(null);

      await expect(
        service.getTranscript('recording-123', mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow revisor role to read transcripts', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(mockTranscript);

      const result = await service.getTranscript('recording-123', mockRevisorUser);

      expect(result.transcript.id).toBe('transcript-123');
    });
  });

  // ============================================================================
  // getTranscriptionStatus
  // ============================================================================

  describe('getTranscriptionStatus', () => {
    it('should return completed status when transcript exists', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(mockTranscript);

      const result = await service.getTranscriptionStatus('recording-123', mockAdminUser);

      expect(result.status).toBe(M21TranscriptionJobStatus.completed);
      expect(result.message).toBe('Transcription completed');
    });

    it('should return processing status when recording is transcribing', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue({
        ...mockRecording,
        status: 'transcribing',
      });
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(null);

      const result = await service.getTranscriptionStatus('recording-123', mockAdminUser);

      expect(result.status).toBe(M21TranscriptionJobStatus.processing);
      expect(result.message).toBe('Transcription in progress');
    });

    it('should return failed status when recording status is failed', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue({
        ...mockRecording,
        status: 'failed',
      });
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(null);

      const result = await service.getTranscriptionStatus('recording-123', mockAdminUser);

      expect(result.status).toBe(M21TranscriptionJobStatus.failed);
      expect(result.message).toBe('Transcription failed');
    });

    it('should return pending status when transcription not started', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(null);

      const result = await service.getTranscriptionStatus('recording-123', mockAdminUser);

      expect(result.status).toBe(M21TranscriptionJobStatus.pending);
      expect(result.message).toBe('Transcription not started');
    });

    it('should throw NotFoundException for non-existent recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      await expect(
        service.getTranscriptionStatus('nonexistent', mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

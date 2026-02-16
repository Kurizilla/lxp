import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { TranscribeJobProcessor } from './transcribe.job';
import { PrismaService } from '../../common/prisma';
import { M21TranscribeJobData } from '../dto/transcription.dto';

describe('TranscribeJobProcessor', () => {
  let processor: TranscribeJobProcessor;

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
    status: 'transcribing',
    metadata: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockTranscript = {
    id: 'transcript-123',
    observation_recording_id: 'recording-123',
    full_text: 'Test transcript text',
    segments: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPrismaService = {
    m21_observation_recordings: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    m21_transcripts: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscribeJobProcessor,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    processor = module.get<TranscribeJobProcessor>(TranscribeJobProcessor);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handleTranscribe', () => {
    it('should successfully process a transcription job', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.create.mockResolvedValue(mockTranscript);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'completed',
      });

      const jobData: M21TranscribeJobData = {
        recording_id: 'recording-123',
        user_id: 'user-123',
        language: 'es',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21TranscribeJobData>;

      const result = await processor.handleTranscribe(mockJob);

      expect(result.success).toBe(true);
      expect(result.recording_id).toBe('recording-123');
      expect(result.transcript_id).toBe('transcript-123');
    });

    it('should return failure if recording not found', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      const jobData: M21TranscribeJobData = {
        recording_id: 'nonexistent',
        user_id: 'user-123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21TranscribeJobData>;

      const result = await processor.handleTranscribe(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recording not found');
    });

    it('should create transcript with stub segments', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.create.mockResolvedValue(mockTranscript);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'completed',
      });

      const jobData: M21TranscribeJobData = {
        recording_id: 'recording-123',
        user_id: 'user-123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21TranscribeJobData>;

      await processor.handleTranscribe(mockJob);

      expect(mockPrismaService.m21_transcripts.create).toHaveBeenCalledWith({
        data: {
          observation_recording_id: 'recording-123',
          full_text: expect.any(String),
          segments: expect.any(Array),
        },
      });
    });

    it('should update recording status to completed after transcription', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.create.mockResolvedValue(mockTranscript);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'completed',
      });

      const jobData: M21TranscribeJobData = {
        recording_id: 'recording-123',
        user_id: 'user-123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21TranscribeJobData>;

      await processor.handleTranscribe(mockJob);

      expect(mockPrismaService.m21_observation_recordings.update).toHaveBeenCalledWith({
        where: { id: 'recording-123' },
        data: { status: 'completed' },
      });
    });

    it('should update recording status to failed on error', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.create.mockRejectedValue(new Error('Database error'));
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'failed',
      });

      const jobData: M21TranscribeJobData = {
        recording_id: 'recording-123',
        user_id: 'user-123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21TranscribeJobData>;

      const result = await processor.handleTranscribe(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(mockPrismaService.m21_observation_recordings.update).toHaveBeenCalledWith({
        where: { id: 'recording-123' },
        data: { status: 'failed' },
      });
    });

    it('should handle language hint in job data', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.create.mockResolvedValue(mockTranscript);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'completed',
      });

      const jobData: M21TranscribeJobData = {
        recording_id: 'recording-123',
        user_id: 'user-123',
        language: 'es',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21TranscribeJobData>;

      const result = await processor.handleTranscribe(mockJob);

      // The stub implementation doesn't use language, but the job should still succeed
      expect(result.success).toBe(true);
    });
  });
});

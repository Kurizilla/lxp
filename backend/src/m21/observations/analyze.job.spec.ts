import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { Prisma } from '@prisma/client';
import { AnalyzeJobProcessor } from './analyze.job';
import { PrismaService } from '../../common/prisma';
import { M21AnalyzeJobData } from '../dto/analysis.dto';

describe('AnalyzeJobProcessor', () => {
  let processor: AnalyzeJobProcessor;

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
    status: 'analyzing',
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

  const mockReport = {
    id: 'report-123',
    observation_recording_id: 'recording-123',
    teacher_score: new Prisma.Decimal(85),
    engagement_score: new Prisma.Decimal(78),
    insights: [],
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
    },
    m21_ai_reports: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyzeJobProcessor,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    processor = module.get<AnalyzeJobProcessor>(AnalyzeJobProcessor);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handleAnalyze', () => {
    it('should successfully process an analysis job', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(mockTranscript);
      mockPrismaService.m21_ai_reports.create.mockResolvedValue(mockReport);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'completed',
      });

      const jobData: M21AnalyzeJobData = {
        recording_id: 'recording-123',
        user_id: 'user-123',
        analysis_type: 'full',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21AnalyzeJobData>;

      const result = await processor.handleAnalyze(mockJob);

      expect(result.success).toBe(true);
      expect(result.recording_id).toBe('recording-123');
      expect(result.report_id).toBe('report-123');
    });

    it('should return failure if recording not found', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      const jobData: M21AnalyzeJobData = {
        recording_id: 'nonexistent',
        user_id: 'user-123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21AnalyzeJobData>;

      const result = await processor.handleAnalyze(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recording not found');
    });

    it('should create AI report with stub insights', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(null); // No transcript
      mockPrismaService.m21_ai_reports.create.mockResolvedValue(mockReport);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'completed',
      });

      const jobData: M21AnalyzeJobData = {
        recording_id: 'recording-123',
        user_id: 'user-123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21AnalyzeJobData>;

      await processor.handleAnalyze(mockJob);

      expect(mockPrismaService.m21_ai_reports.create).toHaveBeenCalledWith({
        data: {
          observation_recording_id: 'recording-123',
          teacher_score: expect.any(Prisma.Decimal),
          engagement_score: expect.any(Prisma.Decimal),
          insights: expect.any(Array),
        },
      });
    });

    it('should update recording status to completed after analysis', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(mockTranscript);
      mockPrismaService.m21_ai_reports.create.mockResolvedValue(mockReport);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'completed',
      });

      const jobData: M21AnalyzeJobData = {
        recording_id: 'recording-123',
        user_id: 'user-123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21AnalyzeJobData>;

      await processor.handleAnalyze(mockJob);

      expect(mockPrismaService.m21_observation_recordings.update).toHaveBeenCalledWith({
        where: { id: 'recording-123' },
        data: { status: 'completed' },
      });
    });

    it('should update recording status to failed on error', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(null);
      mockPrismaService.m21_ai_reports.create.mockRejectedValue(new Error('Database error'));
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'failed',
      });

      const jobData: M21AnalyzeJobData = {
        recording_id: 'recording-123',
        user_id: 'user-123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21AnalyzeJobData>;

      const result = await processor.handleAnalyze(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(mockPrismaService.m21_observation_recordings.update).toHaveBeenCalledWith({
        where: { id: 'recording-123' },
        data: { status: 'failed' },
      });
    });

    it('should handle quick analysis type', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(null);
      mockPrismaService.m21_ai_reports.create.mockResolvedValue(mockReport);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'completed',
      });

      const jobData: M21AnalyzeJobData = {
        recording_id: 'recording-123',
        user_id: 'user-123',
        analysis_type: 'quick',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21AnalyzeJobData>;

      const result = await processor.handleAnalyze(mockJob);

      // The stub implementation should still succeed with quick analysis
      expect(result.success).toBe(true);
    });

    it('should process analysis even without transcript', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_transcripts.findUnique.mockResolvedValue(null); // No transcript
      mockPrismaService.m21_ai_reports.create.mockResolvedValue(mockReport);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'completed',
      });

      const jobData: M21AnalyzeJobData = {
        recording_id: 'recording-123',
        user_id: 'user-123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<M21AnalyzeJobData>;

      const result = await processor.handleAnalyze(mockJob);

      expect(result.success).toBe(true);
      expect(mockPrismaService.m21_ai_reports.create).toHaveBeenCalled();
    });
  });
});

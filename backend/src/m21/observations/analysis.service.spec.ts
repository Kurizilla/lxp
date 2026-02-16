import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { AnalysisService, M21_ANALYZE_JOB } from './analysis.service';
import { PrismaService } from '../../common/prisma';
import { M21AbilityFactory, M21UserWithPermissions } from '../casl/m21-ability.factory';
import { M21_PROCESSING_QUEUE } from '../m21.module';
import { M21AnalysisJobStatus } from '../dto/analysis.dto';

describe('AnalysisService', () => {
  let service: AnalysisService;

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

  const mockReport = {
    id: 'report-123',
    observation_recording_id: 'recording-123',
    teacher_score: 85,
    engagement_score: 78,
    insights: [
      {
        category: 'engagement',
        title: 'Student Participation',
        description: 'Good engagement observed.',
        score: 78,
        recommendations: ['Increase group activities'],
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
    m21_ai_reports: {
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
        AnalysisService,
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

    service = module.get<AnalysisService>(AnalysisService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================================
  // queueAnalysis
  // ============================================================================

  describe('queueAnalysis', () => {
    it('should queue an analysis job for a valid recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_ai_reports.findUnique.mockResolvedValue(null);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'analyzing',
      });

      const result = await service.queueAnalysis(
        'recording-123',
        { analysis_type: 'full' },
        mockAdminUser,
      );

      expect(result.status).toBe(M21AnalysisJobStatus.pending);
      expect(result.job_id).toBe('job-123');
      expect(result.message).toBe('Analysis job queued successfully');
      expect(mockQueue.add).toHaveBeenCalledWith(
        M21_ANALYZE_JOB,
        {
          recording_id: 'recording-123',
          user_id: 'admin-user-123',
          analysis_type: 'full',
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
        service.queueAnalysis('nonexistent', {}, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if recording is not in valid status', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue({
        ...mockRecording,
        status: 'uploading',
      });

      await expect(
        service.queueAnalysis('recording-123', {}, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if AI report already exists', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_ai_reports.findUnique.mockResolvedValue(mockReport);

      await expect(
        service.queueAnalysis('recording-123', {}, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update recording status to analyzing', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_ai_reports.findUnique.mockResolvedValue(null);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'analyzing',
      });

      await service.queueAnalysis('recording-123', {}, mockAdminUser);

      expect(mockPrismaService.m21_observation_recordings.update).toHaveBeenCalledWith({
        where: { id: 'recording-123' },
        data: { status: 'analyzing' },
      });
    });

    it('should allow analysis on recordings with completed status', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue({
        ...mockRecording,
        status: 'completed',
      });
      mockPrismaService.m21_ai_reports.findUnique.mockResolvedValue(null);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'analyzing',
      });

      const result = await service.queueAnalysis('recording-123', {}, mockAdminUser);

      expect(result.status).toBe(M21AnalysisJobStatus.pending);
    });
  });

  // ============================================================================
  // getReport
  // ============================================================================

  describe('getReport', () => {
    it('should return AI report for a recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_ai_reports.findUnique.mockResolvedValue(mockReport);

      const result = await service.getReport('recording-123', mockAdminUser);

      expect(result.report.id).toBe('report-123');
      expect(result.report.teacher_score).toBe(85);
      expect(result.report.engagement_score).toBe(78);
      expect(result.report.insights).toHaveLength(1);
    });

    it('should throw NotFoundException for non-existent recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      await expect(
        service.getReport('nonexistent', mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if AI report does not exist', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_ai_reports.findUnique.mockResolvedValue(null);

      await expect(
        service.getReport('recording-123', mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow revisor role to read AI reports', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_ai_reports.findUnique.mockResolvedValue(mockReport);

      const result = await service.getReport('recording-123', mockRevisorUser);

      expect(result.report.id).toBe('report-123');
    });
  });

  // ============================================================================
  // getAnalysisStatus
  // ============================================================================

  describe('getAnalysisStatus', () => {
    it('should return completed status when AI report exists', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_ai_reports.findUnique.mockResolvedValue(mockReport);

      const result = await service.getAnalysisStatus('recording-123', mockAdminUser);

      expect(result.status).toBe(M21AnalysisJobStatus.completed);
      expect(result.message).toBe('Analysis completed');
    });

    it('should return processing status when recording is analyzing', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue({
        ...mockRecording,
        status: 'analyzing',
      });
      mockPrismaService.m21_ai_reports.findUnique.mockResolvedValue(null);

      const result = await service.getAnalysisStatus('recording-123', mockAdminUser);

      expect(result.status).toBe(M21AnalysisJobStatus.processing);
      expect(result.message).toBe('Analysis in progress');
    });

    it('should return failed status when recording status is failed', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue({
        ...mockRecording,
        status: 'failed',
      });
      mockPrismaService.m21_ai_reports.findUnique.mockResolvedValue(null);

      const result = await service.getAnalysisStatus('recording-123', mockAdminUser);

      expect(result.status).toBe(M21AnalysisJobStatus.failed);
      expect(result.message).toBe('Analysis failed');
    });

    it('should return pending status when analysis not started', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_ai_reports.findUnique.mockResolvedValue(null);

      const result = await service.getAnalysisStatus('recording-123', mockAdminUser);

      expect(result.status).toBe(M21AnalysisJobStatus.pending);
      expect(result.message).toBe('Analysis not started');
    });

    it('should throw NotFoundException for non-existent recording', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      await expect(
        service.getAnalysisStatus('nonexistent', mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

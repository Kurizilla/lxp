import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../common/prisma';
import { M21AbilityFactory, M21UserWithPermissions } from '../casl/m21-ability.factory';
import {
  M21RequestAnalysisDto,
  M21AiReportDto,
  M21AiReportResponseDto,
  M21AnalysisJobResponseDto,
  M21AnalysisJobStatus,
  M21AnalyzeJobData,
  M21InsightDto,
} from '../dto/analysis.dto';
import { M21_PROCESSING_QUEUE } from '../m21.module';

/**
 * Job name for analysis jobs in the queue
 */
export const M21_ANALYZE_JOB = 'm21_analyze';

/**
 * Service for managing AI analysis jobs and retrieving reports
 * 
 * Handles:
 * - Queueing analysis jobs via BullMQ
 * - Retrieving AI reports for observation recordings
 * - Checking analysis job status
 */
@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: M21AbilityFactory,
    @InjectQueue(M21_PROCESSING_QUEUE) private readonly processingQueue: Queue<M21AnalyzeJobData>,
  ) {}

  /**
   * Queue an AI analysis job for a recording
   * 
   * @param recordingId - The ID of the recording to analyze
   * @param dto - Optional analysis parameters
   * @param userWithPermissions - The authenticated user
   * @returns Job status response
   */
  async queueAnalysis(
    recordingId: string,
    dto: M21RequestAnalysisDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21AnalysisJobResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to analyze recordings',
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

    // Check if recording is in a valid state for analysis
    // Analysis can run on recordings that are 'ready', 'completed', or 'transcribing'
    const validStatuses = ['ready', 'completed', 'transcribing'];
    if (!validStatuses.includes(recording.status)) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: `Recording must be in 'ready', 'completed', or 'transcribing' status to analyze. Current status: ${recording.status}`,
      });
    }

    // Check if AI report already exists
    const existingReport = await this.prisma.m21_ai_reports.findUnique({
      where: { observation_recording_id: recordingId },
    });

    if (existingReport) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'AI report already exists for this recording',
      });
    }

    // Update recording status to analyzing
    await this.prisma.m21_observation_recordings.update({
      where: { id: recordingId },
      data: { status: 'analyzing' },
    });

    // Queue the analysis job
    const jobData: M21AnalyzeJobData = {
      recording_id: recordingId,
      user_id: userWithPermissions.id,
      analysis_type: dto.analysis_type,
      priority: dto.priority,
    };

    const job = await this.processingQueue.add(M21_ANALYZE_JOB, jobData, {
      priority: dto.priority || 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    this.logger.log(`Queued analysis job ${job.id} for recording ${recordingId}`);

    return {
      job_id: job.id?.toString() || 'unknown',
      recording_id: recordingId,
      status: M21AnalysisJobStatus.pending,
      message: 'Analysis job queued successfully',
      created_at: new Date(),
    };
  }

  /**
   * Get the AI report for a recording
   * 
   * @param recordingId - The ID of the recording
   * @param userWithPermissions - The authenticated user
   * @returns The AI report response
   */
  async getReport(
    recordingId: string,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21AiReportResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view AI reports',
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

    // Get the AI report
    const report = await this.prisma.m21_ai_reports.findUnique({
      where: { observation_recording_id: recordingId },
    });

    if (!report) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `AI report not found for recording ${recordingId}`,
      });
    }

    const reportDto: M21AiReportDto = {
      id: report.id,
      observation_recording_id: report.observation_recording_id,
      teacher_score: report.teacher_score ? Number(report.teacher_score) : null,
      engagement_score: report.engagement_score ? Number(report.engagement_score) : null,
      insights: report.insights as M21InsightDto[] | null,
      created_at: report.created_at,
      updated_at: report.updated_at,
    };

    this.logger.log(`Retrieved AI report ${report.id} for recording ${recordingId}`);

    return {
      report: reportDto,
    };
  }

  /**
   * Get the status of an analysis job
   * 
   * @param recordingId - The ID of the recording
   * @param userWithPermissions - The authenticated user
   * @returns The job status
   */
  async getAnalysisStatus(
    recordingId: string,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21AnalysisJobResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to check analysis status',
      });
    }

    // Get recording to check status
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

    // Check if AI report exists
    const report = await this.prisma.m21_ai_reports.findUnique({
      where: { observation_recording_id: recordingId },
    });

    let status: M21AnalysisJobStatus;
    let message: string;

    if (report) {
      status = M21AnalysisJobStatus.completed;
      message = 'Analysis completed';
    } else if (recording.status === 'analyzing') {
      status = M21AnalysisJobStatus.processing;
      message = 'Analysis in progress';
    } else if (recording.status === 'failed') {
      status = M21AnalysisJobStatus.failed;
      message = 'Analysis failed';
    } else {
      status = M21AnalysisJobStatus.pending;
      message = 'Analysis not started';
    }

    return {
      job_id: 'status-check',
      recording_id: recordingId,
      status,
      message,
    };
  }
}

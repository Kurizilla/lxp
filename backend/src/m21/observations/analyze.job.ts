import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma';
import { M21_PROCESSING_QUEUE } from '../m21.module';
import { M21_ANALYZE_JOB } from './analysis.service';
import {
  M21AnalyzeJobData,
  M21AnalyzeJobResult,
  M21InsightDto,
} from '../dto/analysis.dto';

/**
 * Stub AI insights for demo/testing purposes
 * Simulates what an AI analysis service would return
 */
const STUB_INSIGHTS: M21InsightDto[] = [
  {
    category: 'classroom_management',
    title: 'Effective Classroom Control',
    description: 'The teacher demonstrates strong classroom management skills, maintaining student attention throughout the lesson.',
    score: 85,
    recommendations: [
      'Continue using positive reinforcement techniques',
      'Consider implementing more structured transitions between activities',
    ],
    timestamp_seconds: 120,
  },
  {
    category: 'engagement',
    title: 'Student Participation',
    description: 'Good level of student participation observed with multiple students responding to questions.',
    score: 78,
    recommendations: [
      'Try incorporating more group activities to engage quieter students',
      'Use wait time after questions to encourage more responses',
    ],
    timestamp_seconds: 300,
  },
  {
    category: 'pedagogy',
    title: 'Clear Learning Objectives',
    description: 'Learning objectives were clearly stated at the beginning of the lesson and referenced throughout.',
    score: 90,
    recommendations: [
      'Consider connecting objectives to real-world applications',
      'Summarize key points at the end of each section',
    ],
    timestamp_seconds: 45,
  },
  {
    category: 'communication',
    title: 'Clear Instructions',
    description: 'Instructions were given clearly with appropriate pacing. Teacher checked for understanding before proceeding.',
    score: 82,
    recommendations: [
      'Consider using visual aids to supplement verbal instructions',
      'Repeat key instructions for complex tasks',
    ],
    timestamp_seconds: 180,
  },
  {
    category: 'differentiation',
    title: 'Individual Attention',
    description: 'Teacher provided individual support to students who needed extra help.',
    score: 75,
    recommendations: [
      'Prepare differentiated materials for varying skill levels',
      'Consider peer tutoring strategies for advanced students',
    ],
    timestamp_seconds: 420,
  },
];

/**
 * Calculate overall teacher score from insights
 */
function calculateTeacherScore(insights: M21InsightDto[]): number {
  const scores = insights.filter(i => i.score !== undefined).map(i => i.score as number);
  if (scores.length === 0) return 75;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round(sum / scores.length);
}

/**
 * Calculate engagement score from insights
 */
function calculateEngagementScore(insights: M21InsightDto[]): number {
  const engagementInsight = insights.find(i => i.category === 'engagement');
  if (engagementInsight?.score !== undefined) {
    return engagementInsight.score;
  }
  // Default engagement score with some variation
  return Math.floor(Math.random() * 20) + 70; // 70-90
}

/**
 * Processor for M21 AI analysis jobs
 * 
 * This processor handles analysis jobs from the BullMQ queue.
 * Currently implements a stub that saves static insights and scores
 * to simulate AI analysis output.
 * 
 * In production, this would integrate with:
 * - OpenAI GPT-4 for text analysis
 * - Custom ML models for classroom observation
 * - Video/audio analysis services
 * - or similar AI analysis services
 */
@Processor(M21_PROCESSING_QUEUE)
export class AnalyzeJobProcessor {
  private readonly logger = new Logger(AnalyzeJobProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process an AI analysis job
   * 
   * STUB IMPLEMENTATION: Creates an AI report with static demo insights
   * In production, this would:
   * 1. Fetch the transcript and recording metadata
   * 2. Send to AI analysis service
   * 3. Parse and structure the response
   * 4. Calculate scores based on rubrics
   * 5. Save to database
   * 
   * @param job - The Bull job containing analysis data
   * @returns The result of the analysis job
   */
  @Process(M21_ANALYZE_JOB)
  async handleAnalyze(job: Job<M21AnalyzeJobData>): Promise<M21AnalyzeJobResult> {
    const { recording_id, user_id, analysis_type } = job.data;

    this.logger.log(`Processing analysis job ${job.id} for recording ${recording_id}`);
    this.logger.log(`User: ${user_id}, Analysis type: ${analysis_type || 'full'}`);

    try {
      // Verify recording exists
      const recording = await this.prisma.m21_observation_recordings.findUnique({
        where: { id: recording_id },
      });

      if (!recording) {
        this.logger.error(`Recording ${recording_id} not found`);
        return {
          success: false,
          recording_id,
          error: 'Recording not found',
        };
      }

      // STUB: Simulate processing time (1-3 seconds)
      await this.simulateProcessingDelay();

      // Check if transcript exists (optional for analysis, but good to have)
      const transcript = await this.prisma.m21_transcripts.findUnique({
        where: { observation_recording_id: recording_id },
      });

      if (transcript) {
        this.logger.log(`Found transcript for recording ${recording_id}, using for analysis`);
      } else {
        this.logger.log(`No transcript found for recording ${recording_id}, using metadata only`);
      }

      // Generate stub insights
      const insights = this.generateStubInsights(analysis_type);
      const teacherScore = calculateTeacherScore(insights);
      const engagementScore = calculateEngagementScore(insights);

      // Create the AI report record
      const report = await this.prisma.m21_ai_reports.create({
        data: {
          observation_recording_id: recording_id,
          teacher_score: new Prisma.Decimal(teacherScore),
          engagement_score: new Prisma.Decimal(engagementScore),
          insights: insights as unknown as Prisma.InputJsonValue,
        },
      });

      // Update recording status to completed
      await this.prisma.m21_observation_recordings.update({
        where: { id: recording_id },
        data: { status: 'completed' },
      });

      this.logger.log(`Analysis completed for recording ${recording_id}, report ID: ${report.id}`);
      this.logger.log(`Teacher score: ${teacherScore}, Engagement score: ${engagementScore}`);

      return {
        success: true,
        recording_id,
        report_id: report.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Analysis failed for recording ${recording_id}: ${errorMessage}`);

      // Update recording status to failed
      try {
        await this.prisma.m21_observation_recordings.update({
          where: { id: recording_id },
          data: { status: 'failed' },
        });
      } catch (updateError) {
        this.logger.error(`Failed to update recording status: ${updateError}`);
      }

      return {
        success: false,
        recording_id,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate stub insights based on analysis type
   * In production, this would be replaced by actual AI analysis
   */
  private generateStubInsights(analysisType?: string): M21InsightDto[] {
    if (analysisType === 'quick') {
      // Return only engagement and classroom management for quick analysis
      return STUB_INSIGHTS.filter(
        i => i.category === 'engagement' || i.category === 'classroom_management'
      );
    }

    if (analysisType === 'engagement_only') {
      return STUB_INSIGHTS.filter(i => i.category === 'engagement');
    }

    // Full analysis returns all insights
    return STUB_INSIGHTS;
  }

  /**
   * Simulate processing delay for stub implementation
   * In production, this would be the actual AI analysis time
   */
  private async simulateProcessingDelay(): Promise<void> {
    const delayMs = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

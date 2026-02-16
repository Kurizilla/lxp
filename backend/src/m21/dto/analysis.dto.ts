import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

/**
 * Analysis job status enum
 */
export enum M21AnalysisJobStatus {
  pending = 'pending',
  processing = 'processing',
  completed = 'completed',
  failed = 'failed',
}

/**
 * DTO for requesting AI analysis of a recording
 */
export class M21RequestAnalysisDto {
  @IsString()
  @IsOptional()
  analysis_type?: string; // Optional type of analysis (e.g., 'full', 'quick', 'engagement_only')

  @IsNumber()
  @IsOptional()
  @Min(0)
  priority?: number; // Optional job priority
}

/**
 * Insight item in the AI report
 */
export interface M21InsightDto {
  category: string; // e.g., 'classroom_management', 'engagement', 'pedagogy', 'communication'
  title: string;
  description: string;
  score?: number; // 0-100
  recommendations?: string[];
  timestamp_seconds?: number; // Reference to specific moment in recording
}

/**
 * DTO for AI report data
 */
export interface M21AiReportDto {
  id: string;
  observation_recording_id: string;
  teacher_score: number | null; // 0-100 overall score
  engagement_score: number | null; // 0-100 engagement score
  insights: M21InsightDto[] | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Response DTO for AI report retrieval
 */
export interface M21AiReportResponseDto {
  report: M21AiReportDto;
  message?: string;
}

/**
 * Response DTO for analysis job status
 */
export interface M21AnalysisJobResponseDto {
  job_id: string;
  recording_id: string;
  status: M21AnalysisJobStatus;
  message: string;
  created_at?: Date;
}

/**
 * Data passed to the analysis job queue
 */
export interface M21AnalyzeJobData {
  recording_id: string;
  user_id: string;
  analysis_type?: string;
  priority?: number;
}

/**
 * Result from the analysis job
 */
export interface M21AnalyzeJobResult {
  success: boolean;
  recording_id: string;
  report_id?: string;
  error?: string;
}

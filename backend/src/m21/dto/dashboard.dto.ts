import {
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  IsDateString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ============================================================================
// QUERY DTOs - Input validation
// ============================================================================

/**
 * Query parameters for dashboard summary list
 * M21-F03-A: Summary list with offset pagination
 */
export class M21DashboardSummaryQueryDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @IsUUID()
  @IsOptional()
  teacher_id?: string;

  @IsUUID()
  @IsOptional()
  class_id?: string;

  @IsUUID()
  @IsOptional()
  institution_id?: string;

  @IsDateString()
  @IsOptional()
  date_from?: string;

  @IsDateString()
  @IsOptional()
  date_to?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

/**
 * Query parameters for teacher metrics
 * M21-F03-B: Teacher metrics aggregation
 */
export class M21TeacherMetricsQueryDto {
  @IsUUID()
  teacher_id!: string;

  @IsDateString()
  @IsOptional()
  date_from?: string;

  @IsDateString()
  @IsOptional()
  date_to?: string;

  @IsUUID()
  @IsOptional()
  class_id?: string;
}

/**
 * Query parameters for class engagement trends
 * M21-F03-C: Class engagement trends with JSONB aggregates
 */
export class M21EngagementTrendsQueryDto {
  @IsUUID()
  class_id!: string;

  @IsDateString()
  @IsOptional()
  date_from?: string;

  @IsDateString()
  @IsOptional()
  date_to?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value || 'weekly')
  interval?: 'daily' | 'weekly' | 'monthly';

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

/**
 * DTO for comparing two sessions
 * M21-F03-D: POST compare two sessions
 */
export class M21CompareSessionsDto {
  @IsUUID()
  session_a_id!: string;

  @IsUUID()
  session_b_id!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metrics?: string[]; // Optional: specify which metrics to compare
}

// ============================================================================
// RESPONSE DTOs - Output shapes
// ============================================================================

/**
 * Summary item for dashboard list
 */
export interface M21DashboardSummaryItemDto {
  id: string;
  session_date: Date;
  class_id: string;
  class_name: string;
  teacher_id: string;
  teacher_name: string;
  status: string;
  duration_seconds: number | null;
  teacher_score: number | null;
  engagement_score: number | null;
  annotation_count: number;
  review_status: string | null;
  created_at: Date;
}

/**
 * Response for dashboard summary list
 */
export interface M21DashboardSummaryResponseDto {
  summary: M21DashboardSummaryItemDto[];
  total: number;
  offset: number;
  limit: number;
  aggregates: {
    total_recordings: number;
    avg_teacher_score: number | null;
    avg_engagement_score: number | null;
    total_duration_seconds: number;
  };
}

/**
 * Teacher metrics data
 */
export interface M21TeacherMetricsDto {
  teacher_id: string;
  teacher_name: string;
  total_observations: number;
  avg_teacher_score: number | null;
  avg_engagement_score: number | null;
  total_duration_seconds: number;
  completed_reviews: number;
  pending_reviews: number;
  score_trend: M21ScoreTrendItemDto[];
  insights_summary: M21InsightsSummaryDto;
}

/**
 * Score trend item for metrics
 */
export interface M21ScoreTrendItemDto {
  period: string; // ISO date or period identifier
  teacher_score: number | null;
  engagement_score: number | null;
  observation_count: number;
}

/**
 * Insights summary from AI reports
 */
export interface M21InsightsSummaryDto {
  total_insights: number;
  by_category: Record<string, number>;
  top_strengths: string[];
  top_improvements: string[];
}

/**
 * Response for teacher metrics
 */
export interface M21TeacherMetricsResponseDto {
  metrics: M21TeacherMetricsDto;
  date_range: {
    from: string | null;
    to: string | null;
  };
}

/**
 * Engagement trend data point
 */
export interface M21EngagementTrendPointDto {
  period: string;
  period_start: Date;
  period_end: Date;
  observation_count: number;
  avg_engagement_score: number | null;
  avg_teacher_score: number | null;
  total_duration_seconds: number;
  insights_data: Record<string, unknown> | null;
}

/**
 * Response for engagement trends
 */
export interface M21EngagementTrendsResponseDto {
  class_id: string;
  class_name: string;
  trends: M21EngagementTrendPointDto[];
  total: number;
  offset: number;
  limit: number;
  overall: {
    avg_engagement_score: number | null;
    avg_teacher_score: number | null;
    total_observations: number;
    total_duration_seconds: number;
  };
}

/**
 * Session data for comparison
 */
export interface M21SessionComparisonDataDto {
  id: string;
  session_date: Date;
  class_id: string;
  class_name: string;
  teacher_id: string;
  teacher_name: string;
  duration_seconds: number | null;
  teacher_score: number | null;
  engagement_score: number | null;
  annotation_count: number;
  insights: M21ComparisonInsightDto[];
}

/**
 * Insight for comparison
 */
export interface M21ComparisonInsightDto {
  category: string;
  title: string;
  score: number | null;
}

/**
 * Comparison result for a specific metric
 */
export interface M21MetricComparisonDto {
  metric: string;
  session_a_value: number | null;
  session_b_value: number | null;
  difference: number | null;
  percent_change: number | null;
  trend: 'improved' | 'declined' | 'unchanged' | 'na';
}

/**
 * Response for session comparison
 */
export interface M21CompareSessionsResponseDto {
  session_a: M21SessionComparisonDataDto;
  session_b: M21SessionComparisonDataDto;
  comparisons: M21MetricComparisonDto[];
  summary: {
    overall_improvement: boolean;
    improved_metrics: number;
    declined_metrics: number;
    unchanged_metrics: number;
  };
}

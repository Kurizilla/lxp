import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma';
import { M21AbilityFactory, M21UserWithPermissions } from '../casl/m21-ability.factory';
import {
  M21DashboardSummaryQueryDto,
  M21DashboardSummaryResponseDto,
  M21DashboardSummaryItemDto,
  M21TeacherMetricsQueryDto,
  M21TeacherMetricsResponseDto,
  M21TeacherMetricsDto,
  M21ScoreTrendItemDto,
  M21InsightsSummaryDto,
  M21EngagementTrendsQueryDto,
  M21EngagementTrendsResponseDto,
  M21EngagementTrendPointDto,
  M21CompareSessionsDto,
  M21CompareSessionsResponseDto,
  M21SessionComparisonDataDto,
  M21MetricComparisonDto,
  M21ComparisonInsightDto,
} from '../dto/dashboard.dto';

/**
 * Service for M21 Dashboard operations
 * Provides aggregated queries for summary, metrics, engagement trends, and session comparison
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: M21AbilityFactory,
  ) {}

  // ============================================================================
  // M21-F03-A: DASHBOARD SUMMARY LIST
  // ============================================================================

  /**
   * Get dashboard summary list with offset pagination and aggregates
   */
  async getSummaryList(
    query: M21DashboardSummaryQueryDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21DashboardSummaryResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view dashboard data',
      });
    }

    const offset = query.offset || 0;
    const limit = Math.min(query.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);

    // Build where clause
    const whereClause: Prisma.m21_observation_recordingsWhereInput = {};

    if (query.teacher_id) {
      whereClause.teacher_id = query.teacher_id;
    }
    if (query.class_id) {
      whereClause.class_id = query.class_id;
    }
    if (query.status) {
      whereClause.status = query.status as Prisma.EnumM21ObservationRecordingStatusFilter;
    }
    if (query.date_from || query.date_to) {
      whereClause.session_date = {};
      if (query.date_from) {
        whereClause.session_date.gte = new Date(query.date_from);
      }
      if (query.date_to) {
        whereClause.session_date.lte = new Date(query.date_to);
      }
    }
    if (query.institution_id) {
      whereClause.classroom = {
        institution_id: query.institution_id,
      };
    }

    // Fetch recordings with related data
    const [recordings, total] = await Promise.all([
      this.prisma.m21_observation_recordings.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: { session_date: 'desc' },
        include: {
          classroom: {
            select: {
              id: true,
              name: true,
            },
          },
          teacher: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
          ai_reports: {
            select: {
              teacher_score: true,
              engagement_score: true,
            },
          },
          annotations: {
            select: {
              id: true,
            },
          },
          review_progress: {
            select: {
              status: true,
            },
            take: 1,
            orderBy: { updated_at: 'desc' },
          },
        },
      }),
      this.prisma.m21_observation_recordings.count({ where: whereClause }),
    ]);

    // Calculate aggregates
    const aggregateResult = await this.prisma.m21_observation_recordings.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { duration_seconds: true },
    });

    // Get average scores from AI reports
    const scoreAggregates = await this.prisma.m21_ai_reports.aggregate({
      where: {
        observation_recording: whereClause,
      },
      _avg: {
        teacher_score: true,
        engagement_score: true,
      },
    });

    // Map to response DTOs
    const summaryItems: M21DashboardSummaryItemDto[] = recordings.map((rec) => {
      // ai_reports is an array due to Prisma's relation definition, but logically 1:1 (unique constraint)
      const aiReport = rec.ai_reports[0];
      const reviewProgress = rec.review_progress[0];

      return {
        id: rec.id,
        session_date: rec.session_date,
        class_id: rec.class_id,
        class_name: rec.classroom?.name || 'Unknown',
        teacher_id: rec.teacher_id,
        teacher_name: rec.teacher
          ? `${rec.teacher.first_name || ''} ${rec.teacher.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown',
        status: rec.status,
        duration_seconds: rec.duration_seconds,
        teacher_score: aiReport?.teacher_score ? Number(aiReport.teacher_score) : null,
        engagement_score: aiReport?.engagement_score ? Number(aiReport.engagement_score) : null,
        annotation_count: rec.annotations.length,
        review_status: reviewProgress?.status || null,
        created_at: rec.created_at,
      };
    });

    this.logger.log(`Retrieved dashboard summary: ${summaryItems.length} items for user ${userWithPermissions.email}`);

    return {
      summary: summaryItems,
      total,
      offset,
      limit,
      aggregates: {
        total_recordings: aggregateResult._count.id,
        avg_teacher_score: scoreAggregates._avg.teacher_score
          ? Number(scoreAggregates._avg.teacher_score)
          : null,
        avg_engagement_score: scoreAggregates._avg.engagement_score
          ? Number(scoreAggregates._avg.engagement_score)
          : null,
        total_duration_seconds: aggregateResult._sum.duration_seconds || 0,
      },
    };
  }

  // ============================================================================
  // M21-F03-B: TEACHER METRICS
  // ============================================================================

  /**
   * Get aggregated metrics for a specific teacher
   */
  async getTeacherMetrics(
    query: M21TeacherMetricsQueryDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21TeacherMetricsResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view teacher metrics',
      });
    }

    // Verify teacher exists
    const teacher = await this.prisma.m01_users.findUnique({
      where: { id: query.teacher_id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Teacher with ID ${query.teacher_id} not found`,
      });
    }

    // Build where clause for recordings
    const whereClause: Prisma.m21_observation_recordingsWhereInput = {
      teacher_id: query.teacher_id,
    };

    if (query.class_id) {
      whereClause.class_id = query.class_id;
    }
    if (query.date_from || query.date_to) {
      whereClause.session_date = {};
      if (query.date_from) {
        whereClause.session_date.gte = new Date(query.date_from);
      }
      if (query.date_to) {
        whereClause.session_date.lte = new Date(query.date_to);
      }
    }

    // Get basic aggregates
    const [recordingStats, scoreStats, reviewStats] = await Promise.all([
      this.prisma.m21_observation_recordings.aggregate({
        where: whereClause,
        _count: { id: true },
        _sum: { duration_seconds: true },
      }),
      this.prisma.m21_ai_reports.aggregate({
        where: { observation_recording: whereClause },
        _avg: {
          teacher_score: true,
          engagement_score: true,
        },
      }),
      this.prisma.m21_review_progress.groupBy({
        by: ['status'],
        where: {
          observation_recording: whereClause,
        },
        _count: { id: true },
      }),
    ]);

    // Calculate review counts
    let completedReviews = 0;
    let pendingReviews = 0;
    for (const stat of reviewStats) {
      if (stat.status === 'completed') {
        completedReviews = stat._count.id;
      } else if (['not_started', 'in_progress', 'review_pending'].includes(stat.status)) {
        pendingReviews += stat._count.id;
      }
    }

    // Get score trends (grouped by month)
    const scoreTrend = await this.getScoreTrend(whereClause);

    // Get insights summary from AI reports
    const insightsSummary = await this.getInsightsSummary(whereClause);

    const metrics: M21TeacherMetricsDto = {
      teacher_id: teacher.id,
      teacher_name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Unknown',
      total_observations: recordingStats._count.id,
      avg_teacher_score: scoreStats._avg.teacher_score
        ? Number(scoreStats._avg.teacher_score)
        : null,
      avg_engagement_score: scoreStats._avg.engagement_score
        ? Number(scoreStats._avg.engagement_score)
        : null,
      total_duration_seconds: recordingStats._sum.duration_seconds || 0,
      completed_reviews: completedReviews,
      pending_reviews: pendingReviews,
      score_trend: scoreTrend,
      insights_summary: insightsSummary,
    };

    this.logger.log(`Retrieved teacher metrics for ${query.teacher_id}`);

    return {
      metrics,
      date_range: {
        from: query.date_from || null,
        to: query.date_to || null,
      },
    };
  }

  /**
   * Get score trends grouped by month
   */
  private async getScoreTrend(
    whereClause: Prisma.m21_observation_recordingsWhereInput,
  ): Promise<M21ScoreTrendItemDto[]> {
    // Get recordings with their AI reports grouped by month
    const recordings = await this.prisma.m21_observation_recordings.findMany({
      where: whereClause,
      select: {
        session_date: true,
        ai_reports: {
          select: {
            teacher_score: true,
            engagement_score: true,
          },
        },
      },
      orderBy: { session_date: 'asc' },
    });

    // Group by month
    const monthlyData = new Map<string, {
      teacher_scores: number[];
      engagement_scores: number[];
      count: number;
    }>();

    for (const rec of recordings) {
      const monthKey = rec.session_date.toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyData.get(monthKey) || {
        teacher_scores: [],
        engagement_scores: [],
        count: 0,
      };

      existing.count++;
      // ai_reports is an array due to Prisma's relation definition, but logically 1:1 (unique constraint)
      const aiReport = rec.ai_reports[0];
      if (aiReport?.teacher_score) {
        existing.teacher_scores.push(Number(aiReport.teacher_score));
      }
      if (aiReport?.engagement_score) {
        existing.engagement_scores.push(Number(aiReport.engagement_score));
      }

      monthlyData.set(monthKey, existing);
    }

    // Convert to response format
    const trend: M21ScoreTrendItemDto[] = [];
    for (const [period, data] of monthlyData) {
      const avgTeacher = data.teacher_scores.length > 0
        ? data.teacher_scores.reduce((a, b) => a + b, 0) / data.teacher_scores.length
        : null;
      const avgEngagement = data.engagement_scores.length > 0
        ? data.engagement_scores.reduce((a, b) => a + b, 0) / data.engagement_scores.length
        : null;

      trend.push({
        period,
        teacher_score: avgTeacher ? Math.round(avgTeacher * 100) / 100 : null,
        engagement_score: avgEngagement ? Math.round(avgEngagement * 100) / 100 : null,
        observation_count: data.count,
      });
    }

    return trend;
  }

  /**
   * Get insights summary from AI reports (JSONB aggregate)
   */
  private async getInsightsSummary(
    whereClause: Prisma.m21_observation_recordingsWhereInput,
  ): Promise<M21InsightsSummaryDto> {
    const aiReports = await this.prisma.m21_ai_reports.findMany({
      where: { observation_recording: whereClause },
      select: { insights: true },
    });

    const categoryCounts: Record<string, number> = {};
    const strengths: Map<string, number> = new Map();
    const improvements: Map<string, number> = new Map();
    let totalInsights = 0;

    for (const report of aiReports) {
      if (!report.insights || !Array.isArray(report.insights)) continue;

      for (const insight of report.insights as Array<{
        category?: string;
        title?: string;
        score?: number;
        recommendations?: string[];
      }>) {
        totalInsights++;

        // Count by category
        if (insight.category) {
          categoryCounts[insight.category] = (categoryCounts[insight.category] || 0) + 1;
        }

        // Categorize as strength or improvement based on score
        if (insight.title) {
          if (insight.score !== undefined && insight.score >= 70) {
            strengths.set(insight.title, (strengths.get(insight.title) || 0) + 1);
          } else if (insight.score !== undefined && insight.score < 50) {
            improvements.set(insight.title, (improvements.get(insight.title) || 0) + 1);
          }
        }
      }
    }

    // Get top 5 strengths and improvements
    const topStrengths = Array.from(strengths.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title]) => title);

    const topImprovements = Array.from(improvements.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title]) => title);

    return {
      total_insights: totalInsights,
      by_category: categoryCounts,
      top_strengths: topStrengths,
      top_improvements: topImprovements,
    };
  }

  // ============================================================================
  // M21-F03-C: CLASS ENGAGEMENT TRENDS
  // ============================================================================

  /**
   * Get engagement trends for a class over time with JSONB aggregates
   */
  async getEngagementTrends(
    query: M21EngagementTrendsQueryDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21EngagementTrendsResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view engagement trends',
      });
    }

    // Verify classroom exists
    const classroom = await this.prisma.m01_classrooms.findUnique({
      where: { id: query.class_id },
      select: {
        id: true,
        name: true,
      },
    });

    if (!classroom) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Classroom with ID ${query.class_id} not found`,
      });
    }

    const offset = query.offset || 0;
    const limit = Math.min(query.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
    const interval = query.interval || 'weekly';

    // Build where clause
    const whereClause: Prisma.m21_observation_recordingsWhereInput = {
      class_id: query.class_id,
    };

    if (query.date_from || query.date_to) {
      whereClause.session_date = {};
      if (query.date_from) {
        whereClause.session_date.gte = new Date(query.date_from);
      }
      if (query.date_to) {
        whereClause.session_date.lte = new Date(query.date_to);
      }
    }

    // Get recordings with AI reports
    const recordings = await this.prisma.m21_observation_recordings.findMany({
      where: whereClause,
      select: {
        id: true,
        session_date: true,
        duration_seconds: true,
        ai_reports: {
          select: {
            teacher_score: true,
            engagement_score: true,
            insights: true,
          },
        },
      },
      orderBy: { session_date: 'asc' },
    });

    // Group by period
    const periods = this.groupByPeriod(recordings, interval);

    // Apply pagination to periods
    const allPeriods = Array.from(periods.entries());
    const paginatedPeriods = allPeriods.slice(offset, offset + limit);

    // Calculate overall aggregates
    const overallStats = await this.prisma.m21_ai_reports.aggregate({
      where: { observation_recording: whereClause },
      _avg: {
        teacher_score: true,
        engagement_score: true,
      },
    });

    const recordingStats = await this.prisma.m21_observation_recordings.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { duration_seconds: true },
    });

    // Convert to response format
    const trends: M21EngagementTrendPointDto[] = paginatedPeriods.map(([periodKey, data]) => ({
      period: periodKey,
      period_start: data.start,
      period_end: data.end,
      observation_count: data.count,
      avg_engagement_score: data.engagement_scores.length > 0
        ? Math.round(
            (data.engagement_scores.reduce((a, b) => a + b, 0) / data.engagement_scores.length) * 100
          ) / 100
        : null,
      avg_teacher_score: data.teacher_scores.length > 0
        ? Math.round(
            (data.teacher_scores.reduce((a, b) => a + b, 0) / data.teacher_scores.length) * 100
          ) / 100
        : null,
      total_duration_seconds: data.total_duration,
      insights_data: data.insights_aggregate,
    }));

    this.logger.log(`Retrieved engagement trends for class ${query.class_id}`);

    return {
      class_id: classroom.id,
      class_name: classroom.name,
      trends,
      total: allPeriods.length,
      offset,
      limit,
      overall: {
        avg_engagement_score: overallStats._avg.engagement_score
          ? Number(overallStats._avg.engagement_score)
          : null,
        avg_teacher_score: overallStats._avg.teacher_score
          ? Number(overallStats._avg.teacher_score)
          : null,
        total_observations: recordingStats._count.id,
        total_duration_seconds: recordingStats._sum.duration_seconds || 0,
      },
    };
  }

  /**
   * Group recordings by period (daily, weekly, or monthly)
   */
  private groupByPeriod(
    recordings: Array<{
      id: string;
      session_date: Date;
      duration_seconds: number | null;
      ai_reports: Array<{
        teacher_score: Prisma.Decimal | null;
        engagement_score: Prisma.Decimal | null;
        insights: Prisma.JsonValue;
      }>;
    }>,
    interval: 'daily' | 'weekly' | 'monthly',
  ): Map<string, {
    start: Date;
    end: Date;
    count: number;
    teacher_scores: number[];
    engagement_scores: number[];
    total_duration: number;
    insights_aggregate: Record<string, unknown>;
  }> {
    const periods = new Map<string, {
      start: Date;
      end: Date;
      count: number;
      teacher_scores: number[];
      engagement_scores: number[];
      total_duration: number;
      insights_aggregate: Record<string, unknown>;
    }>();

    for (const rec of recordings) {
      const date = new Date(rec.session_date);
      const { periodKey, periodStart, periodEnd } = this.getPeriodInfo(date, interval);

      const existing = periods.get(periodKey) || {
        start: periodStart,
        end: periodEnd,
        count: 0,
        teacher_scores: [],
        engagement_scores: [],
        total_duration: 0,
        insights_aggregate: { categories: {} as Record<string, number> },
      };

      existing.count++;
      existing.total_duration += rec.duration_seconds || 0;

      // ai_reports is an array due to Prisma's relation definition, but logically 1:1 (unique constraint)
      const aiReport = rec.ai_reports[0];
      if (aiReport?.teacher_score) {
        existing.teacher_scores.push(Number(aiReport.teacher_score));
      }
      if (aiReport?.engagement_score) {
        existing.engagement_scores.push(Number(aiReport.engagement_score));
      }

      // Aggregate insights JSONB data
      if (aiReport?.insights && Array.isArray(aiReport.insights)) {
        const categories = existing.insights_aggregate.categories as Record<string, number>;
        for (const insight of aiReport.insights as Array<{ category?: string }>) {
          if (insight.category) {
            categories[insight.category] = (categories[insight.category] || 0) + 1;
          }
        }
      }

      periods.set(periodKey, existing);
    }

    return periods;
  }

  /**
   * Get period information for a date
   */
  private getPeriodInfo(
    date: Date,
    interval: 'daily' | 'weekly' | 'monthly',
  ): { periodKey: string; periodStart: Date; periodEnd: Date } {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    if (interval === 'daily') {
      const periodStart = new Date(year, month, day);
      const periodEnd = new Date(year, month, day, 23, 59, 59, 999);
      return {
        periodKey: date.toISOString().slice(0, 10),
        periodStart,
        periodEnd,
      };
    } else if (interval === 'weekly') {
      // Get week start (Monday)
      const dayOfWeek = date.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const periodStart = new Date(year, month, day + diff);
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);

      const weekYear = periodStart.getFullYear();
      const weekNum = this.getWeekNumber(periodStart);
      return {
        periodKey: `${weekYear}-W${String(weekNum).padStart(2, '0')}`,
        periodStart,
        periodEnd,
      };
    } else {
      // monthly
      const periodStart = new Date(year, month, 1);
      const periodEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return {
        periodKey: `${year}-${String(month + 1).padStart(2, '0')}`,
        periodStart,
        periodEnd,
      };
    }
  }

  /**
   * Get ISO week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // ============================================================================
  // M21-F03-D: COMPARE TWO SESSIONS
  // ============================================================================

  /**
   * Compare two observation sessions
   */
  async compareSessions(
    dto: M21CompareSessionsDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21CompareSessionsResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to compare sessions',
      });
    }

    // Fetch both sessions with all related data
    const [sessionA, sessionB] = await Promise.all([
      this.getSessionForComparison(dto.session_a_id),
      this.getSessionForComparison(dto.session_b_id),
    ]);

    if (!sessionA) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Session A with ID ${dto.session_a_id} not found`,
      });
    }

    if (!sessionB) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Session B with ID ${dto.session_b_id} not found`,
      });
    }

    // Build session data DTOs
    const sessionAData = this.buildSessionComparisonData(sessionA);
    const sessionBData = this.buildSessionComparisonData(sessionB);

    // Calculate metric comparisons
    const defaultMetrics = ['teacher_score', 'engagement_score', 'duration_seconds', 'annotation_count'];
    const metricsToCompare = dto.metrics || defaultMetrics;

    const comparisons: M21MetricComparisonDto[] = metricsToCompare.map((metric) => {
      const valueA = this.getMetricValue(sessionAData, metric);
      const valueB = this.getMetricValue(sessionBData, metric);

      return this.calculateMetricComparison(metric, valueA, valueB);
    });

    // Calculate summary
    const improved = comparisons.filter((c) => c.trend === 'improved').length;
    const declined = comparisons.filter((c) => c.trend === 'declined').length;
    const unchanged = comparisons.filter((c) => c.trend === 'unchanged').length;

    this.logger.log(`Compared sessions ${dto.session_a_id} and ${dto.session_b_id}`);

    return {
      session_a: sessionAData,
      session_b: sessionBData,
      comparisons,
      summary: {
        overall_improvement: improved > declined,
        improved_metrics: improved,
        declined_metrics: declined,
        unchanged_metrics: unchanged,
      },
    };
  }

  /**
   * Get session data for comparison
   */
  private async getSessionForComparison(sessionId: string) {
    return this.prisma.m21_observation_recordings.findUnique({
      where: { id: sessionId },
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        ai_reports: {
          select: {
            teacher_score: true,
            engagement_score: true,
            insights: true,
          },
        },
        annotations: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  /**
   * Build session comparison data DTO
   */
  private buildSessionComparisonData(
    session: NonNullable<Awaited<ReturnType<typeof this.getSessionForComparison>>>,
  ): M21SessionComparisonDataDto {
    const insights: M21ComparisonInsightDto[] = [];

    // ai_reports is an array due to Prisma's relation definition, but logically 1:1 (unique constraint)
    const aiReport = session.ai_reports[0];

    if (aiReport?.insights && Array.isArray(aiReport.insights)) {
      for (const insight of aiReport.insights as Array<{
        category?: string;
        title?: string;
        score?: number;
      }>) {
        if (insight.category && insight.title) {
          insights.push({
            category: insight.category,
            title: insight.title,
            score: insight.score ?? null,
          });
        }
      }
    }

    return {
      id: session.id,
      session_date: session.session_date,
      class_id: session.class_id,
      class_name: session.classroom?.name || 'Unknown',
      teacher_id: session.teacher_id,
      teacher_name: session.teacher
        ? `${session.teacher.first_name || ''} ${session.teacher.last_name || ''}`.trim() || 'Unknown'
        : 'Unknown',
      duration_seconds: session.duration_seconds,
      teacher_score: aiReport?.teacher_score
        ? Number(aiReport.teacher_score)
        : null,
      engagement_score: aiReport?.engagement_score
        ? Number(aiReport.engagement_score)
        : null,
      annotation_count: session.annotations.length,
      insights,
    };
  }

  /**
   * Get metric value from session data
   */
  private getMetricValue(session: M21SessionComparisonDataDto, metric: string): number | null {
    switch (metric) {
      case 'teacher_score':
        return session.teacher_score;
      case 'engagement_score':
        return session.engagement_score;
      case 'duration_seconds':
        return session.duration_seconds;
      case 'annotation_count':
        return session.annotation_count;
      default:
        return null;
    }
  }

  /**
   * Calculate comparison for a single metric
   */
  private calculateMetricComparison(
    metric: string,
    valueA: number | null,
    valueB: number | null,
  ): M21MetricComparisonDto {
    let difference: number | null = null;
    let percentChange: number | null = null;
    let trend: 'improved' | 'declined' | 'unchanged' | 'na' = 'na';

    if (valueA !== null && valueB !== null) {
      difference = valueB - valueA;
      if (valueA !== 0) {
        percentChange = Math.round((difference / valueA) * 10000) / 100;
      } else if (valueB !== 0) {
        percentChange = 100; // From 0 to something is 100% increase
      } else {
        percentChange = 0;
      }

      // Determine trend (positive is improvement for scores, negative is decline)
      const threshold = 0.01; // 1% threshold for considering change
      if (Math.abs(percentChange) < threshold) {
        trend = 'unchanged';
      } else if (difference > 0) {
        trend = 'improved';
      } else {
        trend = 'declined';
      }
    }

    return {
      metric,
      session_a_value: valueA,
      session_b_value: valueB,
      difference,
      percent_change: percentChange,
      trend,
    };
  }
}

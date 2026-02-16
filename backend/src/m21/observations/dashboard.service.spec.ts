import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../common/prisma';
import { M21AbilityFactory, M21UserWithPermissions } from '../casl/m21-ability.factory';
import { Prisma } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;

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

  // mockObservadorUser is defined for potential future tests with observador role
  const _mockObservadorUser: M21UserWithPermissions = {
    id: 'observador-user-123',
    email: 'observador@test.com',
    roles: [
      {
        id: 'role-2',
        name: 'observador',
        role_permissions: [],
      },
    ],
  };
  void _mockObservadorUser; // Suppress unused variable warning

  const mockRestrictedUser: M21UserWithPermissions = {
    id: 'restricted-user-123',
    email: 'restricted@test.com',
    roles: [
      {
        id: 'role-3',
        name: 'guest',
        role_permissions: [],
      },
    ],
  };

  const mockTeacher = {
    id: 'teacher-123',
    first_name: 'John',
    last_name: 'Teacher',
    email: 'teacher@test.com',
  };

  const mockClassroom = {
    id: 'class-123',
    name: 'Math 101',
    institution_id: 'inst-123',
  };

  const mockRecording = {
    id: 'recording-123',
    storage_bucket_id: 'bucket-123',
    class_id: 'class-123',
    teacher_id: 'teacher-123',
    observer_id: 'observador-user-123',
    session_date: new Date('2024-01-15'),
    file_key: 'recordings/class-123/test.mp4',
    mime_type: 'video/mp4',
    duration_seconds: 3600,
    file_size_bytes: BigInt(1000000),
    status: 'completed',
    metadata: null,
    created_at: new Date(),
    updated_at: new Date(),
    classroom: mockClassroom,
    teacher: mockTeacher,
    ai_reports: [
      {
        teacher_score: new Prisma.Decimal(85.5),
        engagement_score: new Prisma.Decimal(78.2),
        insights: [
          { category: 'pedagogy', title: 'Good explanation', score: 85 },
          { category: 'engagement', title: 'Student interaction', score: 75 },
        ],
      },
    ],
    annotations: [{ id: 'ann-1' }, { id: 'ann-2' }],
    review_progress: [{ status: 'completed' }],
  };

  const mockPrismaService = {
    m21_observation_recordings: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    m21_ai_reports: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    m21_review_progress: {
      groupBy: jest.fn(),
    },
    m01_users: {
      findUnique: jest.fn(),
    },
    m01_classrooms: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        M21AbilityFactory,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================================
  // DASHBOARD SUMMARY (M21-F03-A)
  // ============================================================================

  describe('getSummaryList', () => {
    it('should return dashboard summary with pagination', async () => {
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([mockRecording]);
      mockPrismaService.m21_observation_recordings.count.mockResolvedValue(1);
      mockPrismaService.m21_observation_recordings.aggregate.mockResolvedValue({
        _count: { id: 1 },
        _sum: { duration_seconds: 3600 },
      });
      mockPrismaService.m21_ai_reports.aggregate.mockResolvedValue({
        _avg: {
          teacher_score: new Prisma.Decimal(85.5),
          engagement_score: new Prisma.Decimal(78.2),
        },
      });

      const result = await service.getSummaryList({}, mockAdminUser);

      expect(result.summary).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.aggregates.total_recordings).toBe(1);
      expect(result.aggregates.avg_teacher_score).toBe(85.5);
      expect(result.aggregates.avg_engagement_score).toBe(78.2);
      expect(result.aggregates.total_duration_seconds).toBe(3600);
    });

    it('should respect offset and limit pagination', async () => {
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([]);
      mockPrismaService.m21_observation_recordings.count.mockResolvedValue(10);
      mockPrismaService.m21_observation_recordings.aggregate.mockResolvedValue({
        _count: { id: 10 },
        _sum: { duration_seconds: 36000 },
      });
      mockPrismaService.m21_ai_reports.aggregate.mockResolvedValue({
        _avg: { teacher_score: null, engagement_score: null },
      });

      const result = await service.getSummaryList({ offset: 5, limit: 3 }, mockAdminUser);

      expect(mockPrismaService.m21_observation_recordings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 3 }),
      );
      expect(result.offset).toBe(5);
      expect(result.limit).toBe(3);
    });

    it('should filter by teacher_id', async () => {
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([]);
      mockPrismaService.m21_observation_recordings.count.mockResolvedValue(0);
      mockPrismaService.m21_observation_recordings.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { duration_seconds: 0 },
      });
      mockPrismaService.m21_ai_reports.aggregate.mockResolvedValue({
        _avg: { teacher_score: null, engagement_score: null },
      });

      await service.getSummaryList({ teacher_id: 'teacher-123' }, mockAdminUser);

      expect(mockPrismaService.m21_observation_recordings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ teacher_id: 'teacher-123' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([]);
      mockPrismaService.m21_observation_recordings.count.mockResolvedValue(0);
      mockPrismaService.m21_observation_recordings.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { duration_seconds: 0 },
      });
      mockPrismaService.m21_ai_reports.aggregate.mockResolvedValue({
        _avg: { teacher_score: null, engagement_score: null },
      });

      await service.getSummaryList(
        { date_from: '2024-01-01', date_to: '2024-12-31' },
        mockAdminUser,
      );

      expect(mockPrismaService.m21_observation_recordings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            session_date: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });

    it('should throw ForbiddenException for users without read permission', async () => {
      await expect(service.getSummaryList({}, mockRestrictedUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ============================================================================
  // TEACHER METRICS (M21-F03-B)
  // ============================================================================

  describe('getTeacherMetrics', () => {
    it('should return teacher metrics with aggregates', async () => {
      mockPrismaService.m01_users.findUnique.mockResolvedValue(mockTeacher);
      mockPrismaService.m21_observation_recordings.aggregate.mockResolvedValue({
        _count: { id: 5 },
        _sum: { duration_seconds: 18000 },
      });
      mockPrismaService.m21_ai_reports.aggregate.mockResolvedValue({
        _avg: {
          teacher_score: new Prisma.Decimal(82.0),
          engagement_score: new Prisma.Decimal(75.5),
        },
      });
      mockPrismaService.m21_review_progress.groupBy.mockResolvedValue([
        { status: 'completed', _count: { id: 3 } },
        { status: 'in_progress', _count: { id: 2 } },
      ]);
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([]);
      mockPrismaService.m21_ai_reports.findMany.mockResolvedValue([]);

      const result = await service.getTeacherMetrics(
        { teacher_id: 'teacher-123' },
        mockAdminUser,
      );

      expect(result.metrics.teacher_id).toBe('teacher-123');
      expect(result.metrics.teacher_name).toBe('John Teacher');
      expect(result.metrics.total_observations).toBe(5);
      expect(result.metrics.avg_teacher_score).toBe(82.0);
      expect(result.metrics.avg_engagement_score).toBe(75.5);
      expect(result.metrics.total_duration_seconds).toBe(18000);
      expect(result.metrics.completed_reviews).toBe(3);
      expect(result.metrics.pending_reviews).toBe(2);
    });

    it('should throw NotFoundException for non-existent teacher', async () => {
      mockPrismaService.m01_users.findUnique.mockResolvedValue(null);

      await expect(
        service.getTeacherMetrics({ teacher_id: 'nonexistent' }, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for users without read permission', async () => {
      await expect(
        service.getTeacherMetrics({ teacher_id: 'teacher-123' }, mockRestrictedUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should include date range in response', async () => {
      mockPrismaService.m01_users.findUnique.mockResolvedValue(mockTeacher);
      mockPrismaService.m21_observation_recordings.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { duration_seconds: 0 },
      });
      mockPrismaService.m21_ai_reports.aggregate.mockResolvedValue({
        _avg: { teacher_score: null, engagement_score: null },
      });
      mockPrismaService.m21_review_progress.groupBy.mockResolvedValue([]);
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([]);
      mockPrismaService.m21_ai_reports.findMany.mockResolvedValue([]);

      const result = await service.getTeacherMetrics(
        { teacher_id: 'teacher-123', date_from: '2024-01-01', date_to: '2024-06-30' },
        mockAdminUser,
      );

      expect(result.date_range.from).toBe('2024-01-01');
      expect(result.date_range.to).toBe('2024-06-30');
    });
  });

  // ============================================================================
  // ENGAGEMENT TRENDS (M21-F03-C)
  // ============================================================================

  describe('getEngagementTrends', () => {
    it('should return engagement trends for a class', async () => {
      mockPrismaService.m01_classrooms.findUnique.mockResolvedValue(mockClassroom);
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([
        {
          id: 'rec-1',
          session_date: new Date('2024-01-15'),
          duration_seconds: 3600,
          ai_reports: {
            teacher_score: new Prisma.Decimal(80),
            engagement_score: new Prisma.Decimal(75),
            insights: [{ category: 'pedagogy' }],
          },
        },
        {
          id: 'rec-2',
          session_date: new Date('2024-01-22'),
          duration_seconds: 3000,
          ai_reports: {
            teacher_score: new Prisma.Decimal(85),
            engagement_score: new Prisma.Decimal(82),
            insights: [{ category: 'engagement' }],
          },
        },
      ]);
      mockPrismaService.m21_ai_reports.aggregate.mockResolvedValue({
        _avg: {
          teacher_score: new Prisma.Decimal(82.5),
          engagement_score: new Prisma.Decimal(78.5),
        },
      });
      mockPrismaService.m21_observation_recordings.aggregate.mockResolvedValue({
        _count: { id: 2 },
        _sum: { duration_seconds: 6600 },
      });

      const result = await service.getEngagementTrends(
        { class_id: 'class-123' },
        mockAdminUser,
      );

      expect(result.class_id).toBe('class-123');
      expect(result.class_name).toBe('Math 101');
      expect(result.trends.length).toBeGreaterThan(0);
      expect(result.overall.avg_engagement_score).toBe(78.5);
      expect(result.overall.avg_teacher_score).toBe(82.5);
      expect(result.overall.total_observations).toBe(2);
    });

    it('should respect interval parameter for grouping', async () => {
      mockPrismaService.m01_classrooms.findUnique.mockResolvedValue(mockClassroom);
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([]);
      mockPrismaService.m21_ai_reports.aggregate.mockResolvedValue({
        _avg: { teacher_score: null, engagement_score: null },
      });
      mockPrismaService.m21_observation_recordings.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { duration_seconds: 0 },
      });

      const result = await service.getEngagementTrends(
        { class_id: 'class-123', interval: 'monthly' },
        mockAdminUser,
      );

      expect(result.class_id).toBe('class-123');
    });

    it('should throw NotFoundException for non-existent class', async () => {
      mockPrismaService.m01_classrooms.findUnique.mockResolvedValue(null);

      await expect(
        service.getEngagementTrends({ class_id: 'nonexistent' }, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for users without read permission', async () => {
      await expect(
        service.getEngagementTrends({ class_id: 'class-123' }, mockRestrictedUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should paginate trends correctly', async () => {
      mockPrismaService.m01_classrooms.findUnique.mockResolvedValue(mockClassroom);
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([]);
      mockPrismaService.m21_ai_reports.aggregate.mockResolvedValue({
        _avg: { teacher_score: null, engagement_score: null },
      });
      mockPrismaService.m21_observation_recordings.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { duration_seconds: 0 },
      });

      const result = await service.getEngagementTrends(
        { class_id: 'class-123', offset: 2, limit: 5 },
        mockAdminUser,
      );

      expect(result.offset).toBe(2);
      expect(result.limit).toBe(5);
    });
  });

  // ============================================================================
  // COMPARE SESSIONS (M21-F03-D)
  // ============================================================================

  describe('compareSessions', () => {
    const mockSessionA = {
      id: 'session-a',
      session_date: new Date('2024-01-15'),
      class_id: 'class-123',
      teacher_id: 'teacher-123',
      duration_seconds: 3600,
      classroom: mockClassroom,
      teacher: mockTeacher,
      ai_reports: [
        {
          teacher_score: new Prisma.Decimal(75),
          engagement_score: new Prisma.Decimal(70),
          insights: [{ category: 'pedagogy', title: 'Basic explanation', score: 70 }],
        },
      ],
      annotations: [{ id: 'ann-1' }],
    };

    const mockSessionB = {
      id: 'session-b',
      session_date: new Date('2024-02-15'),
      class_id: 'class-123',
      teacher_id: 'teacher-123',
      duration_seconds: 3900,
      classroom: mockClassroom,
      teacher: mockTeacher,
      ai_reports: [
        {
          teacher_score: new Prisma.Decimal(85),
          engagement_score: new Prisma.Decimal(80),
          insights: [{ category: 'pedagogy', title: 'Improved explanation', score: 85 }],
        },
      ],
      annotations: [{ id: 'ann-2' }, { id: 'ann-3' }],
    };

    it('should compare two sessions and return metrics', async () => {
      mockPrismaService.m21_observation_recordings.findUnique
        .mockResolvedValueOnce(mockSessionA)
        .mockResolvedValueOnce(mockSessionB);

      const result = await service.compareSessions(
        { session_a_id: 'session-a', session_b_id: 'session-b' },
        mockAdminUser,
      );

      expect(result.session_a.id).toBe('session-a');
      expect(result.session_b.id).toBe('session-b');
      expect(result.comparisons.length).toBeGreaterThan(0);
      expect(result.summary.overall_improvement).toBe(true);
      expect(result.summary.improved_metrics).toBeGreaterThan(0);
    });

    it('should calculate correct differences and percent changes', async () => {
      mockPrismaService.m21_observation_recordings.findUnique
        .mockResolvedValueOnce(mockSessionA)
        .mockResolvedValueOnce(mockSessionB);

      const result = await service.compareSessions(
        { session_a_id: 'session-a', session_b_id: 'session-b' },
        mockAdminUser,
      );

      const teacherScoreComparison = result.comparisons.find((c) => c.metric === 'teacher_score');
      expect(teacherScoreComparison).toBeDefined();
      expect(teacherScoreComparison!.session_a_value).toBe(75);
      expect(teacherScoreComparison!.session_b_value).toBe(85);
      expect(teacherScoreComparison!.difference).toBe(10);
      expect(teacherScoreComparison!.trend).toBe('improved');
    });

    it('should throw NotFoundException if session A not found', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.compareSessions(
          { session_a_id: 'nonexistent', session_b_id: 'session-b' },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if session B not found', async () => {
      mockPrismaService.m21_observation_recordings.findUnique
        .mockResolvedValueOnce(mockSessionA)
        .mockResolvedValueOnce(null);

      await expect(
        service.compareSessions(
          { session_a_id: 'session-a', session_b_id: 'nonexistent' },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for users without read permission', async () => {
      await expect(
        service.compareSessions(
          { session_a_id: 'session-a', session_b_id: 'session-b' },
          mockRestrictedUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should compare only specified metrics when provided', async () => {
      mockPrismaService.m21_observation_recordings.findUnique
        .mockResolvedValueOnce(mockSessionA)
        .mockResolvedValueOnce(mockSessionB);

      const result = await service.compareSessions(
        {
          session_a_id: 'session-a',
          session_b_id: 'session-b',
          metrics: ['teacher_score', 'engagement_score'],
        },
        mockAdminUser,
      );

      expect(result.comparisons).toHaveLength(2);
      expect(result.comparisons.map((c) => c.metric)).toContain('teacher_score');
      expect(result.comparisons.map((c) => c.metric)).toContain('engagement_score');
      expect(result.comparisons.map((c) => c.metric)).not.toContain('duration_seconds');
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle null scores gracefully', async () => {
      const recordingWithNullScores = {
        ...mockRecording,
        ai_reports: [], // Empty array indicates no AI report
      };

      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([
        recordingWithNullScores,
      ]);
      mockPrismaService.m21_observation_recordings.count.mockResolvedValue(1);
      mockPrismaService.m21_observation_recordings.aggregate.mockResolvedValue({
        _count: { id: 1 },
        _sum: { duration_seconds: 3600 },
      });
      mockPrismaService.m21_ai_reports.aggregate.mockResolvedValue({
        _avg: { teacher_score: null, engagement_score: null },
      });

      const result = await service.getSummaryList({}, mockAdminUser);

      expect(result.summary[0].teacher_score).toBeNull();
      expect(result.summary[0].engagement_score).toBeNull();
      expect(result.aggregates.avg_teacher_score).toBeNull();
      expect(result.aggregates.avg_engagement_score).toBeNull();
    });

    it('should handle empty results', async () => {
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([]);
      mockPrismaService.m21_observation_recordings.count.mockResolvedValue(0);
      mockPrismaService.m21_observation_recordings.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { duration_seconds: null },
      });
      mockPrismaService.m21_ai_reports.aggregate.mockResolvedValue({
        _avg: { teacher_score: null, engagement_score: null },
      });

      const result = await service.getSummaryList({}, mockAdminUser);

      expect(result.summary).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.aggregates.total_recordings).toBe(0);
      expect(result.aggregates.total_duration_seconds).toBe(0);
    });

    it('should limit pagination to MAX_LIMIT', async () => {
      mockPrismaService.m21_observation_recordings.findMany.mockResolvedValue([]);
      mockPrismaService.m21_observation_recordings.count.mockResolvedValue(0);
      mockPrismaService.m21_observation_recordings.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { duration_seconds: 0 },
      });
      mockPrismaService.m21_ai_reports.aggregate.mockResolvedValue({
        _avg: { teacher_score: null, engagement_score: null },
      });

      const result = await service.getSummaryList({ limit: 500 }, mockAdminUser);

      expect(mockPrismaService.m21_observation_recordings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
      expect(result.limit).toBe(100);
    });
  });
});

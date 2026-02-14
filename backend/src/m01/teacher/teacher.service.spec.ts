import { Test, TestingModule } from '@nestjs/testing';
import { TeacherService } from './teacher.service';
import { PrismaService } from '../../common/prisma';

describe('TeacherService', () => {
  let service: TeacherService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUserId = 'teacher-123';

  const mockInstitution = {
    id: 'inst-123',
    name: 'Test School',
    code: 'TS001',
    address: '123 School St',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUserInstitution = {
    id: 'ui-123',
    user_id: mockUserId,
    institution_id: 'inst-123',
    role_context: 'teacher',
    joined_at: new Date(),
    institution: mockInstitution,
  };

  const mockSubject = {
    id: 'subj-123',
    code: 'MATH101',
    name: 'Mathematics',
    description: 'Math course',
    grade: '10',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockClassroom = {
    id: 'class-123',
    institution_id: 'inst-123',
    subject_id: 'subj-123',
    name: 'Math 101',
    section: 'A',
    academic_year: '2025-2026',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    institution: mockInstitution,
    subject: mockSubject,
  };

  const mockEnrollment = {
    id: 'enroll-123',
    user_id: mockUserId,
    classroom_id: 'class-123',
    role: 'teacher',
    enrolled_at: new Date(),
    dropped_at: null,
    classroom: mockClassroom,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      m01_user_institutions: {
        findMany: jest.fn(),
      },
      m01_classroom_enrollments: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TeacherService>(TeacherService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstitutions', () => {
    it('should return institutions assigned to the teacher', async () => {
      (prismaService.m01_user_institutions.findMany as jest.Mock).mockResolvedValue([
        mockUserInstitution,
      ]);

      const result = await service.getInstitutions(mockUserId);

      expect(result.total).toBe(1);
      expect(result.institutions).toHaveLength(1);
      expect(result.institutions[0]).toEqual({
        id: mockInstitution.id,
        name: mockInstitution.name,
        code: mockInstitution.code,
        address: mockInstitution.address,
        is_active: mockInstitution.is_active,
        role_context: mockUserInstitution.role_context,
        joined_at: mockUserInstitution.joined_at,
      });

      expect(prismaService.m01_user_institutions.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
        include: { institution: true },
        orderBy: { joined_at: 'desc' },
      });
    });

    it('should return empty array when teacher has no institutions', async () => {
      (prismaService.m01_user_institutions.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getInstitutions(mockUserId);

      expect(result.total).toBe(0);
      expect(result.institutions).toHaveLength(0);
    });

    it('should return multiple institutions when assigned', async () => {
      const secondInstitution = {
        ...mockUserInstitution,
        id: 'ui-456',
        institution: {
          ...mockInstitution,
          id: 'inst-456',
          name: 'Second School',
          code: 'SS001',
        },
      };

      (prismaService.m01_user_institutions.findMany as jest.Mock).mockResolvedValue([
        mockUserInstitution,
        secondInstitution,
      ]);

      const result = await service.getInstitutions(mockUserId);

      expect(result.total).toBe(2);
      expect(result.institutions).toHaveLength(2);
    });
  });

  describe('getClassrooms', () => {
    it('should return classrooms where teacher is enrolled with teacher role', async () => {
      (prismaService.m01_classroom_enrollments.findMany as jest.Mock).mockResolvedValue([
        mockEnrollment,
      ]);

      const result = await service.getClassrooms(mockUserId, {});

      expect(result.total).toBe(1);
      expect(result.classrooms).toHaveLength(1);
      expect(result.classrooms[0]).toEqual({
        id: mockClassroom.id,
        name: mockClassroom.name,
        section: mockClassroom.section,
        academic_year: mockClassroom.academic_year,
        is_active: mockClassroom.is_active,
        enrolled_at: mockEnrollment.enrolled_at,
        role: mockEnrollment.role,
        institution: {
          id: mockInstitution.id,
          name: mockInstitution.name,
          code: mockInstitution.code,
        },
        subject: {
          id: mockSubject.id,
          code: mockSubject.code,
          name: mockSubject.name,
          grade: mockSubject.grade,
        },
      });

      expect(prismaService.m01_classroom_enrollments.findMany).toHaveBeenCalledWith({
        where: {
          user_id: mockUserId,
          role: 'teacher',
          dropped_at: null,
        },
        include: {
          classroom: {
            include: {
              institution: true,
              subject: true,
            },
          },
        },
        orderBy: { enrolled_at: 'desc' },
      });
    });

    it('should filter classrooms by institution_id when provided', async () => {
      (prismaService.m01_classroom_enrollments.findMany as jest.Mock).mockResolvedValue([
        mockEnrollment,
      ]);

      const institutionId = 'inst-123';
      const result = await service.getClassrooms(mockUserId, {
        institution_id: institutionId,
      });

      expect(result.total).toBe(1);
      expect(prismaService.m01_classroom_enrollments.findMany).toHaveBeenCalledWith({
        where: {
          user_id: mockUserId,
          role: 'teacher',
          dropped_at: null,
          classroom: {
            institution_id: institutionId,
          },
        },
        include: {
          classroom: {
            include: {
              institution: true,
              subject: true,
            },
          },
        },
        orderBy: { enrolled_at: 'desc' },
      });
    });

    it('should return empty array when teacher has no classrooms', async () => {
      (prismaService.m01_classroom_enrollments.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getClassrooms(mockUserId, {});

      expect(result.total).toBe(0);
      expect(result.classrooms).toHaveLength(0);
    });

    it('should not return dropped enrollments', async () => {
      (prismaService.m01_classroom_enrollments.findMany as jest.Mock).mockResolvedValue([]);

      await service.getClassrooms(mockUserId, {});

      // Since dropped_at: null is in the where clause, no dropped enrollments should be returned
      expect(prismaService.m01_classroom_enrollments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dropped_at: null,
          }),
        }),
      );
    });

    it('should only return enrollments with teacher role', async () => {
      (prismaService.m01_classroom_enrollments.findMany as jest.Mock).mockResolvedValue([
        mockEnrollment,
      ]);

      await service.getClassrooms(mockUserId, {});

      expect(prismaService.m01_classroom_enrollments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'teacher',
          }),
        }),
      );
    });
  });
});

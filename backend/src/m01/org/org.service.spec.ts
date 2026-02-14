import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { OrgService } from './org.service';
import { PrismaService } from '../../common/prisma';

describe('OrgService', () => {
  let service: OrgService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockInstitution = {
    id: 'inst-123',
    name: 'Test Institution',
    code: 'TEST-001',
    address: '123 Test St',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSubject = {
    id: 'subj-123',
    code: 'MATH-101',
    name: 'Mathematics',
    description: 'Basic mathematics',
    grade: '10',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockClassroom = {
    id: 'class-123',
    institution_id: 'inst-123',
    subject_id: 'subj-123',
    name: 'Math Class A',
    section: 'A',
    academic_year: '2025-2026',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    institution: {
      id: 'inst-123',
      name: 'Test Institution',
      code: 'TEST-001',
    },
    subject: {
      id: 'subj-123',
      code: 'MATH-101',
      name: 'Mathematics',
    },
  };

  const mockUser = {
    id: 'user-123',
    email: 'student@example.com',
    first_name: 'Test',
    last_name: 'Student',
    is_active: true,
    google_id: null,
    password_hash: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockEnrollment = {
    id: 'enroll-123',
    user_id: 'user-123',
    classroom_id: 'class-123',
    role: 'student',
    enrolled_at: new Date(),
    dropped_at: null,
    user: mockUser,
    classroom: {
      id: 'class-123',
      name: 'Math Class A',
      section: 'A',
    },
  };

  const adminEmail = 'admin@example.com';

  beforeEach(async () => {
    const mockPrismaService: Record<string, unknown> = {
      m01_institutions: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      m01_subjects: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      m01_classrooms: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      m01_users: {
        findUnique: jest.fn(),
      },
      m01_classroom_enrollments: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrgService>(OrgService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // INSTITUTIONS
  // ============================================================================

  describe('listInstitutions', () => {
    it('should return paginated institutions list', async () => {
      const institutions = [mockInstitution];
      (prismaService.m01_institutions.findMany as jest.Mock).mockResolvedValue(
        institutions,
      );
      (prismaService.m01_institutions.count as jest.Mock).mockResolvedValue(1);

      const result = await service.listInstitutions(
        { offset: 0, limit: 10 },
        adminEmail,
      );

      expect(result.institutions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(10);
    });

    it('should use default pagination values', async () => {
      (prismaService.m01_institutions.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (prismaService.m01_institutions.count as jest.Mock).mockResolvedValue(0);

      const result = await service.listInstitutions({}, adminEmail);

      expect(result.offset).toBe(0);
      expect(result.limit).toBe(20);
    });

    it('should cap limit at maximum', async () => {
      (prismaService.m01_institutions.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (prismaService.m01_institutions.count as jest.Mock).mockResolvedValue(0);

      await service.listInstitutions({ limit: 500 }, adminEmail);

      expect(prismaService.m01_institutions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });
  });

  describe('getInstitution', () => {
    it('should return a single institution', async () => {
      (prismaService.m01_institutions.findUnique as jest.Mock).mockResolvedValue(
        mockInstitution,
      );

      const result = await service.getInstitution('inst-123', adminEmail);

      expect(result.institution.id).toBe('inst-123');
      expect(result.institution.code).toBe('TEST-001');
    });

    it('should throw NotFoundException for non-existent institution', async () => {
      (prismaService.m01_institutions.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.getInstitution('non-existent', adminEmail),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createInstitution', () => {
    const createInstitutionDto = {
      name: 'New Institution',
      code: 'NEW-001',
      address: '456 New St',
    };

    it('should create a new institution', async () => {
      (prismaService.m01_institutions.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.m01_institutions.create as jest.Mock).mockResolvedValue({
        ...mockInstitution,
        ...createInstitutionDto,
        id: 'new-inst-123',
      });

      const result = await service.createInstitution(
        createInstitutionDto,
        adminEmail,
      );

      expect(result.institution.code).toBe('NEW-001');
      expect(result.message).toBe('Institution created successfully');
    });

    it('should throw ConflictException for duplicate code', async () => {
      (prismaService.m01_institutions.findUnique as jest.Mock).mockResolvedValue(
        mockInstitution,
      );

      await expect(
        service.createInstitution(createInstitutionDto, adminEmail),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateInstitution', () => {
    const updateInstitutionDto = {
      name: 'Updated Institution',
      is_active: false,
    };

    it('should update an existing institution', async () => {
      (prismaService.m01_institutions.findUnique as jest.Mock).mockResolvedValue(
        mockInstitution,
      );
      (prismaService.m01_institutions.update as jest.Mock).mockResolvedValue({
        ...mockInstitution,
        name: 'Updated Institution',
        is_active: false,
      });

      const result = await service.updateInstitution(
        'inst-123',
        updateInstitutionDto,
        adminEmail,
      );

      expect(result.institution.name).toBe('Updated Institution');
      expect(result.institution.is_active).toBe(false);
      expect(result.message).toBe('Institution updated successfully');
    });

    it('should throw NotFoundException for non-existent institution', async () => {
      (prismaService.m01_institutions.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.updateInstitution('non-existent', updateInstitutionDto, adminEmail),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when changing to existing code', async () => {
      (prismaService.m01_institutions.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockInstitution)
        .mockResolvedValueOnce({ ...mockInstitution, id: 'other-inst' });

      await expect(
        service.updateInstitution(
          'inst-123',
          { code: 'TAKEN-CODE' },
          adminEmail,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ============================================================================
  // SUBJECTS
  // ============================================================================

  describe('listSubjects', () => {
    it('should return paginated subjects list', async () => {
      const subjects = [mockSubject];
      (prismaService.m01_subjects.findMany as jest.Mock).mockResolvedValue(
        subjects,
      );
      (prismaService.m01_subjects.count as jest.Mock).mockResolvedValue(1);

      const result = await service.listSubjects(
        { offset: 0, limit: 10 },
        adminEmail,
      );

      expect(result.subjects).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getSubject', () => {
    it('should return a single subject', async () => {
      (prismaService.m01_subjects.findUnique as jest.Mock).mockResolvedValue(
        mockSubject,
      );

      const result = await service.getSubject('subj-123', adminEmail);

      expect(result.subject.id).toBe('subj-123');
      expect(result.subject.code).toBe('MATH-101');
    });

    it('should throw NotFoundException for non-existent subject', async () => {
      (prismaService.m01_subjects.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.getSubject('non-existent', adminEmail),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createSubject', () => {
    const createSubjectDto = {
      code: 'SCI-101',
      name: 'Science',
      description: 'Basic science',
      grade: '10',
    };

    it('should create a new subject', async () => {
      (prismaService.m01_subjects.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.m01_subjects.create as jest.Mock).mockResolvedValue({
        ...mockSubject,
        ...createSubjectDto,
        id: 'new-subj-123',
      });

      const result = await service.createSubject(createSubjectDto, adminEmail);

      expect(result.subject.code).toBe('SCI-101');
      expect(result.message).toBe('Subject created successfully');
    });

    it('should throw ConflictException for duplicate code', async () => {
      (prismaService.m01_subjects.findUnique as jest.Mock).mockResolvedValue(
        mockSubject,
      );

      await expect(
        service.createSubject(createSubjectDto, adminEmail),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateSubject', () => {
    const updateSubjectDto = {
      name: 'Updated Mathematics',
      is_active: false,
    };

    it('should update an existing subject', async () => {
      (prismaService.m01_subjects.findUnique as jest.Mock).mockResolvedValue(
        mockSubject,
      );
      (prismaService.m01_subjects.update as jest.Mock).mockResolvedValue({
        ...mockSubject,
        name: 'Updated Mathematics',
        is_active: false,
      });

      const result = await service.updateSubject(
        'subj-123',
        updateSubjectDto,
        adminEmail,
      );

      expect(result.subject.name).toBe('Updated Mathematics');
      expect(result.message).toBe('Subject updated successfully');
    });

    it('should throw NotFoundException for non-existent subject', async () => {
      (prismaService.m01_subjects.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.updateSubject('non-existent', updateSubjectDto, adminEmail),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================================
  // CLASSROOMS
  // ============================================================================

  describe('listClassrooms', () => {
    it('should return paginated classrooms list', async () => {
      const classrooms = [mockClassroom];
      (prismaService.m01_classrooms.findMany as jest.Mock).mockResolvedValue(
        classrooms,
      );
      (prismaService.m01_classrooms.count as jest.Mock).mockResolvedValue(1);

      const result = await service.listClassrooms(
        { offset: 0, limit: 10 },
        adminEmail,
      );

      expect(result.classrooms).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getClassroom', () => {
    it('should return a single classroom', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(
        mockClassroom,
      );

      const result = await service.getClassroom('class-123', adminEmail);

      expect(result.classroom.id).toBe('class-123');
      expect(result.classroom.name).toBe('Math Class A');
    });

    it('should throw NotFoundException for non-existent classroom', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.getClassroom('non-existent', adminEmail),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createClassroom', () => {
    const createClassroomDto = {
      institution_id: 'inst-123',
      subject_id: 'subj-123',
      name: 'New Classroom',
      section: 'B',
      academic_year: '2025-2026',
    };

    it('should create a new classroom', async () => {
      (prismaService.m01_institutions.findUnique as jest.Mock).mockResolvedValue(
        mockInstitution,
      );
      (prismaService.m01_subjects.findUnique as jest.Mock).mockResolvedValue(
        mockSubject,
      );
      (prismaService.m01_classrooms.create as jest.Mock).mockResolvedValue({
        ...mockClassroom,
        ...createClassroomDto,
        id: 'new-class-123',
      });

      const result = await service.createClassroom(
        createClassroomDto,
        adminEmail,
      );

      expect(result.classroom.name).toBe('New Classroom');
      expect(result.message).toBe('Classroom created successfully');
    });

    it('should throw BadRequestException for invalid institution', async () => {
      (prismaService.m01_institutions.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.m01_subjects.findUnique as jest.Mock).mockResolvedValue(
        mockSubject,
      );

      await expect(
        service.createClassroom(createClassroomDto, adminEmail),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid subject', async () => {
      (prismaService.m01_institutions.findUnique as jest.Mock).mockResolvedValue(
        mockInstitution,
      );
      (prismaService.m01_subjects.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.createClassroom(createClassroomDto, adminEmail),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateClassroom', () => {
    const updateClassroomDto = {
      name: 'Updated Classroom',
      is_active: false,
    };

    it('should update an existing classroom', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(
        mockClassroom,
      );
      (prismaService.m01_classrooms.update as jest.Mock).mockResolvedValue({
        ...mockClassroom,
        name: 'Updated Classroom',
        is_active: false,
      });

      const result = await service.updateClassroom(
        'class-123',
        updateClassroomDto,
        adminEmail,
      );

      expect(result.classroom.name).toBe('Updated Classroom');
      expect(result.message).toBe('Classroom updated successfully');
    });

    it('should throw NotFoundException for non-existent classroom', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.updateClassroom('non-existent', updateClassroomDto, adminEmail),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate foreign keys when updating', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(
        mockClassroom,
      );
      (prismaService.m01_institutions.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.updateClassroom(
          'class-123',
          { institution_id: 'invalid-inst' },
          adminEmail,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================================
  // ENROLLMENTS
  // ============================================================================

  describe('listEnrollments', () => {
    it('should return paginated enrollments for a classroom', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(
        mockClassroom,
      );
      (prismaService.m01_classroom_enrollments.findMany as jest.Mock).mockResolvedValue(
        [mockEnrollment],
      );
      (prismaService.m01_classroom_enrollments.count as jest.Mock).mockResolvedValue(
        1,
      );

      const result = await service.listEnrollments(
        'class-123',
        { offset: 0, limit: 10 },
        adminEmail,
      );

      expect(result.enrollments).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw NotFoundException for non-existent classroom', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.listEnrollments('non-existent', {}, adminEmail),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createEnrollment', () => {
    const createEnrollmentDto = {
      user_id: 'user-123',
      classroom_id: 'class-123',
      role: 'student',
    };

    it('should create a new enrollment', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(
        mockClassroom,
      );
      (prismaService.m01_classroom_enrollments.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.m01_classroom_enrollments.create as jest.Mock).mockResolvedValue(
        mockEnrollment,
      );

      const result = await service.createEnrollment(
        createEnrollmentDto,
        adminEmail,
      );

      expect(result.enrollment.role).toBe('student');
      expect(result.message).toBe('User enrolled successfully');
    });

    it('should throw BadRequestException for invalid user', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(
        mockClassroom,
      );

      await expect(
        service.createEnrollment(createEnrollmentDto, adminEmail),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid classroom', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.createEnrollment(createEnrollmentDto, adminEmail),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate enrollment', async () => {
      (prismaService.m01_users.findUnique as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(
        mockClassroom,
      );
      (prismaService.m01_classroom_enrollments.findUnique as jest.Mock).mockResolvedValue(
        mockEnrollment,
      );

      await expect(
        service.createEnrollment(createEnrollmentDto, adminEmail),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateEnrollment', () => {
    const updateEnrollmentDto = {
      role: 'teacher',
    };

    it('should update an existing enrollment', async () => {
      (prismaService.m01_classroom_enrollments.findUnique as jest.Mock).mockResolvedValue(
        mockEnrollment,
      );
      (prismaService.m01_classroom_enrollments.update as jest.Mock).mockResolvedValue(
        {
          ...mockEnrollment,
          role: 'teacher',
        },
      );

      const result = await service.updateEnrollment(
        'enroll-123',
        updateEnrollmentDto,
        adminEmail,
      );

      expect(result.enrollment.role).toBe('teacher');
      expect(result.message).toBe('Enrollment updated successfully');
    });

    it('should throw NotFoundException for non-existent enrollment', async () => {
      (prismaService.m01_classroom_enrollments.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.updateEnrollment('non-existent', updateEnrollmentDto, adminEmail),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set dropped_at when dropping enrollment', async () => {
      (prismaService.m01_classroom_enrollments.findUnique as jest.Mock).mockResolvedValue(
        mockEnrollment,
      );
      (prismaService.m01_classroom_enrollments.update as jest.Mock).mockResolvedValue(
        {
          ...mockEnrollment,
          dropped_at: new Date(),
        },
      );

      const result = await service.updateEnrollment(
        'enroll-123',
        { dropped: true },
        adminEmail,
      );

      expect(result.enrollment.dropped_at).not.toBeNull();
    });
  });
});

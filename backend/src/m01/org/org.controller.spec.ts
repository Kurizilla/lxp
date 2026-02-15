import { Test, TestingModule } from '@nestjs/testing';
import { OrgController } from './org.controller';
import { OrgService } from './org.service';
import { M01AdminGuard, M01AdminRequest } from '../guards/m01-admin.guard';
import { M01AbilityFactory } from '../casl/m01-ability.factory';
import { PrismaService } from '../../common/prisma';

describe('OrgController', () => {
  let controller: OrgController;
  let orgService: jest.Mocked<OrgService>;

  const mockAdminRequest: M01AdminRequest = {
    user: {
      id: 'admin-123',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      session_id: 'session-123',
    },
  };

  const mockInstitutionResponse = {
    institution: {
      id: 'inst-123',
      name: 'Test Institution',
      code: 'TEST-001',
      address: '123 Test St',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  };

  const mockInstitutionsResponse = {
    institutions: [mockInstitutionResponse.institution],
    total: 1,
    offset: 0,
    limit: 20,
  };

  const mockSubjectResponse = {
    subject: {
      id: 'subj-123',
      code: 'MATH-101',
      name: 'Mathematics',
      description: 'Basic mathematics',
      grade: '10',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  };

  const mockSubjectsResponse = {
    subjects: [mockSubjectResponse.subject],
    total: 1,
    offset: 0,
    limit: 20,
  };

  const mockClassroomResponse = {
    classroom: {
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
    },
  };

  const mockClassroomsResponse = {
    classrooms: [mockClassroomResponse.classroom],
    total: 1,
    offset: 0,
    limit: 20,
  };

  const mockEnrollmentResponse = {
    enrollment: {
      id: 'enroll-123',
      user_id: 'user-123',
      classroom_id: 'class-123',
      role: 'student',
      enrolled_at: new Date(),
      dropped_at: null,
      user: {
        id: 'user-123',
        email: 'student@example.com',
        first_name: 'Test',
        last_name: 'Student',
      },
      classroom: {
        id: 'class-123',
        name: 'Math Class A',
        section: 'A',
      },
    },
  };

  const mockEnrollmentsResponse = {
    enrollments: [mockEnrollmentResponse.enrollment],
    total: 1,
    offset: 0,
    limit: 20,
  };

  beforeEach(async () => {
    const mockOrgService = {
      listInstitutions: jest.fn().mockResolvedValue(mockInstitutionsResponse),
      getInstitution: jest.fn().mockResolvedValue(mockInstitutionResponse),
      createInstitution: jest.fn().mockResolvedValue(mockInstitutionResponse),
      updateInstitution: jest.fn().mockResolvedValue(mockInstitutionResponse),
      listSubjects: jest.fn().mockResolvedValue(mockSubjectsResponse),
      getSubject: jest.fn().mockResolvedValue(mockSubjectResponse),
      createSubject: jest.fn().mockResolvedValue(mockSubjectResponse),
      updateSubject: jest.fn().mockResolvedValue(mockSubjectResponse),
      listClassrooms: jest.fn().mockResolvedValue(mockClassroomsResponse),
      getClassroom: jest.fn().mockResolvedValue(mockClassroomResponse),
      createClassroom: jest.fn().mockResolvedValue(mockClassroomResponse),
      updateClassroom: jest.fn().mockResolvedValue(mockClassroomResponse),
      listEnrollments: jest.fn().mockResolvedValue(mockEnrollmentsResponse),
      createEnrollment: jest.fn().mockResolvedValue(mockEnrollmentResponse),
      updateEnrollment: jest.fn().mockResolvedValue(mockEnrollmentResponse),
    };

    const mockPrismaService = {
      m01_users: {
        findUnique: jest.fn(),
      },
    };

    const mockAbilityFactory = {
      createForUser: jest.fn().mockReturnValue({ can: jest.fn() }),
      isAdmin: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrgController],
      providers: [
        { provide: OrgService, useValue: mockOrgService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: M01AbilityFactory, useValue: mockAbilityFactory },
        M01AdminGuard,
      ],
    }).compile();

    controller = module.get<OrgController>(OrgController);
    orgService = module.get(OrgService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // INSTITUTIONS
  // ============================================================================

  describe('listInstitutions', () => {
    it('should return paginated institutions list', async () => {
      const result = await controller.listInstitutions(
        { offset: 0, limit: 10 },
        mockAdminRequest,
      );

      expect(result).toEqual(mockInstitutionsResponse);
      expect(orgService.listInstitutions).toHaveBeenCalledWith(
        { offset: 0, limit: 10 },
        'admin@example.com',
      );
    });
  });

  describe('getInstitution', () => {
    it('should return a single institution', async () => {
      const result = await controller.getInstitution(
        'inst-123',
        mockAdminRequest,
      );

      expect(result).toEqual(mockInstitutionResponse);
      expect(orgService.getInstitution).toHaveBeenCalledWith(
        'inst-123',
        'admin@example.com',
      );
    });
  });

  describe('createInstitution', () => {
    it('should create a new institution', async () => {
      const createDto = {
        name: 'New Institution',
        code: 'NEW-001',
        address: '456 New St',
      };

      const result = await controller.createInstitution(
        createDto,
        mockAdminRequest,
      );

      expect(result).toEqual(mockInstitutionResponse);
      expect(orgService.createInstitution).toHaveBeenCalledWith(
        createDto,
        'admin@example.com',
      );
    });
  });

  describe('updateInstitution', () => {
    it('should update an existing institution', async () => {
      const updateDto = { name: 'Updated Institution' };

      const result = await controller.updateInstitution(
        'inst-123',
        updateDto,
        mockAdminRequest,
      );

      expect(result).toEqual(mockInstitutionResponse);
      expect(orgService.updateInstitution).toHaveBeenCalledWith(
        'inst-123',
        updateDto,
        'admin@example.com',
      );
    });
  });

  // ============================================================================
  // SUBJECTS
  // ============================================================================

  describe('listSubjects', () => {
    it('should return paginated subjects list', async () => {
      const result = await controller.listSubjects(
        { offset: 0, limit: 10 },
        mockAdminRequest,
      );

      expect(result).toEqual(mockSubjectsResponse);
      expect(orgService.listSubjects).toHaveBeenCalledWith(
        { offset: 0, limit: 10 },
        'admin@example.com',
      );
    });
  });

  describe('getSubject', () => {
    it('should return a single subject', async () => {
      const result = await controller.getSubject('subj-123', mockAdminRequest);

      expect(result).toEqual(mockSubjectResponse);
      expect(orgService.getSubject).toHaveBeenCalledWith(
        'subj-123',
        'admin@example.com',
      );
    });
  });

  describe('createSubject', () => {
    it('should create a new subject', async () => {
      const createDto = {
        code: 'SCI-101',
        name: 'Science',
        description: 'Basic science',
      };

      const result = await controller.createSubject(createDto, mockAdminRequest);

      expect(result).toEqual(mockSubjectResponse);
      expect(orgService.createSubject).toHaveBeenCalledWith(
        createDto,
        'admin@example.com',
      );
    });
  });

  describe('updateSubject', () => {
    it('should update an existing subject', async () => {
      const updateDto = { name: 'Updated Mathematics' };

      const result = await controller.updateSubject(
        'subj-123',
        updateDto,
        mockAdminRequest,
      );

      expect(result).toEqual(mockSubjectResponse);
      expect(orgService.updateSubject).toHaveBeenCalledWith(
        'subj-123',
        updateDto,
        'admin@example.com',
      );
    });
  });

  // ============================================================================
  // CLASSROOMS
  // ============================================================================

  describe('listClassrooms', () => {
    it('should return paginated classrooms list', async () => {
      const result = await controller.listClassrooms(
        { offset: 0, limit: 10 },
        mockAdminRequest,
      );

      expect(result).toEqual(mockClassroomsResponse);
      expect(orgService.listClassrooms).toHaveBeenCalledWith(
        { offset: 0, limit: 10 },
        'admin@example.com',
      );
    });
  });

  describe('getClassroom', () => {
    it('should return a single classroom', async () => {
      const result = await controller.getClassroom(
        'class-123',
        mockAdminRequest,
      );

      expect(result).toEqual(mockClassroomResponse);
      expect(orgService.getClassroom).toHaveBeenCalledWith(
        'class-123',
        'admin@example.com',
      );
    });
  });

  describe('createClassroom', () => {
    it('should create a new classroom', async () => {
      const createDto = {
        institution_id: 'inst-123',
        subject_id: 'subj-123',
        name: 'New Classroom',
        section: 'B',
      };

      const result = await controller.createClassroom(
        createDto,
        mockAdminRequest,
      );

      expect(result).toEqual(mockClassroomResponse);
      expect(orgService.createClassroom).toHaveBeenCalledWith(
        createDto,
        'admin@example.com',
      );
    });
  });

  describe('updateClassroom', () => {
    it('should update an existing classroom', async () => {
      const updateDto = { name: 'Updated Classroom' };

      const result = await controller.updateClassroom(
        'class-123',
        updateDto,
        mockAdminRequest,
      );

      expect(result).toEqual(mockClassroomResponse);
      expect(orgService.updateClassroom).toHaveBeenCalledWith(
        'class-123',
        updateDto,
        'admin@example.com',
      );
    });
  });

  // ============================================================================
  // ENROLLMENTS
  // ============================================================================

  describe('listEnrollments', () => {
    it('should return paginated enrollments for a classroom', async () => {
      const result = await controller.listEnrollments(
        'class-123',
        { offset: 0, limit: 10 },
        mockAdminRequest,
      );

      expect(result).toEqual(mockEnrollmentsResponse);
      expect(orgService.listEnrollments).toHaveBeenCalledWith(
        'class-123',
        { offset: 0, limit: 10 },
        'admin@example.com',
      );
    });
  });

  describe('createEnrollment', () => {
    it('should enroll a user in a classroom', async () => {
      const createDto = {
        user_id: 'user-123',
        classroom_id: 'class-123',
        role: 'student',
      };

      const result = await controller.createEnrollment(
        createDto,
        mockAdminRequest,
      );

      expect(result).toEqual(mockEnrollmentResponse);
      expect(orgService.createEnrollment).toHaveBeenCalledWith(
        createDto,
        'admin@example.com',
      );
    });
  });

  describe('updateEnrollment', () => {
    it('should update an enrollment', async () => {
      const updateDto = { role: 'teacher' };

      const result = await controller.updateEnrollment(
        'enroll-123',
        updateDto,
        mockAdminRequest,
      );

      expect(result).toEqual(mockEnrollmentResponse);
      expect(orgService.updateEnrollment).toHaveBeenCalledWith(
        'enroll-123',
        updateDto,
        'admin@example.com',
      );
    });
  });
});

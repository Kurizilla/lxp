import { Test, TestingModule } from '@nestjs/testing';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { M01TeacherGuard, M01TeacherRequest } from '../guards/m01-teacher.guard';
import { M01AbilityFactory } from '../casl/m01-ability.factory';
import { PrismaService } from '../../common/prisma';

describe('TeacherController', () => {
  let controller: TeacherController;
  let teacherService: jest.Mocked<TeacherService>;

  const mockTeacherRequest: M01TeacherRequest = {
    user: {
      id: 'teacher-123',
      email: 'teacher@example.com',
      first_name: 'Test',
      last_name: 'Teacher',
      session_id: 'session-123',
    },
  };

  const mockInstitutionsResponse = {
    institutions: [
      {
        id: 'inst-123',
        name: 'Test School',
        code: 'TS001',
        address: '123 School St',
        is_active: true,
        role_context: 'teacher',
        joined_at: new Date(),
      },
    ],
    total: 1,
  };

  const mockClassroomsResponse = {
    classrooms: [
      {
        id: 'class-123',
        name: 'Math 101',
        section: 'A',
        academic_year: '2025-2026',
        is_active: true,
        enrolled_at: new Date(),
        role: 'teacher',
        institution: {
          id: 'inst-123',
          name: 'Test School',
          code: 'TS001',
        },
        subject: {
          id: 'subj-123',
          code: 'MATH101',
          name: 'Mathematics',
          grade: '10',
        },
      },
    ],
    total: 1,
  };

  beforeEach(async () => {
    const mockTeacherService = {
      getInstitutions: jest.fn().mockResolvedValue(mockInstitutionsResponse),
      getClassrooms: jest.fn().mockResolvedValue(mockClassroomsResponse),
    };

    const mockPrismaService = {
      m01_users: {
        findUnique: jest.fn(),
      },
    };

    const mockAbilityFactory = {
      createForUser: jest.fn().mockReturnValue({ can: jest.fn() }),
      isAdmin: jest.fn().mockReturnValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeacherController],
      providers: [
        { provide: TeacherService, useValue: mockTeacherService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: M01AbilityFactory, useValue: mockAbilityFactory },
        M01TeacherGuard,
      ],
    }).compile();

    controller = module.get<TeacherController>(TeacherController);
    teacherService = module.get(TeacherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstitutions', () => {
    it('should return institutions for the authenticated teacher', async () => {
      const result = await controller.getInstitutions(mockTeacherRequest);

      expect(result).toEqual(mockInstitutionsResponse);
      expect(teacherService.getInstitutions).toHaveBeenCalledWith('teacher-123');
    });

    it('should return empty array when teacher has no institutions', async () => {
      const emptyResponse = { institutions: [], total: 0 };
      teacherService.getInstitutions.mockResolvedValueOnce(emptyResponse);

      const result = await controller.getInstitutions(mockTeacherRequest);

      expect(result).toEqual(emptyResponse);
      expect(teacherService.getInstitutions).toHaveBeenCalledWith('teacher-123');
    });
  });

  describe('getClassrooms', () => {
    it('should return classrooms for the authenticated teacher', async () => {
      const result = await controller.getClassrooms({}, mockTeacherRequest);

      expect(result).toEqual(mockClassroomsResponse);
      expect(teacherService.getClassrooms).toHaveBeenCalledWith('teacher-123', {});
    });

    it('should filter classrooms by institution_id when provided', async () => {
      const query = { institution_id: 'inst-123' };

      const result = await controller.getClassrooms(query, mockTeacherRequest);

      expect(result).toEqual(mockClassroomsResponse);
      expect(teacherService.getClassrooms).toHaveBeenCalledWith('teacher-123', query);
    });

    it('should return empty array when teacher has no classrooms', async () => {
      const emptyResponse = { classrooms: [], total: 0 };
      teacherService.getClassrooms.mockResolvedValueOnce(emptyResponse);

      const result = await controller.getClassrooms({}, mockTeacherRequest);

      expect(result).toEqual(emptyResponse);
      expect(teacherService.getClassrooms).toHaveBeenCalledWith('teacher-123', {});
    });

    it('should return empty array when filtering by non-existent institution', async () => {
      const emptyResponse = { classrooms: [], total: 0 };
      teacherService.getClassrooms.mockResolvedValueOnce(emptyResponse);
      const query = { institution_id: 'non-existent-inst' };

      const result = await controller.getClassrooms(query, mockTeacherRequest);

      expect(result).toEqual(emptyResponse);
      expect(teacherService.getClassrooms).toHaveBeenCalledWith('teacher-123', query);
    });
  });
});

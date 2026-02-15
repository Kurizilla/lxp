import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import {
  M01TeacherInstitutionDto,
  M01TeacherInstitutionsResponseDto,
  M01TeacherClassroomDto,
  M01TeacherClassroomsResponseDto,
  M01TeacherClassroomsQueryDto,
} from '../dto/teacher.dto';

/**
 * Service for teacher-specific operations
 * Returns only institutions and classrooms assigned to the teacher
 */
@Injectable()
export class TeacherService {
  private readonly logger = new Logger(TeacherService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get institutions assigned to the teacher via user_institutions
   */
  async getInstitutions(userId: string): Promise<M01TeacherInstitutionsResponseDto> {
    const userInstitutions = await this.prisma.m01_user_institutions.findMany({
      where: {
        user_id: userId,
      },
      include: {
        institution: true,
      },
      orderBy: {
        joined_at: 'desc',
      },
    });

    const institutions: M01TeacherInstitutionDto[] = userInstitutions.map((ui) => ({
      id: ui.institution.id,
      name: ui.institution.name,
      code: ui.institution.code,
      address: ui.institution.address,
      is_active: ui.institution.is_active,
      role_context: ui.role_context,
      joined_at: ui.joined_at,
    }));

    this.logger.log(
      `Teacher ${userId} retrieved ${institutions.length} institutions`,
    );

    return {
      institutions,
      total: institutions.length,
    };
  }

  /**
   * Get classrooms assigned to the teacher via classroom_enrollments
   * Optionally filter by institution_id
   * Only returns classrooms where user has 'teacher' role
   */
  async getClassrooms(
    userId: string,
    query: M01TeacherClassroomsQueryDto,
  ): Promise<M01TeacherClassroomsResponseDto> {
    // Build filter conditions
    const whereConditions: {
      user_id: string;
      role: string;
      dropped_at: null;
      classroom?: {
        institution_id: string;
      };
    } = {
      user_id: userId,
      role: 'teacher',
      dropped_at: null, // Only active enrollments
    };

    // Add institution filter if provided
    if (query.institution_id) {
      whereConditions.classroom = {
        institution_id: query.institution_id,
      };
    }

    const enrollments = await this.prisma.m01_classroom_enrollments.findMany({
      where: whereConditions,
      include: {
        classroom: {
          include: {
            institution: true,
            subject: true,
          },
        },
      },
      orderBy: {
        enrolled_at: 'desc',
      },
    });

    const classrooms: M01TeacherClassroomDto[] = enrollments.map((enrollment) => ({
      id: enrollment.classroom.id,
      name: enrollment.classroom.name,
      section: enrollment.classroom.section,
      academic_year: enrollment.classroom.academic_year,
      is_active: enrollment.classroom.is_active,
      enrolled_at: enrollment.enrolled_at,
      role: enrollment.role,
      institution: {
        id: enrollment.classroom.institution.id,
        name: enrollment.classroom.institution.name,
        code: enrollment.classroom.institution.code,
      },
      subject: {
        id: enrollment.classroom.subject.id,
        code: enrollment.classroom.subject.code,
        name: enrollment.classroom.subject.name,
        grade: enrollment.classroom.subject.grade,
      },
    }));

    this.logger.log(
      `Teacher ${userId} retrieved ${classrooms.length} classrooms` +
        (query.institution_id ? ` for institution ${query.institution_id}` : ''),
    );

    return {
      classrooms,
      total: classrooms.length,
    };
  }
}

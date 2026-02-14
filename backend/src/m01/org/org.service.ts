import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import {
  M01CreateInstitutionDto,
  M01UpdateInstitutionDto,
  M01InstitutionDto,
  M01InstitutionsResponseDto,
  M01InstitutionResponseDto,
} from '../dto/create-institution.dto';
import {
  M01CreateSubjectDto,
  M01UpdateSubjectDto,
  M01SubjectDto,
  M01SubjectsResponseDto,
  M01SubjectResponseDto,
} from '../dto/create-subject.dto';
import {
  M01CreateClassroomDto,
  M01UpdateClassroomDto,
  M01ClassroomDto,
  M01ClassroomsResponseDto,
  M01ClassroomResponseDto,
  M01CreateEnrollmentDto,
  M01UpdateEnrollmentDto,
  M01EnrollmentDto,
  M01EnrollmentsResponseDto,
  M01EnrollmentResponseDto,
} from '../dto/create-classroom.dto';

/**
 * Pagination parameters
 */
export interface PaginationParams {
  offset?: number;
  limit?: number;
}

/**
 * Service for organizational management (institutions, subjects, classrooms, enrollments)
 */
@Injectable()
export class OrgService {
  private readonly logger = new Logger(OrgService.name);
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 100;

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // INSTITUTIONS
  // ============================================================================

  /**
   * List institutions with pagination
   */
  async listInstitutions(
    params: PaginationParams,
    adminEmail: string,
  ): Promise<M01InstitutionsResponseDto> {
    const offset = params.offset || 0;
    const limit = Math.min(params.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);

    const [institutions, total] = await Promise.all([
      this.prisma.m01_institutions.findMany({
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.m01_institutions.count(),
    ]);

    const institutionDtos: M01InstitutionDto[] = institutions.map((inst) => ({
      id: inst.id,
      name: inst.name,
      code: inst.code,
      address: inst.address,
      is_active: inst.is_active,
      created_at: inst.created_at,
      updated_at: inst.updated_at,
    }));

    this.logger.log(
      `Admin ${adminEmail} listed institutions: offset=${offset}, limit=${limit}, total=${total}`,
    );

    return {
      institutions: institutionDtos,
      total,
      offset,
      limit,
    };
  }

  /**
   * Get a single institution by ID
   */
  async getInstitution(
    institutionId: string,
    adminEmail: string,
  ): Promise<M01InstitutionResponseDto> {
    const institution = await this.prisma.m01_institutions.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException(`Institution with ID ${institutionId} not found`);
    }

    const institutionDto: M01InstitutionDto = {
      id: institution.id,
      name: institution.name,
      code: institution.code,
      address: institution.address,
      is_active: institution.is_active,
      created_at: institution.created_at,
      updated_at: institution.updated_at,
    };

    this.logger.log(`Admin ${adminEmail} retrieved institution ${institutionId}`);

    return { institution: institutionDto };
  }

  /**
   * Create a new institution
   */
  async createInstitution(
    dto: M01CreateInstitutionDto,
    adminEmail: string,
  ): Promise<M01InstitutionResponseDto> {
    // Check if code is already taken
    const existingInstitution = await this.prisma.m01_institutions.findUnique({
      where: { code: dto.code },
    });

    if (existingInstitution) {
      throw new ConflictException(`Institution with code ${dto.code} already exists`);
    }

    const institution = await this.prisma.m01_institutions.create({
      data: {
        name: dto.name,
        code: dto.code,
        address: dto.address || null,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
      },
    });

    const institutionDto: M01InstitutionDto = {
      id: institution.id,
      name: institution.name,
      code: institution.code,
      address: institution.address,
      is_active: institution.is_active,
      created_at: institution.created_at,
      updated_at: institution.updated_at,
    };

    this.logger.log(
      `Admin ${adminEmail} created institution ${institution.id} (${institution.code})`,
    );

    return {
      institution: institutionDto,
      message: 'Institution created successfully',
    };
  }

  /**
   * Update an existing institution
   */
  async updateInstitution(
    institutionId: string,
    dto: M01UpdateInstitutionDto,
    adminEmail: string,
  ): Promise<M01InstitutionResponseDto> {
    // Check institution exists
    const existingInstitution = await this.prisma.m01_institutions.findUnique({
      where: { id: institutionId },
    });

    if (!existingInstitution) {
      throw new NotFoundException(`Institution with ID ${institutionId} not found`);
    }

    // Check code uniqueness if being changed
    if (dto.code && dto.code !== existingInstitution.code) {
      const codeTaken = await this.prisma.m01_institutions.findUnique({
        where: { code: dto.code },
      });

      if (codeTaken) {
        throw new ConflictException(`Institution with code ${dto.code} already exists`);
      }
    }

    const institution = await this.prisma.m01_institutions.update({
      where: { id: institutionId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
    });

    const institutionDto: M01InstitutionDto = {
      id: institution.id,
      name: institution.name,
      code: institution.code,
      address: institution.address,
      is_active: institution.is_active,
      created_at: institution.created_at,
      updated_at: institution.updated_at,
    };

    this.logger.log(`Admin ${adminEmail} updated institution ${institutionId}`);

    return {
      institution: institutionDto,
      message: 'Institution updated successfully',
    };
  }

  // ============================================================================
  // SUBJECTS
  // ============================================================================

  /**
   * List subjects with pagination
   */
  async listSubjects(
    params: PaginationParams,
    adminEmail: string,
  ): Promise<M01SubjectsResponseDto> {
    const offset = params.offset || 0;
    const limit = Math.min(params.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);

    const [subjects, total] = await Promise.all([
      this.prisma.m01_subjects.findMany({
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.m01_subjects.count(),
    ]);

    const subjectDtos: M01SubjectDto[] = subjects.map((subj) => ({
      id: subj.id,
      code: subj.code,
      name: subj.name,
      description: subj.description,
      grade: subj.grade,
      is_active: subj.is_active,
      created_at: subj.created_at,
      updated_at: subj.updated_at,
    }));

    this.logger.log(
      `Admin ${adminEmail} listed subjects: offset=${offset}, limit=${limit}, total=${total}`,
    );

    return {
      subjects: subjectDtos,
      total,
      offset,
      limit,
    };
  }

  /**
   * Get a single subject by ID
   */
  async getSubject(subjectId: string, adminEmail: string): Promise<M01SubjectResponseDto> {
    const subject = await this.prisma.m01_subjects.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }

    const subjectDto: M01SubjectDto = {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      description: subject.description,
      grade: subject.grade,
      is_active: subject.is_active,
      created_at: subject.created_at,
      updated_at: subject.updated_at,
    };

    this.logger.log(`Admin ${adminEmail} retrieved subject ${subjectId}`);

    return { subject: subjectDto };
  }

  /**
   * Create a new subject
   */
  async createSubject(
    dto: M01CreateSubjectDto,
    adminEmail: string,
  ): Promise<M01SubjectResponseDto> {
    // Check if code is already taken
    const existingSubject = await this.prisma.m01_subjects.findUnique({
      where: { code: dto.code },
    });

    if (existingSubject) {
      throw new ConflictException(`Subject with code ${dto.code} already exists`);
    }

    const subject = await this.prisma.m01_subjects.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description || null,
        grade: dto.grade || null,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
      },
    });

    const subjectDto: M01SubjectDto = {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      description: subject.description,
      grade: subject.grade,
      is_active: subject.is_active,
      created_at: subject.created_at,
      updated_at: subject.updated_at,
    };

    this.logger.log(`Admin ${adminEmail} created subject ${subject.id} (${subject.code})`);

    return {
      subject: subjectDto,
      message: 'Subject created successfully',
    };
  }

  /**
   * Update an existing subject
   */
  async updateSubject(
    subjectId: string,
    dto: M01UpdateSubjectDto,
    adminEmail: string,
  ): Promise<M01SubjectResponseDto> {
    // Check subject exists
    const existingSubject = await this.prisma.m01_subjects.findUnique({
      where: { id: subjectId },
    });

    if (!existingSubject) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }

    // Check code uniqueness if being changed
    if (dto.code && dto.code !== existingSubject.code) {
      const codeTaken = await this.prisma.m01_subjects.findUnique({
        where: { code: dto.code },
      });

      if (codeTaken) {
        throw new ConflictException(`Subject with code ${dto.code} already exists`);
      }
    }

    const subject = await this.prisma.m01_subjects.update({
      where: { id: subjectId },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.grade !== undefined && { grade: dto.grade }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
    });

    const subjectDto: M01SubjectDto = {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      description: subject.description,
      grade: subject.grade,
      is_active: subject.is_active,
      created_at: subject.created_at,
      updated_at: subject.updated_at,
    };

    this.logger.log(`Admin ${adminEmail} updated subject ${subjectId}`);

    return {
      subject: subjectDto,
      message: 'Subject updated successfully',
    };
  }

  // ============================================================================
  // CLASSROOMS
  // ============================================================================

  /**
   * List classrooms with pagination
   */
  async listClassrooms(
    params: PaginationParams,
    adminEmail: string,
  ): Promise<M01ClassroomsResponseDto> {
    const offset = params.offset || 0;
    const limit = Math.min(params.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);

    const [classrooms, total] = await Promise.all([
      this.prisma.m01_classrooms.findMany({
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          institution: true,
          subject: true,
        },
      }),
      this.prisma.m01_classrooms.count(),
    ]);

    const classroomDtos: M01ClassroomDto[] = classrooms.map((cls) => ({
      id: cls.id,
      institution_id: cls.institution_id,
      subject_id: cls.subject_id,
      name: cls.name,
      section: cls.section,
      academic_year: cls.academic_year,
      is_active: cls.is_active,
      created_at: cls.created_at,
      updated_at: cls.updated_at,
      institution: {
        id: cls.institution.id,
        name: cls.institution.name,
        code: cls.institution.code,
      },
      subject: {
        id: cls.subject.id,
        code: cls.subject.code,
        name: cls.subject.name,
      },
    }));

    this.logger.log(
      `Admin ${adminEmail} listed classrooms: offset=${offset}, limit=${limit}, total=${total}`,
    );

    return {
      classrooms: classroomDtos,
      total,
      offset,
      limit,
    };
  }

  /**
   * Get a single classroom by ID
   */
  async getClassroom(
    classroomId: string,
    adminEmail: string,
  ): Promise<M01ClassroomResponseDto> {
    const classroom = await this.prisma.m01_classrooms.findUnique({
      where: { id: classroomId },
      include: {
        institution: true,
        subject: true,
      },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${classroomId} not found`);
    }

    const classroomDto: M01ClassroomDto = {
      id: classroom.id,
      institution_id: classroom.institution_id,
      subject_id: classroom.subject_id,
      name: classroom.name,
      section: classroom.section,
      academic_year: classroom.academic_year,
      is_active: classroom.is_active,
      created_at: classroom.created_at,
      updated_at: classroom.updated_at,
      institution: {
        id: classroom.institution.id,
        name: classroom.institution.name,
        code: classroom.institution.code,
      },
      subject: {
        id: classroom.subject.id,
        code: classroom.subject.code,
        name: classroom.subject.name,
      },
    };

    this.logger.log(`Admin ${adminEmail} retrieved classroom ${classroomId}`);

    return { classroom: classroomDto };
  }

  /**
   * Create a new classroom
   */
  async createClassroom(
    dto: M01CreateClassroomDto,
    adminEmail: string,
  ): Promise<M01ClassroomResponseDto> {
    // Validate foreign keys
    const [institution, subject] = await Promise.all([
      this.prisma.m01_institutions.findUnique({
        where: { id: dto.institution_id },
      }),
      this.prisma.m01_subjects.findUnique({
        where: { id: dto.subject_id },
      }),
    ]);

    if (!institution) {
      throw new BadRequestException(`Institution with ID ${dto.institution_id} not found`);
    }

    if (!subject) {
      throw new BadRequestException(`Subject with ID ${dto.subject_id} not found`);
    }

    const classroom = await this.prisma.m01_classrooms.create({
      data: {
        institution_id: dto.institution_id,
        subject_id: dto.subject_id,
        name: dto.name,
        section: dto.section || null,
        academic_year: dto.academic_year || null,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
      },
      include: {
        institution: true,
        subject: true,
      },
    });

    const classroomDto: M01ClassroomDto = {
      id: classroom.id,
      institution_id: classroom.institution_id,
      subject_id: classroom.subject_id,
      name: classroom.name,
      section: classroom.section,
      academic_year: classroom.academic_year,
      is_active: classroom.is_active,
      created_at: classroom.created_at,
      updated_at: classroom.updated_at,
      institution: {
        id: classroom.institution.id,
        name: classroom.institution.name,
        code: classroom.institution.code,
      },
      subject: {
        id: classroom.subject.id,
        code: classroom.subject.code,
        name: classroom.subject.name,
      },
    };

    this.logger.log(`Admin ${adminEmail} created classroom ${classroom.id} (${classroom.name})`);

    return {
      classroom: classroomDto,
      message: 'Classroom created successfully',
    };
  }

  /**
   * Update an existing classroom
   */
  async updateClassroom(
    classroomId: string,
    dto: M01UpdateClassroomDto,
    adminEmail: string,
  ): Promise<M01ClassroomResponseDto> {
    // Check classroom exists
    const existingClassroom = await this.prisma.m01_classrooms.findUnique({
      where: { id: classroomId },
    });

    if (!existingClassroom) {
      throw new NotFoundException(`Classroom with ID ${classroomId} not found`);
    }

    // Validate foreign keys if being updated
    if (dto.institution_id) {
      const institution = await this.prisma.m01_institutions.findUnique({
        where: { id: dto.institution_id },
      });

      if (!institution) {
        throw new BadRequestException(`Institution with ID ${dto.institution_id} not found`);
      }
    }

    if (dto.subject_id) {
      const subject = await this.prisma.m01_subjects.findUnique({
        where: { id: dto.subject_id },
      });

      if (!subject) {
        throw new BadRequestException(`Subject with ID ${dto.subject_id} not found`);
      }
    }

    const classroom = await this.prisma.m01_classrooms.update({
      where: { id: classroomId },
      data: {
        ...(dto.institution_id !== undefined && { institution_id: dto.institution_id }),
        ...(dto.subject_id !== undefined && { subject_id: dto.subject_id }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.section !== undefined && { section: dto.section }),
        ...(dto.academic_year !== undefined && { academic_year: dto.academic_year }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
      include: {
        institution: true,
        subject: true,
      },
    });

    const classroomDto: M01ClassroomDto = {
      id: classroom.id,
      institution_id: classroom.institution_id,
      subject_id: classroom.subject_id,
      name: classroom.name,
      section: classroom.section,
      academic_year: classroom.academic_year,
      is_active: classroom.is_active,
      created_at: classroom.created_at,
      updated_at: classroom.updated_at,
      institution: {
        id: classroom.institution.id,
        name: classroom.institution.name,
        code: classroom.institution.code,
      },
      subject: {
        id: classroom.subject.id,
        code: classroom.subject.code,
        name: classroom.subject.name,
      },
    };

    this.logger.log(`Admin ${adminEmail} updated classroom ${classroomId}`);

    return {
      classroom: classroomDto,
      message: 'Classroom updated successfully',
    };
  }

  // ============================================================================
  // ENROLLMENTS
  // ============================================================================

  /**
   * List enrollments for a classroom with pagination
   */
  async listEnrollments(
    classroomId: string,
    params: PaginationParams,
    adminEmail: string,
  ): Promise<M01EnrollmentsResponseDto> {
    // Verify classroom exists
    const classroom = await this.prisma.m01_classrooms.findUnique({
      where: { id: classroomId },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${classroomId} not found`);
    }

    const offset = params.offset || 0;
    const limit = Math.min(params.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);

    const [enrollments, total] = await Promise.all([
      this.prisma.m01_classroom_enrollments.findMany({
        where: { classroom_id: classroomId },
        skip: offset,
        take: limit,
        orderBy: { enrolled_at: 'desc' },
        include: {
          user: true,
          classroom: true,
        },
      }),
      this.prisma.m01_classroom_enrollments.count({
        where: { classroom_id: classroomId },
      }),
    ]);

    const enrollmentDtos: M01EnrollmentDto[] = enrollments.map((enroll) => ({
      id: enroll.id,
      user_id: enroll.user_id,
      classroom_id: enroll.classroom_id,
      role: enroll.role,
      enrolled_at: enroll.enrolled_at,
      dropped_at: enroll.dropped_at,
      user: {
        id: enroll.user.id,
        email: enroll.user.email,
        first_name: enroll.user.first_name,
        last_name: enroll.user.last_name,
      },
      classroom: {
        id: enroll.classroom.id,
        name: enroll.classroom.name,
        section: enroll.classroom.section,
      },
    }));

    this.logger.log(
      `Admin ${adminEmail} listed enrollments for classroom ${classroomId}: offset=${offset}, limit=${limit}, total=${total}`,
    );

    return {
      enrollments: enrollmentDtos,
      total,
      offset,
      limit,
    };
  }

  /**
   * Create a new enrollment (enroll user in classroom)
   */
  async createEnrollment(
    dto: M01CreateEnrollmentDto,
    adminEmail: string,
  ): Promise<M01EnrollmentResponseDto> {
    // Validate foreign keys
    const [user, classroom] = await Promise.all([
      this.prisma.m01_users.findUnique({
        where: { id: dto.user_id },
      }),
      this.prisma.m01_classrooms.findUnique({
        where: { id: dto.classroom_id },
      }),
    ]);

    if (!user) {
      throw new BadRequestException(`User with ID ${dto.user_id} not found`);
    }

    if (!classroom) {
      throw new BadRequestException(`Classroom with ID ${dto.classroom_id} not found`);
    }

    // Check if user is already enrolled
    const existingEnrollment = await this.prisma.m01_classroom_enrollments.findUnique({
      where: {
        user_id_classroom_id: {
          user_id: dto.user_id,
          classroom_id: dto.classroom_id,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException(
        `User ${dto.user_id} is already enrolled in classroom ${dto.classroom_id}`,
      );
    }

    const enrollment = await this.prisma.m01_classroom_enrollments.create({
      data: {
        user_id: dto.user_id,
        classroom_id: dto.classroom_id,
        role: dto.role || 'student',
      },
      include: {
        user: true,
        classroom: true,
      },
    });

    const enrollmentDto: M01EnrollmentDto = {
      id: enrollment.id,
      user_id: enrollment.user_id,
      classroom_id: enrollment.classroom_id,
      role: enrollment.role,
      enrolled_at: enrollment.enrolled_at,
      dropped_at: enrollment.dropped_at,
      user: {
        id: enrollment.user.id,
        email: enrollment.user.email,
        first_name: enrollment.user.first_name,
        last_name: enrollment.user.last_name,
      },
      classroom: {
        id: enrollment.classroom.id,
        name: enrollment.classroom.name,
        section: enrollment.classroom.section,
      },
    };

    this.logger.log(
      `Admin ${adminEmail} enrolled user ${dto.user_id} in classroom ${dto.classroom_id}`,
    );

    return {
      enrollment: enrollmentDto,
      message: 'User enrolled successfully',
    };
  }

  /**
   * Update an enrollment (change role or drop status)
   */
  async updateEnrollment(
    enrollmentId: string,
    dto: M01UpdateEnrollmentDto,
    adminEmail: string,
  ): Promise<M01EnrollmentResponseDto> {
    // Check enrollment exists
    const existingEnrollment = await this.prisma.m01_classroom_enrollments.findUnique({
      where: { id: enrollmentId },
    });

    if (!existingEnrollment) {
      throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found`);
    }

    const enrollment = await this.prisma.m01_classroom_enrollments.update({
      where: { id: enrollmentId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.dropped === true && { dropped_at: new Date() }),
        ...(dto.dropped === false && { dropped_at: null }),
      },
      include: {
        user: true,
        classroom: true,
      },
    });

    const enrollmentDto: M01EnrollmentDto = {
      id: enrollment.id,
      user_id: enrollment.user_id,
      classroom_id: enrollment.classroom_id,
      role: enrollment.role,
      enrolled_at: enrollment.enrolled_at,
      dropped_at: enrollment.dropped_at,
      user: {
        id: enrollment.user.id,
        email: enrollment.user.email,
        first_name: enrollment.user.first_name,
        last_name: enrollment.user.last_name,
      },
      classroom: {
        id: enrollment.classroom.id,
        name: enrollment.classroom.name,
        section: enrollment.classroom.section,
      },
    };

    this.logger.log(`Admin ${adminEmail} updated enrollment ${enrollmentId}`);

    return {
      enrollment: enrollmentDto,
      message: 'Enrollment updated successfully',
    };
  }
}

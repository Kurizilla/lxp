import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { M01AdminGuard, M01AdminRequest } from '../guards/m01-admin.guard';
import { OrgService, PaginationParams } from './org.service';
import {
  M01CreateInstitutionDto,
  M01UpdateInstitutionDto,
  M01InstitutionsResponseDto,
  M01InstitutionResponseDto,
} from '../dto/create-institution.dto';
import {
  M01CreateSubjectDto,
  M01UpdateSubjectDto,
  M01SubjectsResponseDto,
  M01SubjectResponseDto,
} from '../dto/create-subject.dto';
import {
  M01CreateClassroomDto,
  M01UpdateClassroomDto,
  M01ClassroomsResponseDto,
  M01ClassroomResponseDto,
  M01CreateEnrollmentDto,
  M01UpdateEnrollmentDto,
  M01EnrollmentsResponseDto,
  M01EnrollmentResponseDto,
} from '../dto/create-classroom.dto';

/**
 * Query parameters for pagination
 */
class PaginationQuery implements PaginationParams {
  offset?: number;
  limit?: number;
}

/**
 * Controller for organizational management (institutions, subjects, classrooms, enrollments)
 * All endpoints require admin role via CASL RBAC
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, M01AdminGuard)
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  // ============================================================================
  // INSTITUTIONS
  // ============================================================================

  /**
   * GET /admin/institutions
   * List all institutions with pagination
   */
  @Get('institutions')
  async listInstitutions(
    @Query() query: PaginationQuery,
    @Req() req: M01AdminRequest,
  ): Promise<M01InstitutionsResponseDto> {
    return this.orgService.listInstitutions(query, req.user.email);
  }

  /**
   * GET /admin/institutions/:id
   * Get a single institution by ID
   */
  @Get('institutions/:id')
  async getInstitution(
    @Param('id') id: string,
    @Req() req: M01AdminRequest,
  ): Promise<M01InstitutionResponseDto> {
    return this.orgService.getInstitution(id, req.user.email);
  }

  /**
   * POST /admin/institutions
   * Create a new institution
   */
  @Post('institutions')
  @HttpCode(HttpStatus.CREATED)
  async createInstitution(
    @Body() dto: M01CreateInstitutionDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01InstitutionResponseDto> {
    return this.orgService.createInstitution(dto, req.user.email);
  }

  /**
   * PATCH /admin/institutions/:id
   * Update an existing institution
   */
  @Patch('institutions/:id')
  async updateInstitution(
    @Param('id') id: string,
    @Body() dto: M01UpdateInstitutionDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01InstitutionResponseDto> {
    return this.orgService.updateInstitution(id, dto, req.user.email);
  }

  // ============================================================================
  // SUBJECTS
  // ============================================================================

  /**
   * GET /admin/subjects
   * List all subjects with pagination
   */
  @Get('subjects')
  async listSubjects(
    @Query() query: PaginationQuery,
    @Req() req: M01AdminRequest,
  ): Promise<M01SubjectsResponseDto> {
    return this.orgService.listSubjects(query, req.user.email);
  }

  /**
   * GET /admin/subjects/:id
   * Get a single subject by ID
   */
  @Get('subjects/:id')
  async getSubject(
    @Param('id') id: string,
    @Req() req: M01AdminRequest,
  ): Promise<M01SubjectResponseDto> {
    return this.orgService.getSubject(id, req.user.email);
  }

  /**
   * POST /admin/subjects
   * Create a new subject
   */
  @Post('subjects')
  @HttpCode(HttpStatus.CREATED)
  async createSubject(
    @Body() dto: M01CreateSubjectDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01SubjectResponseDto> {
    return this.orgService.createSubject(dto, req.user.email);
  }

  /**
   * PATCH /admin/subjects/:id
   * Update an existing subject
   */
  @Patch('subjects/:id')
  async updateSubject(
    @Param('id') id: string,
    @Body() dto: M01UpdateSubjectDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01SubjectResponseDto> {
    return this.orgService.updateSubject(id, dto, req.user.email);
  }

  // ============================================================================
  // CLASSROOMS
  // ============================================================================

  /**
   * GET /admin/classrooms
   * List all classrooms with pagination
   */
  @Get('classrooms')
  async listClassrooms(
    @Query() query: PaginationQuery,
    @Req() req: M01AdminRequest,
  ): Promise<M01ClassroomsResponseDto> {
    return this.orgService.listClassrooms(query, req.user.email);
  }

  /**
   * GET /admin/classrooms/:id
   * Get a single classroom by ID
   */
  @Get('classrooms/:id')
  async getClassroom(
    @Param('id') id: string,
    @Req() req: M01AdminRequest,
  ): Promise<M01ClassroomResponseDto> {
    return this.orgService.getClassroom(id, req.user.email);
  }

  /**
   * POST /admin/classrooms
   * Create a new classroom
   */
  @Post('classrooms')
  @HttpCode(HttpStatus.CREATED)
  async createClassroom(
    @Body() dto: M01CreateClassroomDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01ClassroomResponseDto> {
    return this.orgService.createClassroom(dto, req.user.email);
  }

  /**
   * PATCH /admin/classrooms/:id
   * Update an existing classroom
   */
  @Patch('classrooms/:id')
  async updateClassroom(
    @Param('id') id: string,
    @Body() dto: M01UpdateClassroomDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01ClassroomResponseDto> {
    return this.orgService.updateClassroom(id, dto, req.user.email);
  }

  // ============================================================================
  // ENROLLMENTS
  // ============================================================================

  /**
   * GET /admin/classrooms/:id/enrollments
   * List all enrollments for a classroom with pagination
   */
  @Get('classrooms/:id/enrollments')
  async listEnrollments(
    @Param('id') id: string,
    @Query() query: PaginationQuery,
    @Req() req: M01AdminRequest,
  ): Promise<M01EnrollmentsResponseDto> {
    return this.orgService.listEnrollments(id, query, req.user.email);
  }

  /**
   * POST /admin/enrollments
   * Enroll a user in a classroom
   */
  @Post('enrollments')
  @HttpCode(HttpStatus.CREATED)
  async createEnrollment(
    @Body() dto: M01CreateEnrollmentDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01EnrollmentResponseDto> {
    return this.orgService.createEnrollment(dto, req.user.email);
  }

  /**
   * PATCH /admin/enrollments/:id
   * Update an enrollment
   */
  @Patch('enrollments/:id')
  async updateEnrollment(
    @Param('id') id: string,
    @Body() dto: M01UpdateEnrollmentDto,
    @Req() req: M01AdminRequest,
  ): Promise<M01EnrollmentResponseDto> {
    return this.orgService.updateEnrollment(id, dto, req.user.email);
  }
}

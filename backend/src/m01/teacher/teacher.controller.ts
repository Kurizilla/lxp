import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { M01TeacherGuard, M01TeacherRequest } from '../guards/m01-teacher.guard';
import { TeacherService } from './teacher.service';
import {
  M01TeacherInstitutionsResponseDto,
  M01TeacherClassroomsResponseDto,
  M01TeacherClassroomsQueryDto,
} from '../dto/teacher.dto';

/**
 * Controller for teacher-specific endpoints
 * All endpoints require teacher role via CASL RBAC
 */
@Controller('teacher')
@UseGuards(JwtAuthGuard, M01TeacherGuard)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  /**
   * GET /teacher/institutions
   * Returns institutions assigned to the authenticated teacher
   */
  @Get('institutions')
  async getInstitutions(
    @Req() req: M01TeacherRequest,
  ): Promise<M01TeacherInstitutionsResponseDto> {
    return this.teacherService.getInstitutions(req.user.id);
  }

  /**
   * GET /teacher/classrooms
   * Returns classrooms where the authenticated teacher is enrolled with 'teacher' role
   * Optionally filter by institution_id
   */
  @Get('classrooms')
  async getClassrooms(
    @Query() query: M01TeacherClassroomsQueryDto,
    @Req() req: M01TeacherRequest,
  ): Promise<M01TeacherClassroomsResponseDto> {
    return this.teacherService.getClassrooms(req.user.id, query);
  }
}

import { IsOptional, IsUUID } from 'class-validator';

/**
 * Query parameters for filtering classrooms
 */
export class M01TeacherClassroomsQueryDto {
  @IsUUID('4', { message: 'institution_id must be a valid UUID' })
  @IsOptional()
  institution_id?: string;
}

/**
 * Institution DTO for teacher endpoint
 */
export interface M01TeacherInstitutionDto {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
  role_context: string | null;
  joined_at: Date;
}

/**
 * Response DTO for teacher institutions list
 */
export interface M01TeacherInstitutionsResponseDto {
  institutions: M01TeacherInstitutionDto[];
  total: number;
}

/**
 * Subject DTO for classroom response
 */
export interface M01TeacherSubjectDto {
  id: string;
  code: string;
  name: string;
  grade: string | null;
}

/**
 * Institution summary for classroom response
 */
export interface M01TeacherInstitutionSummaryDto {
  id: string;
  name: string;
  code: string;
}

/**
 * Classroom DTO for teacher endpoint
 */
export interface M01TeacherClassroomDto {
  id: string;
  name: string;
  section: string | null;
  academic_year: string | null;
  is_active: boolean;
  enrolled_at: Date;
  role: string;
  institution: M01TeacherInstitutionSummaryDto;
  subject: M01TeacherSubjectDto;
}

/**
 * Response DTO for teacher classrooms list
 */
export interface M01TeacherClassroomsResponseDto {
  classrooms: M01TeacherClassroomDto[];
  total: number;
}

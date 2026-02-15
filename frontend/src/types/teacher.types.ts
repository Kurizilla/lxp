/**
 * Teacher types matching backend M01 DTOs
 * Based on contracts from backend/src/m01/dto/teacher.dto.ts
 */

// ============================================
// Teacher Institution types
// ============================================

export interface TeacherInstitution {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
  role_context: string | null;
  joined_at: string;
}

export interface TeacherInstitutionsResponse {
  institutions: TeacherInstitution[];
  total: number;
}

// ============================================
// Teacher Classroom types
// ============================================

export interface TeacherSubject {
  id: string;
  code: string;
  name: string;
  grade: string | null;
}

export interface TeacherInstitutionSummary {
  id: string;
  name: string;
  code: string;
}

export interface TeacherClassroom {
  id: string;
  name: string;
  section: string | null;
  academic_year: string | null;
  is_active: boolean;
  enrolled_at: string;
  role: string;
  institution: TeacherInstitutionSummary;
  subject: TeacherSubject;
}

export interface TeacherClassroomsResponse {
  classrooms: TeacherClassroom[];
  total: number;
}

export interface TeacherClassroomsQuery {
  institution_id?: string;
}

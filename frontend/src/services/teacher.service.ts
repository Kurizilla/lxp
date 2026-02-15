import { api } from './api.service';
import type {
  TeacherInstitutionsResponse,
  TeacherClassroomsResponse,
  TeacherClassroomsQuery,
} from '@/types';

/**
 * Build query string from classroom query params
 */
function build_classrooms_query(params?: TeacherClassroomsQuery): string {
  if (!params?.institution_id) {
    return '';
  }
  return `?institution_id=${encodeURIComponent(params.institution_id)}`;
}

/**
 * Teacher service
 * Maps to backend /teacher endpoints
 */
export const teacher_service = {
  /**
   * GET /teacher/institutions
   * Get institutions assigned to the authenticated teacher
   */
  get_institutions: (): Promise<TeacherInstitutionsResponse> =>
    api.get<TeacherInstitutionsResponse>('/teacher/institutions'),

  /**
   * GET /teacher/classrooms
   * Get classrooms where the authenticated teacher is enrolled
   * Optionally filter by institution_id
   */
  get_classrooms: (params?: TeacherClassroomsQuery): Promise<TeacherClassroomsResponse> =>
    api.get<TeacherClassroomsResponse>(`/teacher/classrooms${build_classrooms_query(params)}`),
};

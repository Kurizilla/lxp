/**
 * Admin types matching backend M01 DTOs
 * Based on contracts from backend/src/m01/dto/
 */

// ============================================
// User types (admin view)
// ============================================

export interface AdminUserRole {
  id: string;
  name: string;
  description: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  google_id: string | null;
  created_at: string;
  updated_at: string;
  roles?: AdminUserRole[];
}

export interface CreateUserRequest {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  offset: number;
  limit: number;
}

export interface AdminUserResponse {
  user: AdminUser;
  message?: string;
}

// ============================================
// Role types
// ============================================

export interface RolePermission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  permissions?: RolePermission[];
}

export interface AdminRolesResponse {
  roles: AdminRole[];
  total: number;
  offset: number;
  limit: number;
}

export interface AssignRoleRequest {
  role_ids: string[];
}

export interface AssignRoleResponse {
  message: string;
  user_id: string;
  assigned_roles: AdminUserRole[];
}

// ============================================
// Permission types
// ============================================

export interface AdminPermission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  created_at: string;
  updated_at: string;
}

export interface AdminPermissionsResponse {
  permissions: AdminPermission[];
  total: number;
  offset: number;
  limit: number;
}

export interface AssignPermissionRequest {
  permission_ids: string[];
}

export interface AssignPermissionResponse {
  message: string;
  role_id: string;
  assigned_permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
  }>;
}

// ============================================
// Institution types
// ============================================

export interface Institution {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateInstitutionRequest {
  name: string;
  code: string;
  address?: string;
  is_active?: boolean;
}

export interface UpdateInstitutionRequest {
  name?: string;
  code?: string;
  address?: string;
  is_active?: boolean;
}

export interface InstitutionsResponse {
  institutions: Institution[];
  total: number;
  offset: number;
  limit: number;
}

export interface InstitutionResponse {
  institution: Institution;
  message?: string;
}

// ============================================
// Subject types
// ============================================

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string | null;
  grade: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSubjectRequest {
  code: string;
  name: string;
  description?: string;
  grade?: string;
  is_active?: boolean;
}

export interface UpdateSubjectRequest {
  code?: string;
  name?: string;
  description?: string;
  grade?: string;
  is_active?: boolean;
}

export interface SubjectsResponse {
  subjects: Subject[];
  total: number;
  offset: number;
  limit: number;
}

export interface SubjectResponse {
  subject: Subject;
  message?: string;
}

// ============================================
// Classroom types
// ============================================

export interface ClassroomInstitution {
  id: string;
  name: string;
  code: string;
}

export interface ClassroomSubject {
  id: string;
  code: string;
  name: string;
}

export interface Classroom {
  id: string;
  institution_id: string;
  subject_id: string;
  name: string;
  section: string | null;
  academic_year: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  institution?: ClassroomInstitution;
  subject?: ClassroomSubject;
}

export interface CreateClassroomRequest {
  institution_id: string;
  subject_id: string;
  name: string;
  section?: string;
  academic_year?: string;
  is_active?: boolean;
}

export interface UpdateClassroomRequest {
  institution_id?: string;
  subject_id?: string;
  name?: string;
  section?: string;
  academic_year?: string;
  is_active?: boolean;
}

export interface ClassroomsResponse {
  classrooms: Classroom[];
  total: number;
  offset: number;
  limit: number;
}

export interface ClassroomResponse {
  classroom: Classroom;
  message?: string;
}

// ============================================
// Enrollment types
// ============================================

export interface EnrollmentUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface EnrollmentClassroom {
  id: string;
  name: string;
  section: string | null;
}

export interface Enrollment {
  id: string;
  user_id: string;
  classroom_id: string;
  role: string;
  enrolled_at: string;
  dropped_at: string | null;
  user?: EnrollmentUser;
  classroom?: EnrollmentClassroom;
}

export interface CreateEnrollmentRequest {
  user_id: string;
  classroom_id: string;
  role?: string;
}

export interface UpdateEnrollmentRequest {
  role?: string;
  dropped?: boolean;
}

export interface EnrollmentsResponse {
  enrollments: Enrollment[];
  total: number;
  offset: number;
  limit: number;
}

export interface EnrollmentResponse {
  enrollment: Enrollment;
  message?: string;
}

// ============================================
// Common types
// ============================================

export interface PaginationParams {
  offset?: number;
  limit?: number;
}

export interface FilterParams {
  search?: string;
  is_active?: boolean;
}

export interface DeleteResponse {
  message: string;
}

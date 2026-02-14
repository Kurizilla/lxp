import { api } from './api.service';
import type {
  // User types
  AdminUsersResponse,
  AdminUserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRoleRequest,
  AssignRoleResponse,
  // Role types
  AdminRole,
  AdminRolesResponse,
  AssignPermissionRequest,
  AssignPermissionResponse,
  // Permission types
  AdminPermissionsResponse,
  // Institution types
  InstitutionsResponse,
  InstitutionResponse,
  CreateInstitutionRequest,
  UpdateInstitutionRequest,
  // Subject types
  SubjectsResponse,
  SubjectResponse,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  // Classroom types
  ClassroomsResponse,
  ClassroomResponse,
  CreateClassroomRequest,
  UpdateClassroomRequest,
  // Common types
  DeleteResponse,
  PaginationParams,
} from '@/types';

/**
 * Build query string from params
 */
function build_query_string<T extends object>(params: T): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  }
  const str = query.toString();
  return str ? `?${str}` : '';
}

/**
 * Admin users service
 * Maps to backend /admin/users endpoints
 */
export const admin_users_service = {
  /**
   * GET /admin/users
   * List users with pagination and filters
   */
  list: (params?: PaginationParams & { search?: string; is_active?: boolean }): Promise<AdminUsersResponse> =>
    api.get<AdminUsersResponse>(`/admin/users${build_query_string(params || {})}`),

  /**
   * GET /admin/users/:id
   * Get a single user by ID
   */
  get: (user_id: string): Promise<AdminUserResponse> =>
    api.get<AdminUserResponse>(`/admin/users/${user_id}`),

  /**
   * POST /admin/users
   * Create a new user
   */
  create: (data: CreateUserRequest): Promise<AdminUserResponse> =>
    api.post<AdminUserResponse>('/admin/users', data),

  /**
   * PATCH /admin/users/:id
   * Update an existing user
   */
  update: (user_id: string, data: UpdateUserRequest): Promise<AdminUserResponse> =>
    api.patch<AdminUserResponse>(`/admin/users/${user_id}`, data),

  /**
   * DELETE /admin/users/:id
   * Delete a user
   */
  delete: (user_id: string): Promise<DeleteResponse> =>
    api.delete<DeleteResponse>(`/admin/users/${user_id}`),

  /**
   * POST /admin/users/:id/roles
   * Assign roles to a user
   */
  assign_roles: (user_id: string, data: AssignRoleRequest): Promise<AssignRoleResponse> =>
    api.post<AssignRoleResponse>(`/admin/users/${user_id}/roles`, data),
};

/**
 * Admin roles service
 * Maps to backend /admin/roles endpoints
 */
export const admin_roles_service = {
  /**
   * GET /admin/roles
   * List roles with pagination
   */
  list: (params?: PaginationParams): Promise<AdminRolesResponse> =>
    api.get<AdminRolesResponse>(`/admin/roles${build_query_string(params || {})}`),

  /**
   * GET /admin/roles/:id
   * Get a single role by ID
   */
  get: (role_id: string): Promise<{ role: AdminRole }> =>
    api.get<{ role: AdminRole }>(`/admin/roles/${role_id}`),

  /**
   * POST /admin/roles/:id/permissions
   * Assign permissions to a role
   */
  assign_permissions: (role_id: string, data: AssignPermissionRequest): Promise<AssignPermissionResponse> =>
    api.post<AssignPermissionResponse>(`/admin/roles/${role_id}/permissions`, data),
};

/**
 * Admin permissions service
 * Maps to backend /admin/permissions endpoints
 */
export const admin_permissions_service = {
  /**
   * GET /admin/permissions
   * List all permissions
   */
  list: (params?: PaginationParams): Promise<AdminPermissionsResponse> =>
    api.get<AdminPermissionsResponse>(`/admin/permissions${build_query_string(params || {})}`),
};

/**
 * Admin institutions service
 * Maps to backend /admin/institutions endpoints
 */
export const admin_institutions_service = {
  /**
   * GET /admin/institutions
   * List institutions with pagination and filters
   */
  list: (params?: PaginationParams & { search?: string; is_active?: boolean }): Promise<InstitutionsResponse> =>
    api.get<InstitutionsResponse>(`/admin/institutions${build_query_string(params || {})}`),

  /**
   * GET /admin/institutions/:id
   * Get a single institution by ID
   */
  get: (institution_id: string): Promise<InstitutionResponse> =>
    api.get<InstitutionResponse>(`/admin/institutions/${institution_id}`),

  /**
   * POST /admin/institutions
   * Create a new institution
   */
  create: (data: CreateInstitutionRequest): Promise<InstitutionResponse> =>
    api.post<InstitutionResponse>('/admin/institutions', data),

  /**
   * PATCH /admin/institutions/:id
   * Update an existing institution
   */
  update: (institution_id: string, data: UpdateInstitutionRequest): Promise<InstitutionResponse> =>
    api.patch<InstitutionResponse>(`/admin/institutions/${institution_id}`, data),

  /**
   * DELETE /admin/institutions/:id
   * Delete an institution
   */
  delete: (institution_id: string): Promise<DeleteResponse> =>
    api.delete<DeleteResponse>(`/admin/institutions/${institution_id}`),
};

/**
 * Admin subjects service
 * Maps to backend /admin/subjects endpoints
 */
export const admin_subjects_service = {
  /**
   * GET /admin/subjects
   * List subjects with pagination and filters
   */
  list: (params?: PaginationParams & { search?: string; is_active?: boolean }): Promise<SubjectsResponse> =>
    api.get<SubjectsResponse>(`/admin/subjects${build_query_string(params || {})}`),

  /**
   * GET /admin/subjects/:id
   * Get a single subject by ID
   */
  get: (subject_id: string): Promise<SubjectResponse> =>
    api.get<SubjectResponse>(`/admin/subjects/${subject_id}`),

  /**
   * POST /admin/subjects
   * Create a new subject
   */
  create: (data: CreateSubjectRequest): Promise<SubjectResponse> =>
    api.post<SubjectResponse>('/admin/subjects', data),

  /**
   * PATCH /admin/subjects/:id
   * Update an existing subject
   */
  update: (subject_id: string, data: UpdateSubjectRequest): Promise<SubjectResponse> =>
    api.patch<SubjectResponse>(`/admin/subjects/${subject_id}`, data),

  /**
   * DELETE /admin/subjects/:id
   * Delete a subject
   */
  delete: (subject_id: string): Promise<DeleteResponse> =>
    api.delete<DeleteResponse>(`/admin/subjects/${subject_id}`),
};

/**
 * Admin classrooms service
 * Maps to backend /admin/classrooms endpoints
 */
export const admin_classrooms_service = {
  /**
   * GET /admin/classrooms
   * List classrooms with pagination and filters
   */
  list: (params?: PaginationParams & { search?: string; is_active?: boolean; institution_id?: string; subject_id?: string }): Promise<ClassroomsResponse> =>
    api.get<ClassroomsResponse>(`/admin/classrooms${build_query_string(params || {})}`),

  /**
   * GET /admin/classrooms/:id
   * Get a single classroom by ID
   */
  get: (classroom_id: string): Promise<ClassroomResponse> =>
    api.get<ClassroomResponse>(`/admin/classrooms/${classroom_id}`),

  /**
   * POST /admin/classrooms
   * Create a new classroom
   */
  create: (data: CreateClassroomRequest): Promise<ClassroomResponse> =>
    api.post<ClassroomResponse>('/admin/classrooms', data),

  /**
   * PATCH /admin/classrooms/:id
   * Update an existing classroom
   */
  update: (classroom_id: string, data: UpdateClassroomRequest): Promise<ClassroomResponse> =>
    api.patch<ClassroomResponse>(`/admin/classrooms/${classroom_id}`, data),

  /**
   * DELETE /admin/classrooms/:id
   * Delete a classroom
   */
  delete: (classroom_id: string): Promise<DeleteResponse> =>
    api.delete<DeleteResponse>(`/admin/classrooms/${classroom_id}`),
};

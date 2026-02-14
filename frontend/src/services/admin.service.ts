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
   * List users with pagination
   * Note: Backend only supports offset and limit, no search/filter
   */
  list: (params?: PaginationParams): Promise<AdminUsersResponse> =>
    api.get<AdminUsersResponse>(`/admin/users${build_query_string({ offset: params?.offset, limit: params?.limit })}`),

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
 * Note: Backend does not have GET /admin/roles endpoint
 * Roles are obtained from user data or hardcoded for now
 */
export const admin_roles_service = {
  /**
   * List roles - returns hardcoded system roles since backend doesn't have this endpoint
   * In a real implementation, this would call GET /admin/roles
   */
  list: async (): Promise<AdminRolesResponse> => {
    // Hardcoded system roles matching the seed data
    const system_roles: AdminRole[] = [
      { id: 'admin', name: 'admin', description: 'Administrator with full access', is_system: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), permissions: [] },
      { id: 'teacher', name: 'teacher', description: 'Teacher role', is_system: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), permissions: [] },
      { id: 'student', name: 'student', description: 'Student role', is_system: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), permissions: [] },
    ];
    return { roles: system_roles, total: system_roles.length, offset: 0, limit: 100 };
  },

  /**
   * POST /admin/roles/:id/permissions
   * Assign permissions to a role
   */
  assign_permissions: (role_id: string, data: AssignPermissionRequest): Promise<AssignPermissionResponse> =>
    api.post<AssignPermissionResponse>(`/admin/roles/${role_id}/permissions`, data),
};

/**
 * Admin permissions service
 * Note: Backend does not have GET /admin/permissions endpoint
 */
export const admin_permissions_service = {
  /**
   * List permissions - returns empty since backend doesn't have this endpoint
   * In a real implementation, this would call GET /admin/permissions
   */
  list: async (): Promise<AdminPermissionsResponse> => {
    // Backend doesn't have this endpoint yet
    return { permissions: [], total: 0, offset: 0, limit: 100 };
  },
};

/**
 * Admin institutions service
 * Maps to backend /admin/institutions endpoints
 */
export const admin_institutions_service = {
  /**
   * GET /admin/institutions
   * List institutions with pagination
   * Note: Backend only supports offset and limit
   */
  list: (params?: PaginationParams): Promise<InstitutionsResponse> =>
    api.get<InstitutionsResponse>(`/admin/institutions${build_query_string({ offset: params?.offset, limit: params?.limit })}`),

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
   * List subjects with pagination
   * Note: Backend only supports offset and limit
   */
  list: (params?: PaginationParams): Promise<SubjectsResponse> =>
    api.get<SubjectsResponse>(`/admin/subjects${build_query_string({ offset: params?.offset, limit: params?.limit })}`),

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
   * List classrooms with pagination
   * Note: Backend only supports offset and limit
   */
  list: (params?: PaginationParams): Promise<ClassroomsResponse> =>
    api.get<ClassroomsResponse>(`/admin/classrooms${build_query_string({ offset: params?.offset, limit: params?.limit })}`),

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

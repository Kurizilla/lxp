/**
 * API types based on foundation contracts:
 * - {page: number, limit: number, total: number, data: T[]} pagination
 * - {code: string, message: string, details?: Record<string, any>} error format
 */

// Pagination response type
export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  data: T[];
}

// API error response type
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination params for API requests
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// User entity
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName?: string;
  establishmentId?: string;
  establishmentName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
  establishmentId?: string;
  isActive?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  roleId?: string;
  establishmentId?: string;
  isActive?: boolean;
}

// Role entity
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  name: string;
  description: string;
  permissions: string[];
  isActive?: boolean;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

// Establishment entity
export interface Establishment {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEstablishmentDto {
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface UpdateEstablishmentDto {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

// Classroom entity
export interface Classroom {
  id: string;
  name: string;
  code: string;
  capacity: number;
  establishmentId: string;
  establishmentName?: string;
  floor?: string;
  building?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassroomDto {
  name: string;
  code: string;
  capacity: number;
  establishmentId: string;
  floor?: string;
  building?: string;
  isActive?: boolean;
}

export interface UpdateClassroomDto {
  name?: string;
  code?: string;
  capacity?: number;
  establishmentId?: string;
  floor?: string;
  building?: string;
  isActive?: boolean;
}

// Available permissions for RBAC
export type Permission = 
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'roles:read'
  | 'roles:create'
  | 'roles:update'
  | 'roles:delete'
  | 'establishments:read'
  | 'establishments:create'
  | 'establishments:update'
  | 'establishments:delete'
  | 'classrooms:read'
  | 'classrooms:create'
  | 'classrooms:update'
  | 'classrooms:delete';

export const ALL_PERMISSIONS: Permission[] = [
  'users:read',
  'users:create',
  'users:update',
  'users:delete',
  'roles:read',
  'roles:create',
  'roles:update',
  'roles:delete',
  'establishments:read',
  'establishments:create',
  'establishments:update',
  'establishments:delete',
  'classrooms:read',
  'classrooms:create',
  'classrooms:update',
  'classrooms:delete',
];

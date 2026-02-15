import { IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

/**
 * DTO for assigning roles to a user
 */
export class M01AssignRoleDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one role ID is required' })
  @IsUUID('4', { each: true, message: 'Each role_id must be a valid UUID' })
  role_ids!: string[];
}

/**
 * Response DTO for role assignment
 */
export interface M01AssignRoleResponseDto {
  message: string;
  user_id: string;
  assigned_roles: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
}

/**
 * DTO for admin role listing
 */
export interface M01AdminRoleDto {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
  permissions?: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
  }>;
}

/**
 * Response DTO for paginated role list
 */
export interface M01AdminRolesResponseDto {
  roles: M01AdminRoleDto[];
  total: number;
  offset: number;
  limit: number;
}

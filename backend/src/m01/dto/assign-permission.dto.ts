import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

/**
 * DTO for assigning permissions to a role
 */
export class M01AssignPermissionDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one permission ID is required' })
  @IsUUID('4', { each: true, message: 'Each permission_id must be a valid UUID' })
  permission_ids!: string[];
}

/**
 * Response DTO for permission assignment
 */
export interface M01AssignPermissionResponseDto {
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

/**
 * DTO for admin permission listing
 */
export interface M01AdminPermissionDto {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Response DTO for paginated permission list
 */
export interface M01AdminPermissionsResponseDto {
  permissions: M01AdminPermissionDto[];
  total: number;
  offset: number;
  limit: number;
}

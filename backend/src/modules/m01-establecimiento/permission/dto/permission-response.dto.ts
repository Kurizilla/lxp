export class PermissionResponseDto {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;

  static fromEntity(permission: any): PermissionResponseDto {
    return {
      id: permission.id.toString(),
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
      is_active: permission.is_active,
      created_at: permission.createdAt,
      updated_at: permission.updatedAt,
    };
  }
}

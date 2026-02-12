export class PermissionResponseDto {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  created_at: Date;
  updated_at: Date;

  static fromEntity(permission: any): PermissionResponseDto {
    return {
      id: permission.id.toString(),
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
      created_at: permission.created_at,
      updated_at: permission.updated_at,
    };
  }
}

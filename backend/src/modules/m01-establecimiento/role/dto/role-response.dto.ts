export class RolePermissionResponseDto {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export class RoleResponseDto {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  permissions: RolePermissionResponseDto[];
  created_at: Date;
  updated_at: Date;

  static fromEntity(role: any): RoleResponseDto {
    return {
      id: role.id.toString(),
      name: role.name,
      description: role.description,
      is_active: role.is_active,
      permissions: (role.permissions || []).map((rp: any) => ({
        id: rp.permission.id.toString(),
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
      created_at: role.createdAt,
      updated_at: role.updatedAt,
    };
  }
}

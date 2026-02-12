export class UserRoleResponseDto {
  id: string;
  role_id: string;
  role_name: string;
  assigned_at: Date;
}

export class UserResponseDto {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  email_verified: boolean;
  last_login_at: Date | null;
  roles: UserRoleResponseDto[];
  created_at: Date;
  updated_at: Date;

  static fromEntity(user: any): UserResponseDto {
    return {
      id: user.id.toString(),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active,
      email_verified: user.email_verified,
      last_login_at: user.last_login_at,
      roles: (user.user_roles || []).map((ur: any) => ({
        id: ur.id.toString(),
        role_id: ur.role_id.toString(),
        role_name: ur.role?.name || '',
        assigned_at: ur.assigned_at,
      })),
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}

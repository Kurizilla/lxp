import { UserStatus } from '@prisma/client';

export class UserResponseDto {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: UserStatus;
  role_id: string | null;
  role_name: string | null;
  created_at: Date;
  updated_at: Date;

  static fromEntity(user: any): UserResponseDto {
    return {
      id: user.id.toString(),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      status: user.status,
      role_id: user.role_id?.toString() || null,
      role_name: user.role?.name || null,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }
}

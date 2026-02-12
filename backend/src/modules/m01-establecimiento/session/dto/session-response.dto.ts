export class SessionUserDto {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export class SessionResponseDto {
  id: string;
  user_id: string;
  user: SessionUserDto | null;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  expires_at: Date;
  last_activity: Date;
  created_at: Date;
  updated_at: Date;

  static fromEntity(session: any): SessionResponseDto {
    return {
      id: session.id.toString(),
      user_id: session.user_id.toString(),
      user: session.user
        ? {
            id: session.user.id.toString(),
            email: session.user.email,
            first_name: session.user.first_name,
            last_name: session.user.last_name,
          }
        : null,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      is_active: session.is_active,
      expires_at: session.expires_at,
      last_activity: session.last_activity,
      created_at: session.createdAt,
      updated_at: session.updatedAt,
    };
  }
}

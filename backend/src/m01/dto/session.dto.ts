/**
 * DTO for a user session
 */
export interface M01SessionDto {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  expires_at: Date;
  is_current: boolean;
}

/**
 * Response DTO for listing user sessions
 */
export interface M01SessionsResponseDto {
  sessions: M01SessionDto[];
  total: number;
}

/**
 * Response DTO for deleting a session
 */
export interface M01DeleteSessionResponseDto {
  message: string;
  session_id: string;
}

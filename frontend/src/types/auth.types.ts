/**
 * Auth types matching backend M01 DTOs
 * Based on contracts from backend/src/m01/dto/
 */

// Login types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

// Google login types
export interface GoogleLoginRequest {
  id_token: string;
}

export interface GoogleLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    google_id: string | null;
  };
  is_new_user: boolean;
}

// Forgot password types
export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

// Session types
export interface Session {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  is_current: boolean;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
}

export interface DeleteSessionResponse {
  message: string;
  session_id: string;
}

// User role type
export type UserRole = 'admin' | 'teacher' | 'student' | null;

// User type for auth store
export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  google_id?: string | null;
  role?: UserRole;
}

// API error response
export interface ApiError {
  message: string;
  status_code?: number;
  error?: string;
}

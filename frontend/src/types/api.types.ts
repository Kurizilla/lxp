/**
 * API Types based on interface contracts
 * Module: M01 - Establecimiento
 */

// Standard API error format
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Standard pagination format
export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  data: T[];
}

// Login DTO - from contract est-auth-login
export interface LoginDto {
  email: string;
  password: string;
}

// Auth response from login endpoint
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

// User info from auth response
export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Session info for sessions page
export interface SessionInfo {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

// Institution for selector
export interface Institution {
  id: string;
  name: string;
  code: string;
  address?: string;
  logoUrl?: string;
}

// Classroom for selector
export interface Classroom {
  id: string;
  name: string;
  code: string;
  grade: string;
  section?: string;
  institutionId: string;
}

// Google OAuth response
export interface GoogleAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

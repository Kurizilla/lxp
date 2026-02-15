import { api } from './api.service';
import type {
  LoginRequest,
  LoginResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  SessionsResponse,
  DeleteSessionResponse,
} from '@/types';

/**
 * Authentication service
 * Maps to backend /auth endpoints
 */
export const auth_service = {
  /**
   * POST /auth/login
   * Authenticate with email and password
   */
  login: (data: LoginRequest): Promise<LoginResponse> =>
    api.post<LoginResponse>('/auth/login', data),

  /**
   * POST /auth/google-login
   * Authenticate with Google OAuth
   */
  google_login: (data: GoogleLoginRequest): Promise<GoogleLoginResponse> =>
    api.post<GoogleLoginResponse>('/auth/google-login', data),

  /**
   * POST /auth/forgot-password
   * Request password reset email
   */
  forgot_password: (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> =>
    api.post<ForgotPasswordResponse>('/auth/forgot-password', data),

  /**
   * GET /auth/sessions
   * Get list of active sessions
   */
  get_sessions: (): Promise<SessionsResponse> =>
    api.get<SessionsResponse>('/auth/sessions'),

  /**
   * DELETE /auth/sessions/:id
   * Delete a specific session
   */
  delete_session: (session_id: string): Promise<DeleteSessionResponse> =>
    api.delete<DeleteSessionResponse>(`/auth/sessions/${session_id}`),
};

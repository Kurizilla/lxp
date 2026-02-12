import type {
  LoginDto,
  AuthResponse,
  ApiError,
  SessionInfo,
  Institution,
  Classroom,
  PaginatedResponse,
} from '../types/api.types';
import { useM01AuthStore } from '../stores/m01AuthStore';

const API_BASE = '/api/v1/modules/m01';

class M01AuthService {
  private getAuthHeaders(): HeadersInit {
    const token = useM01AuthStore.getState().accessToken;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      }));
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  }

  /**
   * Login with email and password
   * POST /api/v1/modules/m01/est-auth/login
   */
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/est-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  /**
   * Login with Google OAuth
   * POST /api/v1/modules/m01/est-auth/google
   */
  async loginWithGoogle(token: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/est-auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return this.handleResponse<AuthResponse>(response);
  }

  /**
   * Logout current session
   * POST /api/v1/modules/m01/est-auth/logout
   */
  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE}/est-auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Logout failed');
    }
  }

  /**
   * Get active sessions
   * GET /api/v1/modules/m01/est-auth/sessions
   */
  async getSessions(): Promise<SessionInfo[]> {
    const response = await fetch(`${API_BASE}/est-auth/sessions`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<SessionInfo[]>(response);
  }

  /**
   * Revoke a specific session
   * DELETE /api/v1/modules/m01/est-auth/sessions/:id
   */
  async revokeSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/est-auth/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to revoke session');
    }
  }

  /**
   * Revoke all sessions except current
   * DELETE /api/v1/modules/m01/est-auth/sessions
   */
  async revokeAllSessions(): Promise<void> {
    const response = await fetch(`${API_BASE}/est-auth/sessions`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to revoke sessions');
    }
  }

  /**
   * Get user's institutions
   * GET /api/v1/modules/m01/institutions
   */
  async getInstitutions(): Promise<PaginatedResponse<Institution>> {
    const response = await fetch(`${API_BASE}/institutions`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<PaginatedResponse<Institution>>(response);
  }

  /**
   * Get classrooms for an institution
   * GET /api/v1/modules/m01/institutions/:id/classrooms
   */
  async getClassrooms(
    institutionId: string
  ): Promise<PaginatedResponse<Classroom>> {
    const response = await fetch(
      `${API_BASE}/institutions/${institutionId}/classrooms`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<PaginatedResponse<Classroom>>(response);
  }

  /**
   * Refresh access token
   * POST /api/v1/modules/m01/est-auth/refresh
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = useM01AuthStore.getState().refreshToken;
    const response = await fetch(`${API_BASE}/est-auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    return this.handleResponse<AuthResponse>(response);
  }
}

export const m01AuthService = new M01AuthService();

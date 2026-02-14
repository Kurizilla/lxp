import { use_auth_store } from '@/store';
import type { ApiError } from '@/types';

const API_BASE_URL = '/api';

/**
 * Generic API error class
 */
export class ApiException extends Error {
  constructor(
    public status_code: number,
    message: string,
    public error?: string
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

/**
 * Get authorization headers if authenticated
 */
function get_auth_headers(): Record<string, string> {
  const { access_token, token_type } = use_auth_store.getState();
  
  if (access_token && token_type) {
    return {
      Authorization: `${token_type} ${access_token}`,
    };
  }
  
  return {};
}

/**
 * Generic fetch wrapper with error handling
 */
async function api_fetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...get_auth_headers(),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle non-JSON responses
  const content_type = response.headers.get('content-type');
  const is_json = content_type?.includes('application/json');

  if (!response.ok) {
    let error_data: ApiError = { message: 'An error occurred' };
    
    if (is_json) {
      try {
        error_data = await response.json();
      } catch {
        // Use default error
      }
    }

    // Handle 401 - logout user
    if (response.status === 401) {
      use_auth_store.getState().logout();
    }

    throw new ApiException(
      response.status,
      error_data.message || `Request failed with status ${response.status}`,
      error_data.error
    );
  }

  if (is_json) {
    return response.json();
  }

  return {} as T;
}

/**
 * API methods
 */
export const api = {
  get: <T>(endpoint: string) =>
    api_fetch<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown) =>
    api_fetch<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown) =>
    api_fetch<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown) =>
    api_fetch<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    api_fetch<T>(endpoint, { method: 'DELETE' }),
};

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  access_token: string | null;
  token_type: string | null;
  expires_at: number | null;
  is_authenticated: boolean;
  is_loading: boolean;
  error: string | null;
}

interface AuthActions {
  set_auth: (params: {
    user: User;
    access_token: string;
    token_type: string;
    expires_in: number;
  }) => void;
  set_loading: (loading: boolean) => void;
  set_error: (error: string | null) => void;
  logout: () => void;
  clear_error: () => void;
}

type AuthStore = AuthState & AuthActions;

const STORAGE_KEY = 'm01_auth';

export const use_auth_store = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      access_token: null,
      token_type: null,
      expires_at: null,
      is_authenticated: false,
      is_loading: false,
      error: null,

      // Actions
      set_auth: ({ user, access_token, token_type, expires_in }) => {
        const expires_at = Date.now() + expires_in * 1000;
        set({
          user,
          access_token,
          token_type,
          expires_at,
          is_authenticated: true,
          error: null,
        });
      },

      set_loading: (is_loading) => set({ is_loading }),

      set_error: (error) => set({ error, is_loading: false }),

      logout: () =>
        set({
          user: null,
          access_token: null,
          token_type: null,
          expires_at: null,
          is_authenticated: false,
          error: null,
        }),

      clear_error: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        token_type: state.token_type,
        expires_at: state.expires_at,
        is_authenticated: state.is_authenticated,
      }),
    }
  )
);

// Selector hooks for better performance
export const use_auth_user = () => use_auth_store((state) => state.user);
export const use_auth_token = () => use_auth_store((state) => state.access_token);
export const use_is_authenticated = () =>
  use_auth_store((state) => state.is_authenticated);
export const use_auth_loading = () => use_auth_store((state) => state.is_loading);
export const use_auth_error = () => use_auth_store((state) => state.error);

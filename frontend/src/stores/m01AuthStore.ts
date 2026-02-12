import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  UserInfo,
  Institution,
  Classroom,
  SessionInfo,
} from '../types/api.types';

interface AuthState {
  // Auth state
  accessToken: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Selection state
  selectedInstitution: Institution | null;
  selectedClassroom: Classroom | null;
  institutions: Institution[];
  classrooms: Classroom[];

  // Sessions state
  sessions: SessionInfo[];

  // Auth actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserInfo) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  clearError: () => void;

  // Selection actions
  setSelectedInstitution: (institution: Institution | null) => void;
  setSelectedClassroom: (classroom: Classroom | null) => void;
  setInstitutions: (institutions: Institution[]) => void;
  setClassrooms: (classrooms: Classroom[]) => void;

  // Session actions
  setSessions: (sessions: SessionInfo[]) => void;
  removeSession: (sessionId: string) => void;
}

const initialState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  selectedInstitution: null,
  selectedClassroom: null,
  institutions: [],
  classrooms: [],
  sessions: [],
};

export const useM01AuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,

      // Auth actions
      setTokens: (accessToken: string, refreshToken: string) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setUser: (user: UserInfo) =>
        set({
          user,
        }),

      setError: (error: string | null) =>
        set({
          error,
          isLoading: false,
        }),

      setLoading: (isLoading: boolean) =>
        set({
          isLoading,
        }),

      logout: () =>
        set({
          ...initialState,
        }),

      clearError: () =>
        set({
          error: null,
        }),

      // Selection actions
      setSelectedInstitution: (institution: Institution | null) =>
        set({
          selectedInstitution: institution,
          // Clear classroom selection when institution changes
          selectedClassroom: null,
          classrooms: [],
        }),

      setSelectedClassroom: (classroom: Classroom | null) =>
        set({
          selectedClassroom: classroom,
        }),

      setInstitutions: (institutions: Institution[]) =>
        set({
          institutions,
        }),

      setClassrooms: (classrooms: Classroom[]) =>
        set({
          classrooms,
        }),

      // Session actions
      setSessions: (sessions: SessionInfo[]) =>
        set({
          sessions,
        }),

      removeSession: (sessionId: string) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
        })),
    }),
    {
      name: 'm01-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        selectedInstitution: state.selectedInstitution,
        selectedClassroom: state.selectedClassroom,
      }),
    }
  )
);

// Selector hooks for common access patterns
export const useIsAuthenticated = () =>
  useM01AuthStore((state) => state.isAuthenticated);

export const useCurrentUser = () => useM01AuthStore((state) => state.user);

export const useAuthError = () => useM01AuthStore((state) => state.error);

export const useAuthLoading = () => useM01AuthStore((state) => state.isLoading);

export const useSelectedInstitution = () =>
  useM01AuthStore((state) => state.selectedInstitution);

export const useSelectedClassroom = () =>
  useM01AuthStore((state) => state.selectedClassroom);

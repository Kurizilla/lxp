import { create } from 'zustand';
import type {
  Notification,
  Announcement,
  NotificationPreference,
  AssistantMessage,
  PaginatedResponse,
} from '../types/m01-notifications';

const API_BASE = '/api/v1/modules/m01';

interface M01NotificationState {
  // Notifications
  notifications: Notification[];
  notificationsLoading: boolean;
  notificationsError: string | null;
  notificationsPagination: {
    page: number;
    limit: number;
    total: number;
  };
  
  // Announcements
  announcements: Announcement[];
  announcementsLoading: boolean;
  announcementsError: string | null;
  announcementsPagination: {
    page: number;
    limit: number;
    total: number;
  };
  
  // Preferences
  preferences: NotificationPreference | null;
  preferencesLoading: boolean;
  preferencesError: string | null;
  
  // Assistant chat
  assistantMessages: AssistantMessage[];
  assistantLoading: boolean;
  assistantError: string | null;

  // Actions - Notifications
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  getUnreadCount: () => number;
  
  // Actions - Announcements
  fetchAnnouncements: (page?: number, limit?: number) => Promise<void>;
  
  // Actions - Preferences
  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreference>) => Promise<void>;
  
  // Actions - Assistant
  sendAssistantQuery: (query: string, context?: Record<string, unknown>) => Promise<void>;
  clearAssistantMessages: () => void;
}

export const useM01NotificationStore = create<M01NotificationState>((set, get) => ({
  // Initial state - Notifications
  notifications: [],
  notificationsLoading: false,
  notificationsError: null,
  notificationsPagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  
  // Initial state - Announcements
  announcements: [],
  announcementsLoading: false,
  announcementsError: null,
  announcementsPagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  
  // Initial state - Preferences
  preferences: null,
  preferencesLoading: false,
  preferencesError: null,
  
  // Initial state - Assistant
  assistantMessages: [],
  assistantLoading: false,
  assistantError: null,

  // Fetch notifications with polling support
  fetchNotifications: async (page = 1, limit = 10) => {
    set({ notificationsLoading: true, notificationsError: null });
    try {
      const response = await fetch(
        `${API_BASE}/notifications?page=${page}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data: PaginatedResponse<Notification> = await response.json();
      set({
        notifications: data.data,
        notificationsPagination: {
          page: data.page,
          limit: data.limit,
          total: data.total,
        },
        notificationsLoading: false,
      });
    } catch (error) {
      set({
        notificationsError: error instanceof Error ? error.message : 'Unknown error',
        notificationsLoading: false,
      });
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/notifications/${notificationId}/read`,
        { method: 'PATCH' }
      );
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        ),
      }));
    } catch (error) {
      set({
        notificationsError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Mark notification as unread
  markAsUnread: async (notificationId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/notifications/${notificationId}/unread`,
        { method: 'PATCH' }
      );
      if (!response.ok) {
        throw new Error('Failed to mark notification as unread');
      }
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: false, readAt: null } : n
        ),
      }));
    } catch (error) {
      set({
        notificationsError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Get unread count
  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.isRead).length;
  },

  // Fetch announcements
  fetchAnnouncements: async (page = 1, limit = 10) => {
    set({ announcementsLoading: true, announcementsError: null });
    try {
      const response = await fetch(
        `${API_BASE}/announcements?page=${page}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      const data: PaginatedResponse<Announcement> = await response.json();
      set({
        announcements: data.data,
        announcementsPagination: {
          page: data.page,
          limit: data.limit,
          total: data.total,
        },
        announcementsLoading: false,
      });
    } catch (error) {
      set({
        announcementsError: error instanceof Error ? error.message : 'Unknown error',
        announcementsLoading: false,
      });
    }
  },

  // Fetch preferences
  fetchPreferences: async () => {
    set({ preferencesLoading: true, preferencesError: null });
    try {
      const response = await fetch(`${API_BASE}/notification-preferences`);
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      const data: NotificationPreference = await response.json();
      set({ preferences: data, preferencesLoading: false });
    } catch (error) {
      set({
        preferencesError: error instanceof Error ? error.message : 'Unknown error',
        preferencesLoading: false,
      });
    }
  },

  // Update preferences
  updatePreferences: async (prefs: Partial<NotificationPreference>) => {
    set({ preferencesLoading: true, preferencesError: null });
    try {
      const response = await fetch(`${API_BASE}/notification-preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      const data: NotificationPreference = await response.json();
      set({ preferences: data, preferencesLoading: false });
    } catch (error) {
      set({
        preferencesError: error instanceof Error ? error.message : 'Unknown error',
        preferencesLoading: false,
      });
    }
  },

  // Send assistant query
  sendAssistantQuery: async (query: string, context?: Record<string, unknown>) => {
    const userMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    
    set((state) => ({
      assistantMessages: [...state.assistantMessages, userMessage],
      assistantLoading: true,
      assistantError: null,
    }));

    try {
      const response = await fetch(`${API_BASE}/tutor-assistant/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get assistant response');
      }
      
      const data = await response.json();
      const assistantMessage: AssistantMessage = {
        id: data.id || crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp || new Date().toISOString(),
      };
      
      set((state) => ({
        assistantMessages: [...state.assistantMessages, assistantMessage],
        assistantLoading: false,
      }));
    } catch (error) {
      set({
        assistantError: error instanceof Error ? error.message : 'Unknown error',
        assistantLoading: false,
      });
    }
  },

  // Clear assistant messages
  clearAssistantMessages: () => {
    set({ assistantMessages: [], assistantError: null });
  },
}));

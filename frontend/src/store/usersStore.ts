import { create } from 'zustand';
import { User, PaginationParams, CreateUserDto, UpdateUserDto } from '../types/api';
import apiService from '../services/api';

interface UsersState {
  users: User[];
  total: number;
  page: number;
  limit: number;
  search: string;
  isLoading: boolean;
  error: string | null;
  selectedUser: User | null;
  isModalOpen: boolean;
  modalMode: 'create' | 'edit';
  
  // Actions
  fetchUsers: (params?: Partial<PaginationParams>) => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  createUser: (data: CreateUserDto) => Promise<void>;
  updateUser: (id: string, data: UpdateUserDto) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  openModal: (mode: 'create' | 'edit', user?: User) => void;
  closeModal: () => void;
  clearError: () => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  total: 0,
  page: 1,
  limit: 10,
  search: '',
  isLoading: false,
  error: null,
  selectedUser: null,
  isModalOpen: false,
  modalMode: 'create',

  fetchUsers: async (params) => {
    const { page, limit, search } = get();
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getUsers({
        page: params?.page ?? page,
        limit: params?.limit ?? limit,
        search: params?.search ?? search,
      });
      
      set({
        users: response.data,
        total: response.total,
        page: response.page,
        limit: response.limit,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      });
    }
  },

  setPage: (page) => {
    set({ page });
    get().fetchUsers({ page });
  },

  setLimit: (limit) => {
    set({ limit, page: 1 });
    get().fetchUsers({ limit, page: 1 });
  },

  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchUsers({ search, page: 1 });
  },

  createUser: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.createUser(data);
      set({ isModalOpen: false, selectedUser: null });
      await get().fetchUsers();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      });
      throw error;
    }
  },

  updateUser: async (id, data) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.updateUser(id, data);
      set({ isModalOpen: false, selectedUser: null });
      await get().fetchUsers();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.deleteUser(id);
      await get().fetchUsers();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      });
      throw error;
    }
  },

  openModal: (mode, user) => {
    set({
      isModalOpen: true,
      modalMode: mode,
      selectedUser: user ?? null,
    });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      selectedUser: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));

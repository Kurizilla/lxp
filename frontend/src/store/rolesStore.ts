import { create } from 'zustand';
import { Role, PaginationParams, CreateRoleDto, UpdateRoleDto } from '../types/api';
import apiService from '../services/api';

interface RolesState {
  roles: Role[];
  allRoles: Role[];
  total: number;
  page: number;
  limit: number;
  search: string;
  isLoading: boolean;
  error: string | null;
  selectedRole: Role | null;
  isModalOpen: boolean;
  modalMode: 'create' | 'edit';
  
  // Actions
  fetchRoles: (params?: Partial<PaginationParams>) => Promise<void>;
  fetchAllRoles: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  createRole: (data: CreateRoleDto) => Promise<void>;
  updateRole: (id: string, data: UpdateRoleDto) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  openModal: (mode: 'create' | 'edit', role?: Role) => void;
  closeModal: () => void;
  clearError: () => void;
}

export const useRolesStore = create<RolesState>((set, get) => ({
  roles: [],
  allRoles: [],
  total: 0,
  page: 1,
  limit: 10,
  search: '',
  isLoading: false,
  error: null,
  selectedRole: null,
  isModalOpen: false,
  modalMode: 'create',

  fetchRoles: async (params) => {
    const { page, limit, search } = get();
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getRoles({
        page: params?.page ?? page,
        limit: params?.limit ?? limit,
        search: params?.search ?? search,
      });
      
      set({
        roles: response.data,
        total: response.total,
        page: response.page,
        limit: response.limit,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch roles',
      });
    }
  },

  fetchAllRoles: async () => {
    try {
      const roles = await apiService.getAllRoles();
      set({ allRoles: roles });
    } catch (error) {
      console.error('Failed to fetch all roles:', error);
    }
  },

  setPage: (page) => {
    set({ page });
    get().fetchRoles({ page });
  },

  setLimit: (limit) => {
    set({ limit, page: 1 });
    get().fetchRoles({ limit, page: 1 });
  },

  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchRoles({ search, page: 1 });
  },

  createRole: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.createRole(data);
      set({ isModalOpen: false, selectedRole: null });
      await get().fetchRoles();
      await get().fetchAllRoles();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create role',
      });
      throw error;
    }
  },

  updateRole: async (id, data) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.updateRole(id, data);
      set({ isModalOpen: false, selectedRole: null });
      await get().fetchRoles();
      await get().fetchAllRoles();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update role',
      });
      throw error;
    }
  },

  deleteRole: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.deleteRole(id);
      await get().fetchRoles();
      await get().fetchAllRoles();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete role',
      });
      throw error;
    }
  },

  openModal: (mode, role) => {
    set({
      isModalOpen: true,
      modalMode: mode,
      selectedRole: role ?? null,
    });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      selectedRole: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));

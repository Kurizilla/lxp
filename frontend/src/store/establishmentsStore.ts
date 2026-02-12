import { create } from 'zustand';
import { Establishment, PaginationParams, CreateEstablishmentDto, UpdateEstablishmentDto } from '../types/api';
import apiService from '../services/api';

interface EstablishmentsState {
  establishments: Establishment[];
  allEstablishments: Establishment[];
  total: number;
  page: number;
  limit: number;
  search: string;
  isLoading: boolean;
  error: string | null;
  selectedEstablishment: Establishment | null;
  isModalOpen: boolean;
  modalMode: 'create' | 'edit';
  
  // Actions
  fetchEstablishments: (params?: Partial<PaginationParams>) => Promise<void>;
  fetchAllEstablishments: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  createEstablishment: (data: CreateEstablishmentDto) => Promise<void>;
  updateEstablishment: (id: string, data: UpdateEstablishmentDto) => Promise<void>;
  deleteEstablishment: (id: string) => Promise<void>;
  openModal: (mode: 'create' | 'edit', establishment?: Establishment) => void;
  closeModal: () => void;
  clearError: () => void;
}

export const useEstablishmentsStore = create<EstablishmentsState>((set, get) => ({
  establishments: [],
  allEstablishments: [],
  total: 0,
  page: 1,
  limit: 10,
  search: '',
  isLoading: false,
  error: null,
  selectedEstablishment: null,
  isModalOpen: false,
  modalMode: 'create',

  fetchEstablishments: async (params) => {
    const { page, limit, search } = get();
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getEstablishments({
        page: params?.page ?? page,
        limit: params?.limit ?? limit,
        search: params?.search ?? search,
      });
      
      set({
        establishments: response.data,
        total: response.total,
        page: response.page,
        limit: response.limit,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch establishments',
      });
    }
  },

  fetchAllEstablishments: async () => {
    try {
      const establishments = await apiService.getAllEstablishments();
      set({ allEstablishments: establishments });
    } catch (error) {
      console.error('Failed to fetch all establishments:', error);
    }
  },

  setPage: (page) => {
    set({ page });
    get().fetchEstablishments({ page });
  },

  setLimit: (limit) => {
    set({ limit, page: 1 });
    get().fetchEstablishments({ limit, page: 1 });
  },

  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchEstablishments({ search, page: 1 });
  },

  createEstablishment: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.createEstablishment(data);
      set({ isModalOpen: false, selectedEstablishment: null });
      await get().fetchEstablishments();
      await get().fetchAllEstablishments();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create establishment',
      });
      throw error;
    }
  },

  updateEstablishment: async (id, data) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.updateEstablishment(id, data);
      set({ isModalOpen: false, selectedEstablishment: null });
      await get().fetchEstablishments();
      await get().fetchAllEstablishments();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update establishment',
      });
      throw error;
    }
  },

  deleteEstablishment: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.deleteEstablishment(id);
      await get().fetchEstablishments();
      await get().fetchAllEstablishments();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete establishment',
      });
      throw error;
    }
  },

  openModal: (mode, establishment) => {
    set({
      isModalOpen: true,
      modalMode: mode,
      selectedEstablishment: establishment ?? null,
    });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      selectedEstablishment: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));

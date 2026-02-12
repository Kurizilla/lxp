import { create } from 'zustand';
import { Classroom, PaginationParams, CreateClassroomDto, UpdateClassroomDto } from '../types/api';
import apiService from '../services/api';

interface ClassroomsState {
  classrooms: Classroom[];
  total: number;
  page: number;
  limit: number;
  search: string;
  isLoading: boolean;
  error: string | null;
  selectedClassroom: Classroom | null;
  isModalOpen: boolean;
  modalMode: 'create' | 'edit';
  
  // Actions
  fetchClassrooms: (params?: Partial<PaginationParams>) => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  createClassroom: (data: CreateClassroomDto) => Promise<void>;
  updateClassroom: (id: string, data: UpdateClassroomDto) => Promise<void>;
  deleteClassroom: (id: string) => Promise<void>;
  openModal: (mode: 'create' | 'edit', classroom?: Classroom) => void;
  closeModal: () => void;
  clearError: () => void;
}

export const useClassroomsStore = create<ClassroomsState>((set, get) => ({
  classrooms: [],
  total: 0,
  page: 1,
  limit: 10,
  search: '',
  isLoading: false,
  error: null,
  selectedClassroom: null,
  isModalOpen: false,
  modalMode: 'create',

  fetchClassrooms: async (params) => {
    const { page, limit, search } = get();
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getClassrooms({
        page: params?.page ?? page,
        limit: params?.limit ?? limit,
        search: params?.search ?? search,
      });
      
      set({
        classrooms: response.data,
        total: response.total,
        page: response.page,
        limit: response.limit,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch classrooms',
      });
    }
  },

  setPage: (page) => {
    set({ page });
    get().fetchClassrooms({ page });
  },

  setLimit: (limit) => {
    set({ limit, page: 1 });
    get().fetchClassrooms({ limit, page: 1 });
  },

  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchClassrooms({ search, page: 1 });
  },

  createClassroom: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.createClassroom(data);
      set({ isModalOpen: false, selectedClassroom: null });
      await get().fetchClassrooms();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create classroom',
      });
      throw error;
    }
  },

  updateClassroom: async (id, data) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.updateClassroom(id, data);
      set({ isModalOpen: false, selectedClassroom: null });
      await get().fetchClassrooms();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update classroom',
      });
      throw error;
    }
  },

  deleteClassroom: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.deleteClassroom(id);
      await get().fetchClassrooms();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete classroom',
      });
      throw error;
    }
  },

  openModal: (mode, classroom) => {
    set({
      isModalOpen: true,
      modalMode: mode,
      selectedClassroom: classroom ?? null,
    });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      selectedClassroom: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));

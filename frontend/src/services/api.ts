import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  PaginatedResponse,
  PaginationParams,
  ApiError,
  User,
  CreateUserDto,
  UpdateUserDto,
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  Establishment,
  CreateEstablishmentDto,
  UpdateEstablishmentDto,
  Classroom,
  CreateClassroomDto,
  UpdateClassroomDto,
} from '../types/api';

// API base URL following foundation pattern /api/v1/
const API_BASE_URL = '/api/v1/modules/m01';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw error;
      }
    );
  }

  private buildQueryString(params: PaginationParams): string {
    const query = new URLSearchParams();
    query.append('page', params.page.toString());
    query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    return query.toString();
  }

  // Users API
  async getUsers(params: PaginationParams): Promise<PaginatedResponse<User>> {
    const response = await this.client.get<PaginatedResponse<User>>(
      `/users?${this.buildQueryString(params)}`
    );
    return response.data;
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.client.get<User>(`/users/${id}`);
    return response.data;
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const response = await this.client.post<User>('/users', data);
    return response.data;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const response = await this.client.patch<User>(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  // Roles API
  async getRoles(params: PaginationParams): Promise<PaginatedResponse<Role>> {
    const response = await this.client.get<PaginatedResponse<Role>>(
      `/roles?${this.buildQueryString(params)}`
    );
    return response.data;
  }

  async getRoleById(id: string): Promise<Role> {
    const response = await this.client.get<Role>(`/roles/${id}`);
    return response.data;
  }

  async createRole(data: CreateRoleDto): Promise<Role> {
    const response = await this.client.post<Role>('/roles', data);
    return response.data;
  }

  async updateRole(id: string, data: UpdateRoleDto): Promise<Role> {
    const response = await this.client.patch<Role>(`/roles/${id}`, data);
    return response.data;
  }

  async deleteRole(id: string): Promise<void> {
    await this.client.delete(`/roles/${id}`);
  }

  async getAllRoles(): Promise<Role[]> {
    const response = await this.client.get<PaginatedResponse<Role>>(
      '/roles?page=1&limit=100'
    );
    return response.data.data;
  }

  // Establishments API
  async getEstablishments(params: PaginationParams): Promise<PaginatedResponse<Establishment>> {
    const response = await this.client.get<PaginatedResponse<Establishment>>(
      `/establishments?${this.buildQueryString(params)}`
    );
    return response.data;
  }

  async getEstablishmentById(id: string): Promise<Establishment> {
    const response = await this.client.get<Establishment>(`/establishments/${id}`);
    return response.data;
  }

  async createEstablishment(data: CreateEstablishmentDto): Promise<Establishment> {
    const response = await this.client.post<Establishment>('/establishments', data);
    return response.data;
  }

  async updateEstablishment(id: string, data: UpdateEstablishmentDto): Promise<Establishment> {
    const response = await this.client.patch<Establishment>(`/establishments/${id}`, data);
    return response.data;
  }

  async deleteEstablishment(id: string): Promise<void> {
    await this.client.delete(`/establishments/${id}`);
  }

  async getAllEstablishments(): Promise<Establishment[]> {
    const response = await this.client.get<PaginatedResponse<Establishment>>(
      '/establishments?page=1&limit=100'
    );
    return response.data.data;
  }

  // Classrooms API
  async getClassrooms(params: PaginationParams): Promise<PaginatedResponse<Classroom>> {
    const response = await this.client.get<PaginatedResponse<Classroom>>(
      `/classrooms?${this.buildQueryString(params)}`
    );
    return response.data;
  }

  async getClassroomById(id: string): Promise<Classroom> {
    const response = await this.client.get<Classroom>(`/classrooms/${id}`);
    return response.data;
  }

  async createClassroom(data: CreateClassroomDto): Promise<Classroom> {
    const response = await this.client.post<Classroom>('/classrooms', data);
    return response.data;
  }

  async updateClassroom(id: string, data: UpdateClassroomDto): Promise<Classroom> {
    const response = await this.client.patch<Classroom>(`/classrooms/${id}`, data);
    return response.data;
  }

  async deleteClassroom(id: string): Promise<void> {
    await this.client.delete(`/classrooms/${id}`);
  }
}

export const apiService = new ApiService();
export default apiService;

import { ApiResponse, User, PaginatedResponse } from '@/types';
import { apiService } from './api';

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export class UserService {
  async getUsers(
    page: number = 1, 
    limit: number = 10, 
    filters: { search?: string; role?: string; isActive?: string } = {}
  ): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.isActive) params.append('isActive', filters.isActive);
    
    return apiService.get<User[]>(`/users?${params.toString()}`);
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return apiService.get<User>(`/users/${id}`);
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiService.post<User>('/users', userData);
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiService.put<User>(`/users/${id}`, userData);
  }

  async deleteUser(id: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/users/${id}`);
  }

  async toggleUserStatus(id: string): Promise<ApiResponse<User>> {
    return apiService.patch<User>(`/users/${id}/toggle-status`);
  }
}

export const userService = new UserService();
export default userService;
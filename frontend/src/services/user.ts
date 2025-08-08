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
  async getUsers(page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> {
    return apiService.get<User[]>(`/users?page=${page}&limit=${limit}`);
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
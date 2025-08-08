import { ApiResponse, User, LoginForm, RegisterForm } from '@/types';
import { apiService } from './api';

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RegisterResponse extends AuthResponse {
  emailVerificationToken: string;
}

export class AuthService {
  async login(credentials: LoginForm): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      apiService.setAuthToken(response.data.accessToken);
    }
    
    return response;
  }

  async register(userData: RegisterForm): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiService.post<RegisterResponse>('/auth/register', userData);
    
    if (response.success && response.data) {
      apiService.setAuthToken(response.data.accessToken);
    }
    
    return response;
  }

  async logout(): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.post('/auth/logout');
      apiService.clearAuthToken();
      return response;
    } catch (error) {
      // Clear token even if logout fails
      apiService.clearAuthToken();
      throw error;
    }
  }

  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>('/auth/refresh-token');
    
    if (response.success && response.data) {
      apiService.setAuthToken(response.data.accessToken);
    }
    
    return response;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return apiService.get<User>('/auth/profile');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiService.put<User>('/auth/profile', data);
  }

  async forgotPassword(email: string): Promise<ApiResponse<{ resetToken?: string }>> {
    return apiService.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<any>> {
    return apiService.post('/auth/reset-password', { token, password });
  }

  async verifyEmail(token: string): Promise<ApiResponse<any>> {
    return apiService.post('/auth/verify-email', { token });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  // Get stored access token
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Clear all auth data
  clearAuth(): void {
    apiService.clearAuthToken();
  }
}

export const authService = new AuthService();
export default authService;
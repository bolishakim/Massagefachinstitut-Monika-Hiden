import { ApiResponse, User, LoginForm, RegisterForm } from '@/types';
import { apiService } from './api';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse extends AuthResponse {
  emailVerificationToken: string;
}

export class AuthService {
  private lastLogTime = 0;
  private lastWarningTime = 0;
  
  async login(credentials: LoginForm): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      apiService.setAuthToken(response.data.accessToken);
      // Store refresh token for automatic token refresh
      localStorage.setItem('refreshToken', response.data.refreshToken);
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
      // Clear all auth data
      this.clearAuth();
      return response;
    } catch (error) {
      // Clear token even if logout fails
      this.clearAuth();
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

  // Check if user is authenticated with valid token
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return false;
    }
    
    try {
      // Basic JWT structure validation (header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }
      
      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const nowSeconds = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - nowSeconds;
      const isValid = payload.exp && payload.exp > nowSeconds; // No buffer, let API interceptor handle refresh
      
      // Only log when token is getting close to expiry AND we haven't logged recently
      const nowMs = Date.now();
      if (timeUntilExpiry <= 300 && timeUntilExpiry > 0 && (nowMs - this.lastLogTime) > 60000) { // Only log when less than 5 minutes remaining AND last log was >1 minute ago
        console.log('🔐 Token status:', {
          timeUntilExpiry: Math.round(timeUntilExpiry / 60 * 100) / 100 + ' minutes',
          isValid: isValid,
          expiresAt: new Date(payload.exp * 1000).toLocaleString()
        });
        this.lastLogTime = nowMs;
      }
      
      // Only warn once when token FIRST expires (not repeatedly)
      if (!isValid && timeUntilExpiry <= 0 && (nowMs - this.lastWarningTime) > 300000) { // Only warn once every 5 minutes when expired
        console.warn('⚠️ Token has expired, considering invalid');
        this.lastWarningTime = nowMs;
      }
      
      return isValid;
    } catch (error) {
      // Only log token validation errors once every 5 minutes
      const nowMs = Date.now();
      if ((nowMs - this.lastWarningTime) > 300000) {
        console.error('🔐 Token validation error:', error);
        this.lastWarningTime = nowMs;
      }
      return false;
    }
  }

  // Get stored access token
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Clear all auth data
  clearAuth(): void {
    apiService.clearAuthToken();
    localStorage.removeItem('refreshToken');
  }
}

export const authService = new AuthService();
export default authService;
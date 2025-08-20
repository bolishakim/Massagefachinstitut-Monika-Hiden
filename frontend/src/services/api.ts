import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';

class ApiService {
  private api: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3050/api',
      withCredentials: true,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle network errors
        if (error.code === 'ECONNABORTED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          console.error('Network connectivity issue:', error.message);
          throw {
            success: false,
            error: 'Network connection failed. Please check your internet connection and try again.',
          };
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Don't try to refresh tokens for auth endpoints
          const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email'];
          if (authEndpoints.some(endpoint => originalRequest.url?.includes(endpoint))) {
            console.log('🔐 401 error on auth endpoint, not attempting token refresh');
            return Promise.reject(error);
          }

          console.log('🔄 401 error detected, attempting token refresh for:', originalRequest.url);

          try {
            // If there's already a refresh in progress, wait for it
            if (this.refreshTokenPromise) {
              console.log('⏳ Token refresh already in progress, waiting...');
              const newToken = await this.refreshTokenPromise;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              console.log('✅ Used existing refresh, retrying original request');
              return this.api(originalRequest);
            }

            // Start a new refresh
            console.log('🚀 Starting new token refresh...');
            this.refreshTokenPromise = this.refreshAccessToken();
            const newToken = await this.refreshTokenPromise;
            this.refreshTokenPromise = null;

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            console.log('✅ Token refreshed successfully, retrying original request');
            return this.api(originalRequest);
          } catch (refreshError: any) {
            this.refreshTokenPromise = null;
            console.error('❌ Token refresh failed:', refreshError);
            console.error('🔄 Refresh token error details:', {
              message: refreshError.message,
              response: refreshError.response?.data,
              status: refreshError.response?.status
            });
            
            // Clear auth and notify user about logout
            this.clearAuthToken();
            console.log('🚪 Logging out user due to refresh failure');
            
            // Dispatch a custom event to notify the auth system
            window.dispatchEvent(new CustomEvent('auth:logout', { 
              detail: { reason: 'TOKEN_REFRESH_FAILED', error: refreshError } 
            }));
            
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error('❌ No refresh token available in localStorage');
      throw new Error('No refresh token available');
    }

    console.log('🔑 Attempting to refresh access token...');

    try {
      // Send refresh token in request body instead of relying on cookies
      const response = await this.api.post('/auth/refresh-token', { refreshToken });
      
      console.log('📡 Refresh token API response received:', {
        success: response.data.success,
        hasAccessToken: !!response.data.data?.accessToken,
        hasRefreshToken: !!response.data.data?.refreshToken
      });

      const newToken = response.data.data.accessToken;
      const newRefreshToken = response.data.data.refreshToken;
      
      if (!newToken || !newRefreshToken) {
        console.error('❌ Invalid refresh response - missing tokens:', response.data);
        throw new Error('Invalid refresh token response');
      }
      
      localStorage.setItem('accessToken', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      console.log('✅ Access token refreshed successfully');
      return newToken;
    } catch (error: any) {
      console.error('❌ Refresh token request failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        refreshTokenExists: !!refreshToken
      });
      throw error;
    }
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.request(config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, ...config });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }

  // Set auth token
  setAuthToken(token: string | null) {
    if (token) {
      localStorage.setItem('accessToken', token);
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('accessToken');
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Clear auth token
  clearAuthToken() {
    this.setAuthToken(null);
    localStorage.removeItem('refreshToken'); // Also clear refresh token
  }
}

export const apiService = new ApiService();
export default apiService;
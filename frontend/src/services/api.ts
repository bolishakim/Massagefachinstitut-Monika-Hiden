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
            return Promise.reject(error);
          }

          try {
            // If there's already a refresh in progress, wait for it
            if (this.refreshTokenPromise) {
              const newToken = await this.refreshTokenPromise;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }

            // Start a new refresh
            this.refreshTokenPromise = this.refreshAccessToken();
            const newToken = await this.refreshTokenPromise;
            this.refreshTokenPromise = null;

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.refreshTokenPromise = null;
            this.clearAuthToken();
            console.error('Token refresh failed:', refreshError);
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
      throw new Error('No refresh token available');
    }

    // Send refresh token in request body instead of relying on cookies
    const response = await this.api.post('/auth/refresh-token', { refreshToken });
    const newToken = response.data.data.accessToken;
    const newRefreshToken = response.data.data.refreshToken;
    
    localStorage.setItem('accessToken', newToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    return newToken;
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
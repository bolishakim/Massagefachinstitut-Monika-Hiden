import { ServicePackage, PackageForm, PaginatedResponse, ApiResponse, PackagePayment } from '@/types';
import { apiService } from './api';

export const packageService = {
  // Get all packages with pagination and filters
  async getAllPackages(
    page: number = 1,
    limit: number = 20,
    search?: string,
    filters?: {
      patientId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ApiResponse<PaginatedResponse<ServicePackage>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
    }

    return apiService.get<PaginatedResponse<ServicePackage>>(`/packages?${params}`);
  },

  // Get single package by ID
  async getPackageById(id: string): Promise<ApiResponse<ServicePackage>> {
    return apiService.get<ServicePackage>(`/packages/${id}`);
  },

  // Create new package(s) - now returns array of packages
  async createPackage(packageData: PackageForm): Promise<ApiResponse<ServicePackage[]>> {
    return apiService.post<ServicePackage[]>('/packages', packageData);
  },

  // Update package
  async updatePackage(
    id: string, 
    updateData: Partial<Pick<ServicePackage, 'name' | 'totalPrice' | 'discountAmount' | 'finalPrice' | 'status'>>
  ): Promise<ApiResponse<ServicePackage>> {
    return apiService.put<ServicePackage>(`/packages/${id}`, updateData);
  },

  // Cancel package
  async cancelPackage(id: string): Promise<ApiResponse<ServicePackage>> {
    return apiService.patch<ServicePackage>(`/packages/${id}/cancel`);
  },

  // Add payment to package
  async addPayment(
    packageId: string,
    paymentData: {
      amount: number;
      paymentMethod: string;
      paidSessionsCount?: number;
      notes?: string;
    }
  ): Promise<ApiResponse<PackagePayment>> {
    return apiService.post<PackagePayment>(`/packages/${packageId}/payments`, paymentData);
  },

  // Get package statistics
  async getPackageStats(): Promise<ApiResponse<{
    totalPackages: number;
    activePackages: number;
    completedPackages: number;
    cancelledPackages: number;
    totalRevenue: number;
    thisMonthRevenue: number;
  }>> {
    return apiService.get('/packages/stats');
  },
};
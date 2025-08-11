import { apiService } from './api';
import { ApiResponse, PaginatedResponse } from '@/types';

export enum ServiceCategory {
  MASSAGE = 'MASSAGE',
  PHYSIOTHERAPY = 'PHYSIOTHERAPY',
  INFRARED_CHAIR = 'INFRARED_CHAIR',
  TRAINING = 'TRAINING',
  HEILMASSAGE = 'HEILMASSAGE',
  COMBINATION = 'COMBINATION',
  VOUCHER = 'VOUCHER'
}

export interface Service {
  id: string;
  name: string;
  nameGerman?: string;
  description?: string;
  duration: number;
  price: number;
  category: ServiceCategory;
  categoryColor: string;
  isForChildren: boolean;
  isVoucher: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  modifiedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ServiceFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: ServiceCategory | 'all';
  isActive?: 'true' | 'false' | 'all';
  isForChildren?: 'true' | 'false' | 'all';
  isVoucher?: 'true' | 'false' | 'all';
  sortBy?: 'name' | 'createdAt' | 'price' | 'duration' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateServiceData {
  name: string;
  nameGerman?: string;
  description?: string;
  duration: number;
  price: number;
  category: ServiceCategory;
  categoryColor?: string;
  isForChildren?: boolean;
  isVoucher?: boolean;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {}

export interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  categories: number;
  categoryBreakdown: { category: ServiceCategory; _count: { category: number } }[];
  mostBooked: {
    serviceId: string;
    serviceName?: string;
    servicePrice?: number;
    _count: { serviceId: number };
  }[];
}

class ServicesService {
  // Get all services with pagination and filters
  async getAllServices(filters: ServiceFilters = {}): Promise<ApiResponse<PaginatedResponse<Service>>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.isActive) params.append('isActive', filters.isActive);
      if (filters.isForChildren && filters.isForChildren !== 'all') params.append('isForChildren', filters.isForChildren);
      if (filters.isVoucher && filters.isVoucher !== 'all') params.append('isVoucher', filters.isVoucher);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const queryString = params.toString();
      const url = queryString ? `/services?${queryString}` : '/services';
      
      const result = await apiService.get<PaginatedResponse<Service>>(url);
      return result;
    } catch (error: any) {
      console.error('Error fetching services:', error);
      return {
        success: false,
        error: error.error || 'Failed to fetch services',
      };
    }
  }

  // Get service by ID
  async getServiceById(id: string): Promise<ApiResponse<Service>> {
    try {
      const result = await apiService.get<Service>(`/services/${id}`);
      return result;
    } catch (error: any) {
      console.error('Error fetching service:', error);
      return {
        success: false,
        error: error.error || 'Failed to fetch service',
      };
    }
  }

  // Create new service
  async createService(data: CreateServiceData): Promise<ApiResponse<Service>> {
    try {
      const result = await apiService.post<Service>('/services', data);
      return result;
    } catch (error: any) {
      console.error('Error creating service:', error);
      return {
        success: false,
        error: error.error || 'Failed to create service',
      };
    }
  }

  // Update service
  async updateService(id: string, data: UpdateServiceData): Promise<ApiResponse<Service>> {
    try {
      const result = await apiService.put<Service>(`/services/${id}`, data);
      return result;
    } catch (error: any) {
      console.error('Error updating service:', error);
      return {
        success: false,
        error: error.error || 'Failed to update service',
      };
    }
  }

  // Delete service (soft delete)
  async deleteService(id: string): Promise<ApiResponse<void>> {
    try {
      const result = await apiService.delete<void>(`/services/${id}`);
      return result;
    } catch (error: any) {
      console.error('Error deleting service:', error);
      return {
        success: false,
        error: error.error || 'Failed to delete service',
      };
    }
  }

  // Bulk delete services
  async bulkDeleteServices(serviceIds: string[]): Promise<ApiResponse<{ deletedCount: number }>> {
    try {
      const result = await apiService.post<{ deletedCount: number }>('/services/bulk-delete', {
        serviceIds,
      });
      return result;
    } catch (error: any) {
      console.error('Error bulk deleting services:', error);
      return {
        success: false,
        error: error.error || 'Failed to delete services',
      };
    }
  }

  // Reactivate service
  async reactivateService(id: string): Promise<ApiResponse<Service>> {
    try {
      const result = await apiService.post<Service>(`/services/${id}/reactivate`);
      return result;
    } catch (error: any) {
      console.error('Error reactivating service:', error);
      return {
        success: false,
        error: error.error || 'Failed to reactivate service',
      };
    }
  }

  // Search services
  async searchServices(query: string): Promise<ApiResponse<Service[]>> {
    try {
      const result = await apiService.get<Service[]>(`/services/search?q=${encodeURIComponent(query)}`);
      return result;
    } catch (error: any) {
      console.error('Error searching services:', error);
      return {
        success: false,
        error: error.error || 'Failed to search services',
      };
    }
  }

  // Get service statistics
  async getServiceStats(): Promise<ApiResponse<ServiceStats>> {
    try {
      const result = await apiService.get<ServiceStats>('/services/stats');
      return result;
    } catch (error: any) {
      console.error('Error fetching service stats:', error);
      return {
        success: false,
        error: error.error || 'Failed to fetch service statistics',
      };
    }
  }
}

export const servicesService = new ServicesService();
export default servicesService;
import { apiService } from './api';
import { ApiResponse, PaginatedResponse } from '@/types';

export interface Room {
  id: string;
  name: string;
  description?: string;
  features: string[];
  capacity: number;
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

export interface RoomFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: 'true' | 'false' | 'all';
  capacity?: number;
  minCapacity?: number;
  maxCapacity?: number;
  sortBy?: 'name' | 'createdAt' | 'capacity' | 'features';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateRoomData {
  name: string;
  description?: string;
  features?: string[];
  capacity?: number;
}

export interface UpdateRoomData extends Partial<CreateRoomData> {}

export interface RoomStats {
  total: number;
  active: number;
  inactive: number;
  totalCapacity: number;
  mostUsed: {
    roomId: string;
    roomName?: string;
    roomCapacity?: number;
    _count: { roomId: number };
  }[];
}

export interface RoomAvailability {
  id: string;
  name: string;
  description?: string;
  features: string[];
  capacity: number;
  appointments: {
    id: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    service: {
      name: string;
      duration: number;
    };
    patient: {
      firstName: string;
      lastName: string;
    };
  }[];
}

class RoomsService {
  // Get all rooms with pagination and filters
  async getAllRooms(filters: RoomFilters = {}): Promise<ApiResponse<PaginatedResponse<Room>>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.isActive) params.append('isActive', filters.isActive);
      if (filters.capacity) params.append('capacity', filters.capacity.toString());
      if (filters.minCapacity) params.append('minCapacity', filters.minCapacity.toString());
      if (filters.maxCapacity) params.append('maxCapacity', filters.maxCapacity.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const queryString = params.toString();
      const url = queryString ? `/rooms?${queryString}` : '/rooms';
      
      const result = await apiService.get<PaginatedResponse<Room>>(url);
      return result;
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      return {
        success: false,
        error: error.error || 'Failed to fetch rooms',
      };
    }
  }

  // Get room by ID
  async getRoomById(id: string): Promise<ApiResponse<Room>> {
    try {
      const result = await apiService.get<Room>(`/rooms/${id}`);
      return result;
    } catch (error: any) {
      console.error('Error fetching room:', error);
      return {
        success: false,
        error: error.error || 'Failed to fetch room',
      };
    }
  }

  // Create new room
  async createRoom(data: CreateRoomData): Promise<ApiResponse<Room>> {
    try {
      const result = await apiService.post<Room>('/rooms', data);
      return result;
    } catch (error: any) {
      console.error('Error creating room:', error);
      return {
        success: false,
        error: error.error || 'Failed to create room',
      };
    }
  }

  // Update room
  async updateRoom(id: string, data: UpdateRoomData): Promise<ApiResponse<Room>> {
    try {
      const result = await apiService.put<Room>(`/rooms/${id}`, data);
      return result;
    } catch (error: any) {
      console.error('Error updating room:', error);
      return {
        success: false,
        error: error.error || 'Failed to update room',
      };
    }
  }

  // Delete room (soft delete)
  async deleteRoom(id: string): Promise<ApiResponse<void>> {
    try {
      const result = await apiService.delete<void>(`/rooms/${id}`);
      return result;
    } catch (error: any) {
      console.error('Error deleting room:', error);
      return {
        success: false,
        error: error.error || 'Failed to delete room',
      };
    }
  }

  // Bulk delete rooms
  async bulkDeleteRooms(roomIds: string[]): Promise<ApiResponse<{ deletedCount: number }>> {
    try {
      const result = await apiService.post<{ deletedCount: number }>('/rooms/bulk-delete', {
        roomIds,
      });
      return result;
    } catch (error: any) {
      console.error('Error bulk deleting rooms:', error);
      return {
        success: false,
        error: error.error || 'Failed to delete rooms',
      };
    }
  }

  // Reactivate room
  async reactivateRoom(id: string): Promise<ApiResponse<Room>> {
    try {
      const result = await apiService.post<Room>(`/rooms/${id}/reactivate`);
      return result;
    } catch (error: any) {
      console.error('Error reactivating room:', error);
      return {
        success: false,
        error: error.error || 'Failed to reactivate room',
      };
    }
  }

  // Search rooms
  async searchRooms(query: string): Promise<ApiResponse<Room[]>> {
    try {
      const result = await apiService.get<Room[]>(`/rooms/search?q=${encodeURIComponent(query)}`);
      return result;
    } catch (error: any) {
      console.error('Error searching rooms:', error);
      return {
        success: false,
        error: error.error || 'Failed to search rooms',
      };
    }
  }

  // Get room statistics
  async getRoomStats(): Promise<ApiResponse<RoomStats>> {
    try {
      const result = await apiService.get<RoomStats>('/rooms/stats');
      return result;
    } catch (error: any) {
      console.error('Error fetching room stats:', error);
      return {
        success: false,
        error: error.error || 'Failed to fetch room statistics',
      };
    }
  }

  // Get room availability for date range
  async getRoomAvailability(startDate: string, endDate: string): Promise<ApiResponse<RoomAvailability[]>> {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });
      
      const result = await apiService.get<RoomAvailability[]>(`/rooms/availability?${params.toString()}`);
      return result;
    } catch (error: any) {
      console.error('Error fetching room availability:', error);
      return {
        success: false,
        error: error.error || 'Failed to fetch room availability',
      };
    }
  }
}

export const roomsService = new RoomsService();
export default roomsService;
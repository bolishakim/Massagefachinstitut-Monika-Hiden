import { ApiResponse } from '@/types';
import { apiService } from './api';

export interface StaffSchedule {
  id: string;
  staffId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  startTime: string; // Format: "09:00"
  endTime: string; // Format: "17:00"
  breakStartTime?: string; // Format: "13:00"
  breakEndTime?: string; // Format: "15:00"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    username?: string;
    email?: string;
    specialization?: string;
    role: string;
    isActive: boolean;
  };
}

export interface CreateStaffScheduleRequest {
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isActive?: boolean;
}

export interface UpdateStaffScheduleRequest {
  startTime?: string;
  endTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isActive?: boolean;
}

export interface StaffWithSchedules {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email?: string;
  specialization?: string;
  role: string;
  isActive: boolean;
  staffSchedules: StaffSchedule[];
}

export class StaffScheduleService {
  // Get all staff schedules with optional filtering
  async getStaffSchedules(filters: {
    staffId?: string;
    dayOfWeek?: number;
    isActive?: boolean;
  } = {}): Promise<ApiResponse<StaffSchedule[]>> {
    const params = new URLSearchParams();
    
    if (filters.staffId) params.append('staffId', filters.staffId);
    if (filters.dayOfWeek !== undefined) params.append('dayOfWeek', filters.dayOfWeek.toString());
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    
    const queryString = params.toString();
    return apiService.get<StaffSchedule[]>(`/staff-schedules${queryString ? `?${queryString}` : ''}`);
  }

  // Get schedules grouped by staff member
  async getSchedulesByStaff(isActive?: boolean): Promise<ApiResponse<StaffWithSchedules[]>> {
    const params = new URLSearchParams();
    if (isActive !== undefined) params.append('isActive', isActive.toString());
    
    const queryString = params.toString();
    return apiService.get<StaffWithSchedules[]>(`/staff-schedules/by-staff${queryString ? `?${queryString}` : ''}`);
  }

  // Get specific staff schedule by ID
  async getStaffScheduleById(id: string): Promise<ApiResponse<StaffSchedule>> {
    return apiService.get<StaffSchedule>(`/staff-schedules/${id}`);
  }

  // Create new staff schedule
  async createStaffSchedule(scheduleData: CreateStaffScheduleRequest): Promise<ApiResponse<StaffSchedule>> {
    return apiService.post<StaffSchedule>('/staff-schedules', scheduleData);
  }

  // Update staff schedule
  async updateStaffSchedule(id: string, scheduleData: UpdateStaffScheduleRequest): Promise<ApiResponse<StaffSchedule>> {
    return apiService.put<StaffSchedule>(`/staff-schedules/${id}`, scheduleData);
  }

  // Delete staff schedule
  async deleteStaffSchedule(id: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/staff-schedules/${id}`);
  }
}

export const staffScheduleService = new StaffScheduleService();
export default staffScheduleService;
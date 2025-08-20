import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';

// Types
export interface Appointment {
  id: string;
  patientId: string;
  packageId?: string;
  serviceId: string;
  staffId: string;
  roomId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  hasConflict: boolean;
  conflictReason?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  package?: {
    id: string;
    name: string;
    finalPrice: number;
    paymentStatus: string;
    packageItems: {
      service: {
        id: string;
        name: string;
        duration: number;
      };
      sessionCount: number;
      completedCount: number;
    }[];
    payments: {
      id: string;
      amount: number;
      status: string;
      paidAt: string;
    }[];
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
    categoryColor: string;
  };
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  room: {
    id: string;
    name: string;
    description?: string;
    features?: string[];
  };
}

export interface CreateAppointmentRequest {
  patientId: string;
  packageId: string;
  serviceId: string;
  staffId: string;
  roomId: string;
  scheduledDate: string;
  startTime: string;
  notes?: string;
  payment?: {
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER';
    paidSessionsCount?: number;
  };
}

export interface CreateMultipleAppointmentsRequest {
  patientId: string;
  packageId: string;
  appointments: {
    serviceId: string;
    staffId: string;
    roomId: string;
    scheduledDate: string;
    startTime: string;
    notes?: string;
  }[];
  payment?: {
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER';
    paidSessionsCount?: number;
  };
}

export interface UpdateAppointmentRequest {
  staffId?: string;
  roomId?: string;
  scheduledDate?: string;
  startTime?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
}

export interface AvailabilityResponse {
  availableStaff: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  }[];
  availableRooms: {
    id: string;
    name: string;
    description?: string;
    features?: string[];
  }[];
  totalConflicts: number;
}

export interface MarkAsPaidRequest {
  appointmentIds: string[];
  payment: {
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER';
    notes?: string;
  };
}

export interface AppointmentFilters {
  search?: string;
  status?: string;
  staffId?: string;
  roomId?: string;
  patientId?: string;
  packageId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const appointmentService = {
  // Get all appointments with filters and pagination
  getAllAppointments: async (
    page: number = 1,
    limit: number = 10,
    filters?: AppointmentFilters
  ): Promise<ApiResponse<PaginatedResponse<Appointment>>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    // Only add filters that have values
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/appointments?${params.toString()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return response;
  },

  // Get appointment by ID
  getAppointmentById: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.get(`/appointments/${id}`);
    return response;
  },

  // Create single appointment
  createAppointment: async (data: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> => {
    const response = await api.post('/appointments', data);
    return response;
  },

  // Create multiple appointments
  createMultipleAppointments: async (data: CreateMultipleAppointmentsRequest): Promise<ApiResponse<{
    created: Appointment[];
    errors: string[];
  }>> => {
    const response = await api.post('/appointments/multiple', data);
    return response;
  },

  // Update appointment
  updateAppointment: async (id: string, data: UpdateAppointmentRequest): Promise<ApiResponse<Appointment>> => {
    const response = await api.put(`/appointments/${id}`, data);
    return response;
  },

  // Delete (cancel) appointment
  deleteAppointment: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/appointments/${id}`);
    return response;
  },

  // Check availability for appointment slot
  checkAvailability: async (params: {
    date: string;
    startTime: string;
    duration: number;
    serviceId?: string;
    excludeAppointmentId?: string;
  }): Promise<ApiResponse<AvailabilityResponse>> => {
    const queryParams = new URLSearchParams({
      date: params.date,
      startTime: params.startTime,
      duration: params.duration.toString(),
      ...(params.serviceId && { serviceId: params.serviceId }),
      ...(params.excludeAppointmentId && { excludeAppointmentId: params.excludeAppointmentId })
    });

    const response = await api.get(`/appointments/availability?${queryParams}`);
    return response;
  },

  // Get calendar appointments
  getCalendarAppointments: async (params: {
    startDate: string;
    endDate: string;
    staffId?: string;
    roomId?: string;
  }): Promise<ApiResponse<Appointment[]>> => {
    const queryParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.staffId && { staffId: params.staffId }),
      ...(params.roomId && { roomId: params.roomId })
    });

    const response = await api.get(`/appointments/calendar?${queryParams}`);
    return response;
  },

  // Mark appointments as paid
  markAppointmentsAsPaid: async (data: MarkAsPaidRequest): Promise<ApiResponse<{
    payments: any[];
    appointmentCount: number;
  }>> => {
    const response = await api.post('/appointments/mark-paid', data);
    return response;
  },

  // Bulk delete appointments (Admin only)
  bulkDeleteAppointments: async (appointmentIds: string[]): Promise<ApiResponse<{
    cancelledCount: number;
  }>> => {
    const response = await api.delete('/appointments/bulk', {
      data: { appointmentIds }
    });
    return response;
  },

  // Get appointments for a specific patient
  getPatientAppointments: async (patientId: string, filters?: Partial<AppointmentFilters>): Promise<ApiResponse<PaginatedResponse<Appointment>>> => {
    return appointmentService.getAllAppointments(1, 50, {
      ...filters,
      patientId,
      sortBy: 'scheduledDate',
      sortOrder: 'desc'
    });
  },

  // Get appointments for a specific package
  getPackageAppointments: async (packageId: string): Promise<ApiResponse<PaginatedResponse<Appointment>>> => {
    return appointmentService.getAllAppointments(1, 100, {
      packageId,
      sortBy: 'scheduledDate',
      sortOrder: 'asc'
    });
  },

  // Get today's appointments
  getTodaysAppointments: async (staffId?: string): Promise<ApiResponse<PaginatedResponse<Appointment>>> => {
    const today = new Date().toISOString().split('T')[0];
    return appointmentService.getAllAppointments(1, 100, {
      date: today,
      staffId,
      status: 'SCHEDULED',
      sortBy: 'startTime',
      sortOrder: 'asc'
    });
  },

  // Get upcoming appointments
  getUpcomingAppointments: async (days: number = 7, staffId?: string): Promise<ApiResponse<PaginatedResponse<Appointment>>> => {
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    
    return appointmentService.getAllAppointments(1, 100, {
      startDate,
      endDate,
      staffId,
      status: 'SCHEDULED',
      sortBy: 'scheduledDate',
      sortOrder: 'asc'
    });
  },

  // Complete appointment
  completeAppointment: async (id: string, notes?: string): Promise<ApiResponse<Appointment>> => {
    return appointmentService.updateAppointment(id, {
      status: 'COMPLETED',
      notes
    });
  },

  // Reschedule appointment
  rescheduleAppointment: async (
    id: string, 
    newDate: string, 
    newTime: string, 
    staffId?: string, 
    roomId?: string
  ): Promise<ApiResponse<Appointment>> => {
    const updateData: UpdateAppointmentRequest = {
      scheduledDate: newDate,
      startTime: newTime
    };

    if (staffId) updateData.staffId = staffId;
    if (roomId) updateData.roomId = roomId;

    return appointmentService.updateAppointment(id, updateData);
  }
};
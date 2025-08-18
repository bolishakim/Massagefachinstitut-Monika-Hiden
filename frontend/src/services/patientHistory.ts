import { ApiResponse, PaginatedResponse } from '@/types';
import { apiService } from './api';

export interface PatientHistoryEntry {
  id: string;
  patientId: string;
  packageId?: string;
  appointmentId?: string;
  mainSubjectiveProblem?: string;
  symptomHistory?: string;
  previousCourseAndTherapy?: string;
  patientGoals?: string;
  activityStatus?: string;
  trunkAndHeadParticularities?: string;
  edemaTrophicsAtrophies?: string;
  notes?: string;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
  };
  package?: {
    id: string;
    name: string;
  };
  appointment?: {
    id: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    service: {
      name: string; // German name
    };
    staff: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface PatientHistoryForm {
  patientId: string;
  packageId?: string;
  appointmentId?: string;
  mainSubjectiveProblem?: string;
  symptomHistory?: string;
  previousCourseAndTherapy?: string;
  patientGoals?: string;
  activityStatus?: string;
  trunkAndHeadParticularities?: string;
  edemaTrophicsAtrophies?: string;
  notes?: string;
  recordedAt?: string;
}

class PatientHistoryService {
  async getAllPatientHistory(
    page: number = 1,
    limit: number = 20,
    patientId?: string,
    search?: string,
    sortBy: 'recordedAt' | 'createdAt' = 'recordedAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<PatientHistoryEntry>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(patientId && { patientId }),
        ...(search && { search }),
      });

      const result = await apiService.get<PaginatedResponse<PatientHistoryEntry>>(`/patient-history?${params}`);
      return result;
    } catch (error: any) {
      console.error('Error fetching patient history:', error);
      return {
        success: false,
        error: error.error || 'Fehler beim Laden der Krankengeschichte'
      };
    }
  }

  async getPatientHistoryById(id: string): Promise<ApiResponse<PatientHistoryEntry>> {
    try {
      const result = await apiService.get<PatientHistoryEntry>(`/patient-history/${id}`);
      return result;
    } catch (error: any) {
      console.error('Error fetching patient history entry:', error);
      if (error.error === 'Patient history entry not found') {
        return {
          success: false,
          error: 'Krankengeschichte-Eintrag nicht gefunden'
        };
      }
      return {
        success: false,
        error: error.error || 'Fehler beim Laden des Krankengeschichte-Eintrags'
      };
    }
  }

  async createPatientHistory(data: PatientHistoryForm): Promise<ApiResponse<PatientHistoryEntry>> {
    try {
      const result = await apiService.post<PatientHistoryEntry>('/patient-history', data);
      return result;
    } catch (error: any) {
      console.error('Error creating patient history entry:', error);
      return {
        success: false,
        error: error.error || 'Fehler beim Erstellen des Krankengeschichte-Eintrags'
      };
    }
  }

  async updatePatientHistory(id: string, data: Partial<PatientHistoryForm>): Promise<ApiResponse<PatientHistoryEntry>> {
    try {
      const result = await apiService.put<PatientHistoryEntry>(`/patient-history/${id}`, data);
      return result;
    } catch (error: any) {
      console.error('Error updating patient history entry:', error);
      if (error.error === 'Patient history entry not found') {
        return {
          success: false,
          error: 'Krankengeschichte-Eintrag nicht gefunden'
        };
      }
      return {
        success: false,
        error: error.error || 'Fehler beim Aktualisieren des Krankengeschichte-Eintrags'
      };
    }
  }

  async deletePatientHistory(id: string): Promise<ApiResponse<void>> {
    try {
      const result = await apiService.delete<void>(`/patient-history/${id}`);
      return result;
    } catch (error: any) {
      console.error('Error deleting patient history entry:', error);
      if (error.error === 'Patient history entry not found') {
        return {
          success: false,
          error: 'Krankengeschichte-Eintrag nicht gefunden'
        };
      }
      return {
        success: false,
        error: error.error || 'Fehler beim Löschen des Krankengeschichte-Eintrags'
      };
    }
  }
}

export const patientHistoryService = new PatientHistoryService();
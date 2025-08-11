import { Patient, PatientForm, PaginatedResponse, ApiResponse } from '@/types';
import { apiService } from './api';

class PatientService {

  async getAllPatients(
    page: number = 1, 
    limit: number = 10,
    search?: string,
    filters?: Record<string, any>
  ): Promise<PaginatedResponse<Patient>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(filters?.insuranceType && filters.insuranceType !== 'all' && { insuranceType: filters.insuranceType }),
        ...(filters?.isActive && { isActive: filters.isActive }),
        ...(filters?.sortBy && { sortBy: filters.sortBy }),
        ...(filters?.sortOrder && { sortOrder: filters.sortOrder }),
      });

      const result = await apiService.get<PaginatedResponse<Patient>>(`/patients?${params}`);
      return result;
    } catch (error) {
      console.error('Error fetching patients:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der Patienten'
      };
    }
  }

  async getPatientById(id: string): Promise<ApiResponse<Patient>> {
    try {
      const result = await apiService.get<Patient>(`/patients/${id}`);
      return result;
    } catch (error: any) {
      console.error('Error fetching patient:', error);
      if (error.error === 'Patient not found') {
        return {
          success: false,
          error: 'Patient nicht gefunden'
        };
      }
      return {
        success: false,
        error: 'Fehler beim Laden des Patienten'
      };
    }
  }

  async createPatient(patientData: PatientForm): Promise<ApiResponse<Patient>> {
    try {
      const result = await apiService.post<Patient>('/patients', patientData);
      return result;
    } catch (error: any) {
      console.error('Error creating patient:', error);
      return {
        success: false,
        error: error.error || 'Fehler beim Erstellen des Patienten'
      };
    }
  }

  async updatePatient(id: string, patientData: Partial<PatientForm>): Promise<ApiResponse<Patient>> {
    try {
      const result = await apiService.put<Patient>(`/patients/${id}`, patientData);
      return result;
    } catch (error: any) {
      console.error('Error updating patient:', error);
      if (error.error === 'Patient not found') {
        return {
          success: false,
          error: 'Patient nicht gefunden'
        };
      }
      return {
        success: false,
        error: error.error || 'Fehler beim Aktualisieren des Patienten'
      };
    }
  }

  async deletePatient(id: string): Promise<ApiResponse<void>> {
    try {
      const result = await apiService.delete<void>(`/patients/${id}`);
      return result;
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      if (error.error === 'Patient not found') {
        return {
          success: false,
          error: 'Patient nicht gefunden'
        };
      }
      return {
        success: false,
        error: error.error || 'Fehler beim Löschen des Patienten'
      };
    }
  }

  async bulkDeletePatients(patientIds: string[]): Promise<ApiResponse<{ deletedCount: number }>> {
    try {
      const result = await apiService.post<{ deletedCount: number }>('/patients/bulk-delete', { patientIds });
      return result;
    } catch (error: any) {
      console.error('Error bulk deleting patients:', error);
      return {
        success: false,
        error: error.error || 'Fehler beim Löschen der Patienten'
      };
    }
  }

  async reactivatePatient(id: string): Promise<ApiResponse<Patient>> {
    try {
      const result = await apiService.post<Patient>(`/patients/${id}/reactivate`);
      return result;
    } catch (error: any) {
      console.error('Error reactivating patient:', error);
      if (error.error === 'Patient not found') {
        return {
          success: false,
          error: 'Patient nicht gefunden'
        };
      }
      if (error.error === 'Patient is already active') {
        return {
          success: false,
          error: 'Patient ist bereits aktiv'
        };
      }
      return {
        success: false,
        error: error.error || 'Fehler beim Reaktivieren des Patienten'
      };
    }
  }

  async searchPatients(query: string): Promise<ApiResponse<Patient[]>> {
    try {
      if (!query.trim()) {
        return {
          success: true,
          data: []
        };
      }

      const params = new URLSearchParams({ q: query });
      const result = await apiService.get<Patient[]>(`/patients/search?${params}`);
      return result;
    } catch (error: any) {
      console.error('Error searching patients:', error);
      return {
        success: false,
        error: error.error || 'Fehler bei der Patientensuche'
      };
    }
  }

  // Related entity methods - these will be expanded when those systems are implemented
  async getPatientAppointments(_patientId: string) {
    // TODO: Implement when appointment API is ready
    return {
      success: true,
      data: []
    };
  }

  async getPatientPackages(_patientId: string) {
    // TODO: Implement when package API is ready
    return {
      success: true,
      data: []
    };
  }

  async getPatientHistory(_patientId: string) {
    // TODO: Implement when history API is ready
    return {
      success: true,
      data: []
    };
  }

  async getPatientPayments(_patientId: string) {
    // TODO: Implement when payment API is ready
    return {
      success: true,
      data: []
    };
  }
}

export const patientService = new PatientService();
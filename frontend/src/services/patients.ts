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

  // GDPR Hard Delete Operations
  async hardDeletePatient(id: string, reason?: string): Promise<ApiResponse<{ message: string; deletionReason: string }>> {
    try {
      // For DELETE requests, we need to send data in the body using a custom config
      const result = await apiService.post<{ message: string; deletionReason: string }>(`/patients/${id}/hard-delete`, {
        confirmDeletion: true,
        reason: reason || 'GDPR Right to Erasure request'
      });
      return result;
    } catch (error: any) {
      console.error('Error permanently deleting patient:', error);
      if (error.error === 'Patient not found') {
        return {
          success: false,
          error: 'Patient nicht gefunden'
        };
      }
      if (error.error === 'Administrative privileges required for permanent patient deletion') {
        return {
          success: false,
          error: 'Administratorrechte erforderlich für permanente Löschung'
        };
      }
      if (error.error === 'Access token is required') {
        return {
          success: false,
          error: 'Sie sind nicht angemeldet. Bitte melden Sie sich erneut an.'
        };
      }
      return {
        success: false,
        error: error.error || 'Fehler beim permanenten Löschen des Patienten'
      };
    }
  }

  async bulkHardDeletePatients(patientIds: string[], reason?: string): Promise<ApiResponse<{ deletedCount: number; errors: string[]; deletionReason: string }>> {
    try {
      const result = await apiService.post<{ deletedCount: number; errors: string[]; deletionReason: string }>('/patients/bulk-hard-delete', {
        patientIds,
        confirmDeletion: true,
        reason: reason || 'GDPR Bulk Right to Erasure request'
      });
      return result;
    } catch (error: any) {
      console.error('Error bulk permanently deleting patients:', error);
      if (error.error === 'Administrative privileges required for bulk permanent deletion') {
        return {
          success: false,
          error: 'Administratorrechte erforderlich für permanente Massenlöschung'
        };
      }
      return {
        success: false,
        error: error.error || 'Fehler beim permanenten Löschen der Patienten'
      };
    }
  }

  async exportPatientData(patientId: string): Promise<ApiResponse<{ requestId: string; downloadUrl: string; expiresIn: string }>> {
    try {
      const result = await apiService.post<{ requestId: string; downloadUrl: string; expiresIn: string }>(`/gdpr/patient/${patientId}/export`);
      return result;
    } catch (error: any) {
      console.error('Error exporting patient data:', error);
      if (error.error === 'Patient not found') {
        return {
          success: false,
          error: 'Patient nicht gefunden'
        };
      }
      if (error.error === 'Access token is required') {
        return {
          success: false,
          error: 'Sie sind nicht angemeldet. Bitte melden Sie sich erneut an.'
        };
      }
      return {
        success: false,
        error: error.error || 'Fehler beim Exportieren der Patientendaten'
      };
    }
  }

  async downloadPatientExport(filename: string): Promise<void> {
    try {
      // Make an authenticated request to download the file
      const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3050/api';
      const response = await fetch(`${baseURL}/gdpr/download-patient-export/${filename}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Get the blob and create download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
        throw new Error(errorData.error || 'Download failed');
      }
    } catch (error) {
      console.error('Error downloading patient export:', error);
      throw error;
    }
  }
}

export const patientService = new PatientService();
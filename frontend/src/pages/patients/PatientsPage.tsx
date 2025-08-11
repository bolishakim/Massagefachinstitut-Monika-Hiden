import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PatientList } from '@/components/patients';
import { patientService } from '@/services/patients';
import { Patient, PaginatedResponse } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { AlertCircle } from 'lucide-react';

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<Patient>['pagination'] | undefined>();
  const [currentFilters, setCurrentFilters] = useState<any>({});
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get current page, search and status filter from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('search') || '';
  const statusFilter = searchParams.get('isActive') || '';

  const loadPatients = async (page: number = currentPage, search: string = searchQuery, filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert frontend filter values to backend API values
      const apiFilters: any = {};
      
      if (filters?.insuranceType && filters.insuranceType !== 'all') {
        apiFilters.insuranceType = filters.insuranceType;
      }
      
      if (filters?.isActive) {
        if (filters.isActive === 'all') {
          apiFilters.isActive = 'all';
        } else {
          apiFilters.isActive = filters.isActive === 'active' ? 'true' : 'false';
        }
      }
      
      if (filters?.sortBy) {
        // Map frontend sortBy values to backend values
        const sortByMapping: { [key: string]: string } = {
          'name': 'firstName',
          'created': 'createdAt', 
          'age': 'dateOfBirth',
          'lastVisit': 'createdAt' // fallback since we don't have lastVisit field
        };
        apiFilters.sortBy = sortByMapping[filters.sortBy] || 'firstName';
      }
      
      if (filters?.sortOrder) {
        apiFilters.sortOrder = filters.sortOrder;
      }

      const response = await patientService.getAllPatients(page, 10, search, apiFilters);
      
      if (response.success) {
        setPatients(response.data);
        setPagination(response.pagination);
      } else {
        setError('Fehler beim Laden der Patienten');
      }
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Fehler beim Laden der Patienten');
    } finally {
      setLoading(false);
    }
  };

  // Load patients on component mount and when filters change
  useEffect(() => {
    loadPatients(currentPage, searchQuery, currentFilters);
  }, [currentPage, searchQuery, currentFilters]);

  const handlePageChange = (page: number) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', page.toString());
      return newParams;
    });
  };

  const handleRefresh = () => {
    loadPatients(currentPage, searchQuery, currentFilters);
  };

  const handlePatientView = (patient: Patient) => {
    navigate(`/patients/${patient.id}`);
  };

  const handlePatientEdit = (patient: Patient) => {
    navigate(`/patients/${patient.id}/edit`);
  };

  const handlePatientSelect = (patient: Patient) => {
    // Navigate to appointment scheduling with pre-selected patient
    navigate(`/appointments/new?patientId=${patient.id}`);
  };

  const handleCreateNew = () => {
    navigate('/patients/new');
  };

  const handleBulkDelete = async (patientIds: string[]) => {
    try {
      const response = await patientService.bulkDeletePatients(patientIds);
      
      if (response.success) {
        // Refresh the patient list after successful deletion
        await loadPatients(currentPage, searchQuery, currentFilters);
      } else {
        setError(response.error || 'Fehler beim Löschen der Patienten');
      }
    } catch (err) {
      console.error('Error bulk deleting patients:', err);
      setError('Fehler beim Löschen der Patienten');
    }
  };

  const handleReactivatePatient = async (patient: Patient) => {
    try {
      const response = await patientService.reactivatePatient(patient.id);
      
      if (response.success) {
        // Refresh the patient list after successful reactivation
        await loadPatients(currentPage, searchQuery, currentFilters);
      } else {
        setError(response.error || 'Fehler beim Reaktivieren des Patienten');
      }
    } catch (err) {
      console.error('Error reactivating patient:', err);
      setError('Fehler beim Reaktivieren des Patienten');
    }
  };

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Fehler</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      <PatientList
        patients={patients}
        loading={loading}
        onPatientSelect={handlePatientSelect}
        onPatientEdit={handlePatientEdit}
        onPatientView={handlePatientView}
        onCreateNew={handleCreateNew}
        onRefresh={handleRefresh}
        onBulkDelete={handleBulkDelete}
        onReactivatePatient={handleReactivatePatient}
        onFiltersChange={handleFiltersChange}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
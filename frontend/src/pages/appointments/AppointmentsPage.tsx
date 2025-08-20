import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { appointmentService } from '@/services/appointments';
import { Appointment, PaginatedResponse } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<Appointment>['pagination'] | undefined>();
  const [currentFilters, setCurrentFilters] = useState<any>({});
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get current page and filters from URL
  const currentPage = parseInt(searchParams.get('seite') || '1');
  const searchQuery = searchParams.get('suche') || '';
  const statusFilter = searchParams.get('status') || '';

  const loadAppointments = async (page: number = currentPage, search: string = searchQuery, filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert German filter values to API values
      const apiFilters: any = {};
      
      if (search) {
        apiFilters.search = search;
      }
      
      if (filters?.status && filters.status !== 'alle') {
        apiFilters.status = filters.status;
      }
      
      if (filters?.staffId && filters.staffId !== 'alle') {
        apiFilters.staffId = filters.staffId;
      }
      
      if (filters?.roomId && filters.roomId !== 'alle') {
        apiFilters.roomId = filters.roomId;
      }
      
      if (filters?.date) {
        apiFilters.date = new Date(filters.date).toISOString();
      }
      
      if (filters?.startDate) {
        apiFilters.startDate = new Date(filters.startDate).toISOString();
      }
      
      if (filters?.endDate) {
        apiFilters.endDate = new Date(filters.endDate).toISOString();
      }
      
      if (filters?.sortBy) {
        apiFilters.sortBy = filters.sortBy;
      }
      
      if (filters?.sortOrder) {
        apiFilters.sortOrder = filters.sortOrder;
      }

      const response = await appointmentService.getAllAppointments(page, 10, apiFilters);
      
      if (response && response.success) {
        setAppointments(response.data || []);
        setPagination(response.pagination);
      } else {
        console.error('API Error:', response?.error);
        setError(response?.error || 'Fehler beim Laden der Termine');
      }
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      setError(err.error || err.message || 'Fehler beim Laden der Termine');
    } finally {
      setLoading(false);
    }
  };

  // Load appointments on component mount and when filters change (excluding search)
  useEffect(() => {
    loadAppointments(currentPage, searchQuery, currentFilters);
  }, [
    currentPage, 
    searchQuery, 
    currentFilters.status, 
    currentFilters.staffId, 
    currentFilters.roomId, 
    currentFilters.date, 
    currentFilters.sortBy, 
    currentFilters.sortOrder
  ]);

  // Remove search effect - search is handled locally in AppointmentList

  const handlePageChange = (page: number) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('seite', page.toString());
      return newParams;
    });
  };

  const handleRefresh = () => {
    loadAppointments(currentPage, searchQuery, currentFilters);
  };

  const handleAppointmentView = (appointment: Appointment) => {
    navigate(`/appointments/${appointment.id}`);
  };

  const handleAppointmentEdit = (appointment: Appointment) => {
    navigate(`/appointments/${appointment.id}/edit`);
  };

  const handleAppointmentSelect = (appointment: Appointment) => {
    // Navigate to appointment detail with action menu
    navigate(`/appointments/${appointment.id}?aktion=details`);
  };

  const handleCreateNew = () => {
    navigate('/appointments/new');
  };

  const handleBulkDelete = async (appointmentIds: string[]) => {
    try {
      const response = await appointmentService.bulkDeleteAppointments(appointmentIds);
      
      if (response.success) {
        setSuccessMessage(`${response.data.cancelledCount} Termin(e) erfolgreich abgesagt`);
        // Refresh the appointment list after successful cancellation
        await loadAppointments(currentPage, searchQuery, currentFilters);
      } else {
        setError('Fehler beim Absagen der Termine');
      }
    } catch (err) {
      console.error('Error bulk deleting appointments:', err);
      setError('Fehler beim Absagen der Termine');
    }
  };

  const handleMarkAsPaid = async (appointmentIds: string[]) => {
    // Navigate to payment form
    navigate(`/appointments/zahlung?termine=${appointmentIds.join(',')}`);
  };

  const handleCompleteAppointment = async (appointment: Appointment) => {
    try {
      const response = await appointmentService.completeAppointment(appointment.id, 'Termin abgeschlossen');
      
      if (response.success) {
        setSuccessMessage(`Termin für ${appointment.patient?.firstName} ${appointment.patient?.lastName} als abgeschlossen markiert`);
        await loadAppointments(currentPage, searchQuery, currentFilters);
      } else {
        setError('Fehler beim Abschließen des Termins');
      }
    } catch (err) {
      console.error('Error completing appointment:', err);
      setError('Fehler beim Abschließen des Termins');
    }
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    navigate(`/appointments/${appointment.id}/verschieben`);
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    if (!window.confirm(
      `Möchten Sie den Termin für ${appointment.patient?.firstName} ${appointment.patient?.lastName} wirklich absagen?`
    )) {
      return;
    }

    try {
      const response = await appointmentService.deleteAppointment(appointment.id);
      
      if (response.success) {
        setSuccessMessage('Termin erfolgreich abgesagt');
        await loadAppointments(currentPage, searchQuery, currentFilters);
      } else {
        setError('Fehler beim Absagen des Termins');
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError('Fehler beim Absagen des Termins');
    }
  };

  const handleDuplicateAppointment = (appointment: Appointment) => {
    // Navigate to create form with pre-filled data
    const duplicateData = {
      patientId: appointment.patient?.id,
      packageId: appointment.package?.id,
      serviceId: appointment.service?.id,
      staffId: appointment.staff?.id,
      roomId: appointment.room?.id,
      startTime: appointment.startTime,
      notes: appointment.notes
    };
    navigate('/appointments/new', { state: { duplicateData } });
  };

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
    
    // Update URL params
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      if (filters.search) {
        newParams.set('suche', filters.search);
      } else {
        newParams.delete('suche');
      }
      
      if (filters.status && filters.status !== 'alle') {
        newParams.set('status', filters.status);
      } else {
        newParams.delete('status');
      }
      
      // Reset page to 1 when filters change
      newParams.set('seite', '1');
      
      return newParams;
    });
  }, [setSearchParams]);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
          <CheckCircle2 className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Erfolg</h4>
            <p className="text-sm">{successMessage}</p>
          </div>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" dismissible onDismiss={() => setError(null)}>
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Fehler</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      <AppointmentList
        appointments={appointments}
        loading={loading}
        onAppointmentSelect={handleAppointmentSelect}
        onAppointmentEdit={handleAppointmentEdit}
        onAppointmentView={handleAppointmentView}
        onCreateNew={handleCreateNew}
        onRefresh={handleRefresh}
        onBulkDelete={handleBulkDelete}
        onMarkAsPaid={handleMarkAsPaid}
        onCompleteAppointment={handleCompleteAppointment}
        onRescheduleAppointment={handleRescheduleAppointment}
        onCancelAppointment={handleCancelAppointment}
        onDuplicateAppointment={handleDuplicateAppointment}
        onFiltersChange={handleFiltersChange}
        pagination={pagination}
        onPageChange={handlePageChange}
        userRole={user?.role}
        showPatientColumn={true}
        showPackageColumn={true}
      />
    </div>
  );
}
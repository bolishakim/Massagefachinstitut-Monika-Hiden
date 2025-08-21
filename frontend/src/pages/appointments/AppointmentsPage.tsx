import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { PackagePaymentModal } from '@/components/modals/PackagePaymentModal';
import { appointmentService } from '@/services/appointments';
import { packageService } from '@/services/packages';
import { Appointment, PaginatedResponse, ServicePackage, PaymentMethod } from '@/types';
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
  
  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    package: ServicePackage | null;
    appointment: Appointment | null;
  }>({
    isOpen: false,
    package: null,
    appointment: null
  });
  
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
        // Handle date filter - use the date as-is for daily filtering (YYYY-MM-DD format)
        apiFilters.date = filters.date;
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

  // Handle success message from URL parameter
  useEffect(() => {
    const successParam = searchParams.get('erfolg');
    if (successParam) {
      setSuccessMessage(decodeURIComponent(successParam));
      // Remove the success parameter from URL after showing the message
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('erfolg');
      setSearchParams(newSearchParams, { replace: true });
      
      // Clear success message after 1.5 seconds (same as patient/package forms)
      setTimeout(() => setSuccessMessage(null), 1500);
    }
  }, [searchParams, setSearchParams]);

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
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
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
    // For now, we only support single appointment payment
    if (appointmentIds.length !== 1) {
      setError('Bitte wählen Sie nur einen Termin zum Bezahlen aus');
      return;
    }

    const appointmentId = appointmentIds[0];
    const appointment = appointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) {
      setError('Termin nicht gefunden');
      return;
    }

    // If appointment has a package, load the package and check payment status
    if (appointment.packageId && appointment.package) {
      try {
        // Get fresh package data to ensure we have the latest payment info
        const response = await packageService.getPackageById(appointment.packageId);
        if (response.success && response.data) {
          const pkg = response.data;
          
          // Check if this appointment is already paid for
          // Simple approach: Check if there are any payments with notes mentioning this appointment ID
          // or if the package has been fully paid (totalPaid >= finalPrice)
          const isPackageFullyPaid = Number(pkg.totalPaid) >= Number(pkg.finalPrice);
          
          // Check if there's a payment with this appointment ID in the notes
          const hasAppointmentSpecificPayment = pkg.payments?.some(payment => 
            payment.notes && payment.notes.includes(appointment.id)
          ) || false;
          
          if (isPackageFullyPaid || hasAppointmentSpecificPayment) {
            setError('Der Betrag für diesen Termin wurde bereits bezahlt.');
            return;
          }
          
          setPaymentModal({
            isOpen: true,
            package: pkg,
            appointment: appointment
          });
        } else {
          setError('Paket konnte nicht geladen werden');
        }
      } catch (err) {
        console.error('Error loading package:', err);
        setError('Fehler beim Laden der Paketdaten');
      }
    } else {
      // For appointments without packages, navigate to the old payment flow
      navigate(`/appointments/zahlung?termine=${appointmentIds.join(',')}`);
    }
  };

  const handlePaymentSubmit = async (packageId: string, data: {
    amount: number;
    paymentMethod: PaymentMethod;
    paidSessionsCount?: number;
    notes?: string;
  }) => {
    try {
      // If payment is made from appointment context, add appointment ID to notes
      const appointmentContext = paymentModal.appointment;
      let paymentNotes = data.notes || '';
      
      if (appointmentContext) {
        const appointmentInfo = `Termin: ${appointmentContext.id} (${appointmentContext.patient?.firstName} ${appointmentContext.patient?.lastName} - ${new Date(appointmentContext.scheduledDate).toLocaleDateString('de-DE')})`;
        paymentNotes = paymentNotes ? `${paymentNotes}\n\n${appointmentInfo}` : appointmentInfo;
      }
      
      const paymentData = {
        ...data,
        notes: paymentNotes
      };
      
      const response = await packageService.addPayment(packageId, paymentData);
      
      if (response.success) {
        setSuccessMessage('Zahlung erfolgreich hinzugefügt');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
        setPaymentModal({ isOpen: false, package: null, appointment: null });
        // Reload appointments to reflect any updated payment status
        await loadAppointments(currentPage, searchQuery, currentFilters);
      } else {
        throw new Error(response.error || 'Fehler beim Hinzufügen der Zahlung');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Fehler beim Hinzufügen der Zahlung');
    }
  };

  const handleCompleteAppointment = async (appointment: Appointment) => {
    try {
      // Check if appointment is in the future
      const appointmentDate = new Date(appointment.scheduledDate);
      const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);
      appointmentDate.setHours(endHours, endMinutes, 0, 0);
      
      const now = new Date();
      
      if (appointmentDate > now) {
        setError('Ein zukünftiger Termin kann nicht als abgeschlossen markiert werden.');
        return;
      }
      
      const response = await appointmentService.completeAppointment(appointment.id, 'Termin abgeschlossen');
      
      if (response.success) {
        setSuccessMessage(`Termin für ${appointment.patient?.firstName} ${appointment.patient?.lastName} als abgeschlossen markiert`);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
        await loadAppointments(currentPage, searchQuery, currentFilters);
      } else {
        setError(response.error || 'Fehler beim Abschließen des Termins');
      }
    } catch (err: any) {
      console.error('Error completing appointment:', err);
      setError(err.error || err.message || 'Fehler beim Abschließen des Termins');
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
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
        await loadAppointments(currentPage, searchQuery, currentFilters);
      } else {
        setError('Fehler beim Absagen des Termins');
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError('Fehler beim Absagen des Termins');
    }
  };

  const handleNoShowAppointment = async (appointment: Appointment) => {
    // Check if appointment is in the future
    const appointmentDate = new Date(appointment.scheduledDate);
    const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
    appointmentDate.setHours(startHours, startMinutes, 0, 0);
    
    const now = new Date();
    
    if (appointmentDate > now) {
      setError('Ein zukünftiger Termin kann nicht als "No Show" markiert werden.');
      return;
    }

    if (!window.confirm(
      `Möchten Sie den Termin für ${appointment.patient?.firstName} ${appointment.patient?.lastName} als "No Show" markieren?`
    )) {
      return;
    }

    try {
      const response = await appointmentService.updateAppointment(appointment.id, {
        status: 'NO_SHOW'
      });
      
      if (response.success) {
        setSuccessMessage('Termin als "No Show" markiert');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
        await loadAppointments(currentPage, searchQuery, currentFilters);
      } else {
        setError('Fehler beim Markieren als "No Show"');
      }
    } catch (err) {
      console.error('Error marking appointment as no show:', err);
      setError('Fehler beim Markieren als "No Show"');
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
        onNoShowAppointment={handleNoShowAppointment}
        onDuplicateAppointment={handleDuplicateAppointment}
        onFiltersChange={handleFiltersChange}
        pagination={pagination}
        onPageChange={handlePageChange}
        userRole={user?.role}
        showPatientColumn={true}
        showPackageColumn={true}
      />

      {/* Package Payment Modal */}
      <PackagePaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, package: null, appointment: null })}
        package={paymentModal.package}
        appointment={paymentModal.appointment}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { appointmentService } from '@/services/appointments';
import { Appointment } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { H1, TextSM } from '@/components/ui/Typography';

export function AppointmentFormPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const isEditMode = !!id;
  const preselectedPatient = searchParams.get('patientId');
  const preselectedPackage = searchParams.get('packageId');
  const allowMultiple = searchParams.get('mehrfach') === 'true';
  const duplicateData = location.state?.duplicateData;

  // Load existing appointment data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadAppointment(id);
    }
  }, [id, isEditMode]);

  const loadAppointment = async (appointmentId: string) => {
    try {
      setLoadingData(true);
      const response = await appointmentService.getAppointmentById(appointmentId);
      
      if (response.success && response.data) {
        setAppointment(response.data);
      } else {
        setError('Termin nicht gefunden');
      }
    } catch (err) {
      console.error('Error loading appointment:', err);
      setError('Fehler beim Laden des Termins');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      
      if (isEditMode && id) {
        // Update existing appointment
        const updateData = {
          staffId: data.staffId,
          roomId: data.roomId,
          scheduledDate: data.scheduledDate,
          startTime: data.startTime,
          notes: data.notes
        };
        
        response = await appointmentService.updateAppointment(id, updateData);
      } else {
        // Create new appointment(s)
        if (data.appointments && data.appointments.length > 0) {
          // Multiple appointments
          const createData = {
            patientId: data.patientId,
            packageId: data.packageId,
            appointments: data.appointments,
            payment: data.includePayment ? data.payment : undefined
          };
          
          response = await appointmentService.createMultipleAppointments(createData);
        } else {
          // Single appointment
          const createData = {
            patientId: data.patientId,
            packageId: data.packageId,
            serviceId: data.serviceId,
            staffId: data.staffId,
            roomId: data.roomId,
            scheduledDate: data.scheduledDate,
            startTime: data.startTime,
            notes: data.notes,
            payment: data.includePayment ? data.payment : undefined
          };
          
          response = await appointmentService.createAppointment(createData);
        }
      }

      if (response.success) {
        // Navigate back to appointments list with success message
        navigate('/appointments?erfolg=' + encodeURIComponent(
          isEditMode 
            ? 'Termin erfolgreich aktualisiert'
            : `${data.appointments?.length > 0 ? data.appointments.length + ' Termine' : 'Termin'} erfolgreich erstellt`
        ));
      } else {
        setError(response.error || 'Fehler beim Speichern des Termins');
      }
    } catch (err: any) {
      console.error('Error submitting appointment:', err);
      // Extract error message from API response
      const errorMessage = err?.error || err?.message || 'Fehler beim Speichern des Termins';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/appointments');
  };

  // Convert appointment data for form
  const getInitialData = () => {
    if (appointment) {
      return {
        patientId: appointment.patientId,
        packageId: appointment.packageId || '',
        serviceId: appointment.serviceId,
        staffId: appointment.staffId,
        roomId: appointment.roomId,
        scheduledDate: appointment.scheduledDate.split('T')[0], // Convert to YYYY-MM-DD format
        startTime: appointment.startTime,
        notes: appointment.notes || ''
      };
    }
    
    // Use duplicate data if available
    if (duplicateData) {
      return {
        patientId: duplicateData.patientId || preselectedPatient || '',
        packageId: duplicateData.packageId || preselectedPackage || '',
        serviceId: duplicateData.serviceId || '',
        staffId: duplicateData.staffId || '',
        roomId: duplicateData.roomId || '',
        scheduledDate: '',  // Don't duplicate the date
        startTime: duplicateData.startTime || '',
        notes: duplicateData.notes || ''
      };
    }
    
    return undefined;
  };

  if (loadingData) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <TextSM>Termin wird geladen...</TextSM>
          </div>
        </div>
      </Card>
    );
  }

  if (isEditMode && !appointment) {
    return (
      <div className="space-y-6">
        <H1>Termin bearbeiten</H1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Termin nicht gefunden</h4>
            <p className="text-sm">Der angeforderte Termin konnte nicht gefunden werden.</p>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <H1>{isEditMode ? 'Termin bearbeiten' : duplicateData ? 'Termin duplizieren' : 'Neuer Termin'}</H1>
        <TextSM className="text-muted-foreground mt-1">
          {isEditMode 
            ? 'Bearbeiten Sie die Termindetails'
            : duplicateData 
              ? 'Erstellen Sie einen neuen Termin basierend auf den kopierten Daten'
              : 'Erstellen Sie einen neuen Termin für einen Patienten'
          }
        </TextSM>
      </div>

      {error && (
        <Alert variant="destructive" dismissible onDismiss={() => setError(null)}>
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Fehler</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      <AppointmentForm
        mode={isEditMode ? 'edit' : 'create'}
        appointmentId={id}
        initialData={getInitialData()}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        allowMultiple={allowMultiple}
        preselectedPatient={preselectedPatient || undefined}
        preselectedPackage={preselectedPackage || undefined}
      />
    </div>
  );
}
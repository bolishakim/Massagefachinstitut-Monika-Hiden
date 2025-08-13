import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientDetail } from '@/components/patients';
import { patientService } from '@/services/patients';
import { Patient, Appointment, Package, PatientHistory, Payment } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [gdprLoading, setGdprLoading] = useState(false);

  const loadPatientData = async () => {
    if (!id) {
      setError('Ungültige Patienten-ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load patient details
      const patientResponse = await patientService.getPatientById(id);
      
      if (!patientResponse.success || !patientResponse.data) {
        setError(patientResponse.error || 'Patient nicht gefunden');
        return;
      }

      setPatient(patientResponse.data);

      // Load related data in parallel
      const [appointmentsRes, packagesRes, historyRes, paymentsRes] = await Promise.all([
        patientService.getPatientAppointments(id),
        patientService.getPatientPackages(id),
        patientService.getPatientHistory(id),
        patientService.getPatientPayments(id)
      ]);

      if (appointmentsRes.success) setAppointments(appointmentsRes.data);
      if (packagesRes.success) setPackages(packagesRes.data);
      if (historyRes.success) setHistory(historyRes.data);
      if (paymentsRes.success) setPayments(paymentsRes.data);

    } catch (err) {
      console.error('Error loading patient data:', err);
      setError('Fehler beim Laden der Patientendaten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const handleBack = () => {
    navigate('/patients');
  };

  const handleEdit = (patient: Patient) => {
    navigate(`/patients/${patient.id}/edit`);
  };

  const handleScheduleAppointment = (patient: Patient) => {
    navigate(`/appointments/new?patientId=${patient.id}`);
  };

  const handleCreatePackage = (patient: Patient) => {
    navigate(`/services/packages/new?patientId=${patient.id}`);
  };

  const handleAddHistory = (patient: Patient) => {
    navigate(`/patients/${patient.id}/history/new`);
  };

  const handleExportPatientData = async (patient: Patient) => {
    if (!user || user.role !== 'ADMIN') {
      setError('Administratorrechte erforderlich');
      return;
    }

    setGdprLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await patientService.exportPatientData(patient.id);
      
      if (result.success && result.data) {
        setSuccessMessage('Patientendatenexport erfolgreich erstellt. Der Download startet automatisch.');
        
        // Instead of opening a new tab, download the file using the authenticated API
        if (result.data.downloadUrl) {
          // Extract filename from download URL
          const filename = result.data.downloadUrl.split('/').pop() || `patient-export-${patient.id}.json`;
          
          // Download the file with authentication
          await patientService.downloadPatientExport(filename);
        }
      } else {
        setError(result.error || 'Fehler beim Exportieren der Patientendaten');
      }
    } catch (error) {
      console.error('Error exporting patient data:', error);
      setError('Fehler beim Exportieren der Patientendaten');
    } finally {
      setGdprLoading(false);
    }
  };

  const handleHardDeletePatient = async (patient: Patient) => {
    if (!user || user.role !== 'ADMIN') {
      setError('Administratorrechte erforderlich');
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `ACHTUNG: PERMANENTE LÖSCHUNG\n\n` +
      `Sie sind dabei, ALLE Daten von ${patient.firstName} ${patient.lastName} unwiderruflich zu löschen.\n\n` +
      `Dies umfasst:\n` +
      `• Patientenprofil und Kontaktdaten\n` +
      `• Komplette Krankengeschichte\n` +
      `• Alle Termine und Behandlungen\n` +
      `• Behandlungspakete und Zahlungen\n\n` +
      `Diese Aktion kann NICHT rückgängig gemacht werden und überschreibt die medizinische Aufbewahrungspflicht gemäß GDPR Artikel 17.\n\n` +
      `Möchten Sie wirklich fortfahren?`
    );

    if (!confirmed) return;

    setGdprLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const reason = window.prompt(
        'Bitte geben Sie einen Grund für die permanente Löschung an (GDPR Artikel 17):',
        'GDPR Right to Erasure - Patient request'
      );

      if (!reason) {
        setGdprLoading(false);
        return;
      }

      const result = await patientService.hardDeletePatient(patient.id, reason);
      
      if (result.success) {
        setSuccessMessage('Patient und alle zugehörigen Daten wurden permanent gelöscht');
        // Navigate after a delay to show the success message
        setTimeout(() => {
          navigate('/patients');
        }, 2000);
      } else {
        setError(result.error || 'Fehler beim permanenten Löschen des Patienten');
      }
    } catch (error) {
      console.error('Error permanently deleting patient:', error);
      setError('Fehler beim permanenten Löschen des Patienten');
    } finally {
      setGdprLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Lade Patientendaten...</span>
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Fehler</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
        <button
          onClick={handleBack}
          className="text-primary hover:underline"
        >
          ← Zurück zur Patientenliste
        </button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Patient nicht gefunden</h2>
        <p className="text-muted-foreground mb-4">
          Der angeforderte Patient konnte nicht gefunden werden.
        </p>
        <button
          onClick={handleBack}
          className="text-primary hover:underline"
        >
          ← Zurück zur Patientenliste
        </button>
      </div>
    );
  }

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
      {error && patient && (
        <Alert variant="destructive" dismissible onDismiss={() => setError(null)}>
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Fehler</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {/* Loading indicator for GDPR operations */}
      {gdprLoading && (
        <Alert variant="info">
          <Loader2 className="h-4 w-4 animate-spin" />
          <div>
            <h4 className="font-medium">Verarbeitung läuft...</h4>
            <p className="text-sm">GDPR-Operation wird ausgeführt. Bitte warten...</p>
          </div>
        </Alert>
      )}

      <PatientDetail
        patient={patient}
        appointments={appointments}
        packages={packages}
        history={history}
        payments={payments}
        onBack={handleBack}
        onEdit={handleEdit}
        onScheduleAppointment={handleScheduleAppointment}
        onCreatePackage={handleCreatePackage}
        onAddHistory={handleAddHistory}
        onExportPatientData={handleExportPatientData}
        onHardDeletePatient={handleHardDeletePatient}
        userRole={user?.role}
      />
    </div>
  );
}
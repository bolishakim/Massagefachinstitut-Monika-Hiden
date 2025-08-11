import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientDetail } from '@/components/patients';
import { patientService } from '@/services/patients';
import { Patient, Appointment, Package, PatientHistory, Payment } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
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
    />
  );
}
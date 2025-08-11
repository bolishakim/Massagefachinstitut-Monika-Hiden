import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PatientForm } from '@/components/patients';
import { patientService } from '@/services/patients';
import { Patient, PatientForm as PatientFormType } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export function PatientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = Boolean(id);
  const returnTo = searchParams.get('returnTo') || '/patients';

  // Load patient data for editing
  useEffect(() => {
    if (isEditing && id) {
      loadPatient(id);
    }
  }, [id, isEditing]);

  const loadPatient = async (patientId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await patientService.getPatientById(patientId);
      
      if (response.success && response.data) {
        setPatient(response.data);
      } else {
        setError(response.error || 'Patient nicht gefunden');
      }
    } catch (err) {
      console.error('Error loading patient:', err);
      setError('Fehler beim Laden der Patientendaten');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: PatientFormType) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      let response;
      
      if (isEditing && id) {
        // Update existing patient
        response = await patientService.updatePatient(id, formData);
      } else {
        // Create new patient
        response = await patientService.createPatient(formData);
      }

      if (response.success) {
        setSuccess(response.message || (isEditing ? 'Patient erfolgreich aktualisiert' : 'Patient erfolgreich erstellt'));
        
        // Redirect after success
        setTimeout(() => {
          if (response.data) {
            // Go to patient detail page
            navigate(`/patients/${response.data.id}`);
          } else {
            // Go back to patients list
            navigate(returnTo);
          }
        }, 1500);
      } else {
        setError(response.error || 'Fehler beim Speichern');
      }
    } catch (err) {
      console.error('Error submitting patient form:', err);
      setError('Fehler beim Speichern der Patientendaten');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEditing && id) {
      navigate(`/patients/${id}`);
    } else {
      navigate(returnTo);
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

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Erfolgreich</h4>
            <p className="text-sm">{success}</p>
          </div>
        </Alert>
      )}

      <PatientForm
        patient={patient || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={submitting}
      />
    </div>
  );
}
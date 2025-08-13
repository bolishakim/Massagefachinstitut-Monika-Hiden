import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, FileText, User, Filter, Plus, Edit, Trash2, Save, X, Stethoscope, AlertCircle, Activity, CheckCircle, Loader2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatientHistoryEntry, patientHistoryService } from '@/services/patientHistory';
import { patientService } from '@/services/patients';
import { Patient } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { clsx } from 'clsx';

export function PatientHistoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isNewRoute = location.pathname === '/patients/history/new';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [history, setHistory] = useState<PatientHistoryEntry[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(isNewRoute);
  const [editingEntry, setEditingEntry] = useState<PatientHistoryEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    entry: PatientHistoryEntry | null;
  }>({ isOpen: false, entry: null });
  const [viewingEntry, setViewingEntry] = useState<PatientHistoryEntry | null>(null);

  const loadPatientHistory = async () => {
    try {
      setLoading(true);
      const response = await patientHistoryService.getAllPatientHistory(
        currentPage,
        20,
        selectedPatient || undefined,
        searchQuery || undefined
      );
      
      if (response.success && response.data) {
        setHistory(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
        }
      } else {
        console.error('Failed to load patient history:', response.error);
        setHistory([]);
      }
    } catch (error) {
      console.error('Error loading patient history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await patientService.getAllPatients(1, 100);
      if (response.success && response.data) {
        setPatients(response.data);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    loadPatientHistory();
  }, [currentPage, selectedPatient, searchQuery]);

  const handleViewEntry = (entry: PatientHistoryEntry) => {
    // Show detailed view of the history entry
    setViewingEntry(entry);
  };

  const handleEdit = (entry: PatientHistoryEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = (entry: PatientHistoryEntry) => {
    setDeleteConfirmation({ isOpen: true, entry });
  };

  const handleConfirmDelete = async () => {
    const entry = deleteConfirmation.entry;
    if (!entry) return;

    try {
      setDeleting(entry.id);
      setError(null);
      setSuccess(null);
      
      const response = await patientHistoryService.deletePatientHistory(entry.id);
      if (response.success) {
        setSuccess('Krankengeschichte-Eintrag erfolgreich gelöscht');
        loadPatientHistory();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Fehler beim Löschen des Eintrags');
      }
    } catch (error) {
      console.error('Error deleting patient history:', error);
      setError('Fehler beim Löschen des Eintrags');
    } finally {
      setDeleting(null);
      setDeleteConfirmation({ isOpen: false, entry: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, entry: null });
  };

  const handleFormSubmit = (successMessage?: string) => {
    if (isNewRoute) {
      // Navigate back to history list when coming from /new route
      navigate('/patients/history');
      return;
    }
    
    setShowForm(false);
    setEditingEntry(null);
    if (successMessage) {
      setSuccess(successMessage);
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    }
    loadPatientHistory();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (showForm) {
    return (
      <PatientHistoryForm
        entry={editingEntry}
        patients={patients}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          if (isNewRoute) {
            navigate('/patients/history');
          } else {
            setShowForm(false);
            setEditingEntry(null);
          }
        }}
      />
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

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Krankengeschichte</h1>
          <p className="text-muted-foreground">
            Übersicht über alle Patientenverläufe und Behandlungshistorie
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Neuer Eintrag
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Nach Patient oder Inhalt suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="pl-10 pr-8 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Alle Patienten</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-card rounded-lg border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Lade Krankengeschichte...</p>
          </div>
        ) : history.length > 0 ? (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 border-b font-medium text-sm">
              <div className="col-span-2">Patient</div>
              <div className="col-span-2">Datum</div>
              <div className="col-span-2">Subjektives Hauptproblem</div>
              <div className="col-span-2">Symptomanamnese</div>
              <div className="col-span-2">Aktivitätszustand</div>
              <div className="col-span-1">Besonderheiten</div>
              <div className="col-span-1 text-center">Aktionen</div>
            </div>
            
            <div className="divide-y divide-border">
              {history.map((entry) => (
                <div key={entry.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/50 transition-colors">
                  {/* Patient Name */}
                  <div className="col-span-2">
                    <div className="font-medium text-foreground">
                      {entry.patient.firstName} {entry.patient.lastName}
                    </div>
                    {entry.appointment && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {entry.appointment.service.nameGerman || entry.appointment.service.name}
                      </div>
                    )}
                  </div>
                  
                  {/* Date */}
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground">
                      {formatDate(entry.recordedAt)}
                    </div>
                  </div>
                  
                  {/* Subjektives Hauptproblem */}
                  <div className="col-span-2">
                    <div className="text-sm">
                      {entry.mainSubjectiveProblem ? (
                        <span className="text-foreground">
                          {entry.mainSubjectiveProblem.length > 100 
                            ? `${entry.mainSubjectiveProblem.substring(0, 100)}...` 
                            : entry.mainSubjectiveProblem}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Nicht angegeben</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Symptomanamnese */}
                  <div className="col-span-2">
                    <div className="text-sm">
                      {entry.symptomHistory ? (
                        <span className="text-foreground">
                          {entry.symptomHistory.length > 100 
                            ? `${entry.symptomHistory.substring(0, 100)}...` 
                            : entry.symptomHistory}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Nicht angegeben</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Aktivitätszustand */}
                  <div className="col-span-2">
                    <div className="text-sm">
                      {entry.activityStatus ? (
                        <span className="text-foreground">
                          {entry.activityStatus.length > 80 
                            ? `${entry.activityStatus.substring(0, 80)}...` 
                            : entry.activityStatus}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Nicht angegeben</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Besonderheiten & Ödeme (combined) */}
                  <div className="col-span-1">
                    <div className="text-xs space-y-1">
                      {entry.trunkAndHeadParticularities && (
                        <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300">
                          Rumpf/Kopf
                        </div>
                      )}
                      {entry.edemaTrophicsAtrophies && (
                        <div className="p-1 bg-orange-50 dark:bg-orange-900/20 rounded text-orange-700 dark:text-orange-300">
                          Ödeme/Trophik
                        </div>
                      )}
                      {entry.patientGoals && (
                        <div className="p-1 bg-green-50 dark:bg-green-900/20 rounded text-green-700 dark:text-green-300">
                          Ziele
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-1 flex justify-center items-center gap-1">
                    <button
                      onClick={() => handleViewEntry(entry)}
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                      title="Krankengeschichte anzeigen"
                      disabled={deleting === entry.id}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                      title="Bearbeiten"
                      disabled={deleting === entry.id}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry)}
                      className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Löschen"
                      disabled={deleting === entry.id}
                    >
                      {deleting === entry.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Seite {currentPage} von {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Vorherige
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Nächste
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Einträge gefunden</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedPatient
                ? 'Keine Krankengeschichte entspricht den aktuellen Suchkriterien.'
                : 'Es sind noch keine Krankengeschichte-Einträge vorhanden.'}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary hover:underline"
            >
              Ersten Eintrag erstellen
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Krankengeschichte löschen"
        message={
          deleteConfirmation.entry
            ? `Sind Sie sicher, dass Sie die Krankengeschichte von ${deleteConfirmation.entry.patient.firstName} ${deleteConfirmation.entry.patient.lastName} vom ${new Date(deleteConfirmation.entry.recordedAt).toLocaleDateString('de-DE')} löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`
            : ''
        }
        confirmText="Löschen"
        cancelText="Abbrechen"
        variant="danger"
        isLoading={deleting === deleteConfirmation.entry?.id}
      />

      {/* History Entry Detail View Modal */}
      <AnimatePresence>
        {viewingEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Krankengeschichte</h2>
                    <p className="text-sm text-muted-foreground">
                      {viewingEntry.patient.firstName} {viewingEntry.patient.lastName} • {formatDate(viewingEntry.recordedAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingEntry(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Patient Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Patient</h3>
                    <p className="font-semibold">{viewingEntry.patient.firstName} {viewingEntry.patient.lastName}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Aufzeichnungsdatum</h3>
                    <p>{formatDate(viewingEntry.recordedAt)}</p>
                  </div>
                  {viewingEntry.appointment && (
                    <>
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground mb-1">Behandlung</h3>
                        <p>{viewingEntry.appointment.service.nameGerman || viewingEntry.appointment.service.name}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground mb-1">Termin</h3>
                        <p>{new Date(viewingEntry.appointment.scheduledDate).toLocaleDateString('de-DE')}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* ANAMNESE Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    ANAMNESE
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Subjektives Hauptproblem</h4>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">
                          {viewingEntry.mainSubjectiveProblem || <span className="text-muted-foreground italic">Nicht angegeben</span>}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Symptomanamnese</h4>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">
                          {viewingEntry.symptomHistory || <span className="text-muted-foreground italic">Nicht angegeben</span>}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Bisheriger Verlauf und Therapie</h4>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">
                          {viewingEntry.previousCourseAndTherapy || <span className="text-muted-foreground italic">Nicht angegeben</span>}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Ziele des Patienten</h4>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">
                          {viewingEntry.patientGoals || <span className="text-muted-foreground italic">Nicht angegeben</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ALLGEMEINE INSPEKTION Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    ALLGEMEINE INSPEKTION
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Aktivitätszustand</h4>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">
                          {viewingEntry.activityStatus || <span className="text-muted-foreground italic">Nicht angegeben</span>}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Besonderheiten des Rumpfes und des Kopfes</h4>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">
                          {viewingEntry.trunkAndHeadParticularities || <span className="text-muted-foreground italic">Nicht angegeben</span>}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Ödeme, Trophik, Atrophien</h4>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">
                          {viewingEntry.edemaTrophicsAtrophies || <span className="text-muted-foreground italic">Nicht angegeben</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                {viewingEntry.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Zusätzliche Notizen</h3>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm">{viewingEntry.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  Erstellt am: {new Date(viewingEntry.createdAt).toLocaleString('de-DE')}
                  {viewingEntry.updatedAt !== viewingEntry.createdAt && (
                    <span> • Aktualisiert am: {new Date(viewingEntry.updatedAt).toLocaleString('de-DE')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewingEntry(null);
                      handleEdit(viewingEntry);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewingEntry(null)}
                  >
                    Schließen
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Patient History Form Component
interface PatientHistoryFormProps {
  entry?: PatientHistoryEntry | null;
  patients: Patient[];
  onSubmit: (successMessage?: string) => void;
  onCancel: () => void;
}

function PatientHistoryForm({ entry, patients, onSubmit, onCancel }: PatientHistoryFormProps) {
  const [formData, setFormData] = useState({
    patientId: entry?.patientId || '',
    // ANAMNESE (Medical History)
    generalImpression: entry?.notes || '', // Use notes as general impression for backwards compatibility
    mainSubjectiveProblem: entry?.mainSubjectiveProblem || '',
    symptomHistory: entry?.symptomHistory || '',
    medicalHistory: entry?.previousCourseAndTherapy || '', // Use previousCourseAndTherapy as medical history
    previousCourseAndTherapy: entry?.previousCourseAndTherapy || '',
    patientGoals: entry?.patientGoals || '',
    // ALLGEMEINE INSPEKTION (General Inspection)
    activityStatus: entry?.activityStatus || '',
    trunkAndHeadParticularities: entry?.trunkAndHeadParticularities || '',
    edemaTrophicsAtrophies: entry?.edemaTrophicsAtrophies || '',
    notes: entry?.notes || '',
    recordedAt: entry?.recordedAt ? new Date(entry.recordedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.patientId) {
        stepErrors.patientId = 'Patient ist erforderlich';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      let response;
      if (entry) {
        response = await patientHistoryService.updatePatientHistory(entry.id, formData);
      } else {
        response = await patientHistoryService.createPatientHistory(formData);
      }

      if (response.success) {
        const successMessage = response.message || (entry ? 'Krankengeschichte erfolgreich aktualisiert' : 'Krankengeschichte erfolgreich erstellt');
        setFormSuccess(successMessage);
        
        // Redirect after success
        setTimeout(() => {
          onSubmit(successMessage);
        }, 1500);
      } else {
        setFormError(response.error || 'Fehler beim Speichern der Krankengeschichte');
      }
    } catch (error) {
      console.error('Error submitting patient history form:', error);
      setFormError('Fehler beim Speichern der Krankengeschichte');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Fehler</h4>
            <p className="text-sm">{formError}</p>
          </div>
        </Alert>
      )}

      {formSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Erfolgreich</h4>
            <p className="text-sm">{formSuccess}</p>
          </div>
        </Alert>
      )}

      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {entry ? 'Krankengeschichte bearbeiten' : 'Neue Krankengeschichte'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {entry ? 'Medizinische Dokumentation aktualisieren' : 'Neue medizinische Dokumentation erstellen'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          <div className="flex items-center flex-1">
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              1
            </div>
            <div className="flex-1 h-1 mx-4 bg-muted">
              <div 
                className={clsx('h-full bg-primary transition-all duration-300',
                  currentStep > 1 ? 'w-full' : 'w-0'
                )}
              />
            </div>
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              2
            </div>
            <div className="flex-1 h-1 mx-4 bg-muted">
              <div 
                className={clsx('h-full bg-primary transition-all duration-300',
                  currentStep > 2 ? 'w-full' : 'w-0'
                )}
              />
            </div>
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              3
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Grunddaten
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Select
                        label="Patient"
                        value={formData.patientId}
                        onChange={(value) => handleInputChange('patientId', value)}
                        options={[
                          { value: '', label: 'Patient auswählen...' },
                          ...patients.map(patient => ({
                            value: patient.id,
                            label: `${patient.firstName} ${patient.lastName}`
                          }))
                        ]}
                        error={errors.patientId}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Input
                        label="Aufzeichnungsdatum"
                        type="datetime-local"
                        value={formData.recordedAt}
                        onChange={(e) => handleInputChange('recordedAt', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Allgemeiner Eindruck
                    </label>
                    <textarea
                      value={formData.generalImpression}
                      onChange={(e) => handleInputChange('generalImpression', e.target.value)}
                      disabled={isSubmitting}
                      placeholder="Beschreiben Sie den allgemeinen Eindruck des Patienten..."
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Subjektives Hauptproblem
                    </label>
                    <textarea
                      value={formData.mainSubjectiveProblem}
                      onChange={(e) => handleInputChange('mainSubjectiveProblem', e.target.value)}
                      disabled={isSubmitting}
                      placeholder="Was ist das Hauptproblem aus Sicht des Patienten?"
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    Weiter
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Medical Assessment */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    ANAMNESE
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Medizinische Vorgeschichte
                      </label>
                      <textarea
                        value={formData.medicalHistory}
                        onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Relevante medizinische Vorgeschichte..."
                        rows={3}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Symptomanamnese
                      </label>
                      <textarea
                        value={formData.symptomHistory}
                        onChange={(e) => handleInputChange('symptomHistory', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="weis, wie, wo, 24h-Verhalten"
                        rows={3}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Bisheriger Verlauf und Therapie
                      </label>
                      <textarea
                        value={formData.previousCourseAndTherapy}
                        onChange={(e) => handleInputChange('previousCourseAndTherapy', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Symptombeginn und Entstehung"
                        rows={3}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Ziele des Patienten
                      </label>
                      <textarea
                        value={formData.patientGoals}
                        onChange={(e) => handleInputChange('patientGoals', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Was möchte der Patient erreichen?"
                        rows={2}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={isSubmitting}
                  >
                    Zurück
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    Weiter
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Physical Assessment & Notes */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    ALLGEMEINE INSPEKTION
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Aktivitätszustand
                        </label>
                        <textarea
                          value={formData.activityStatus}
                          onChange={(e) => handleInputChange('activityStatus', e.target.value)}
                          disabled={isSubmitting}
                          placeholder="liegend, sitzend, aktiv, welche Aktivitäten zeigt der Patient spontan ohne Aufforderung durch Therapeut, was fällt dabei auf?"
                          rows={3}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Rumpf- und Kopfbesonderheiten
                        </label>
                        <textarea
                          value={formData.trunkAndHeadParticularities}
                          onChange={(e) => handleInputChange('trunkAndHeadParticularities', e.target.value)}
                          disabled={isSubmitting}
                          placeholder="Auffälligkeiten an Rumpf und Kopf..."
                          rows={3}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Ödeme, Trophik, Atrophien
                      </label>
                      <textarea
                        value={formData.edemaTrophicsAtrophies}
                        onChange={(e) => handleInputChange('edemaTrophicsAtrophies', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Beobachtungen zu Ödemen, Trophik und Atrophien..."
                        rows={3}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Zusätzliche Notizen
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Weitere Notizen und Beobachtungen..."
                        rows={4}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none bg-background text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Hier können Sie zusätzliche Beobachtungen, Empfehlungen oder andere relevante Details festhalten.
                      </p>
                    </div>
                  </div>
                </div>

                {Object.keys(errors).length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <div>
                      <h4 className="font-medium">Bitte korrigieren Sie die folgenden Fehler:</h4>
                      <ul className="list-disc list-inside text-sm mt-1">
                        {Object.values(errors).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={isSubmitting}
                  >
                    Zurück
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {entry ? 'Aktualisieren' : 'Speichern'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </Card>
    </div>
  );
}
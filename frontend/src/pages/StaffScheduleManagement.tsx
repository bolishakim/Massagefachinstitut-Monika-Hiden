import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Coffee,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/components/layout/ProtectedRoute';
import { 
  StaffWithSchedules, 
  StaffSchedule,
  CreateStaffScheduleRequest,
  UpdateStaffScheduleRequest 
} from '@/services/staffSchedule';
import { staffScheduleService } from '@/services/staffSchedule';
import { StaffScheduleModal } from '@/components/modals/StaffScheduleModal';

const DAYS_OF_WEEK = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
];

const SPECIALIZATION_LABELS = {
  MASSAGE: 'Massage',
  PHYSIOTHERAPY: 'Physiotherapie',
  INFRARED_CHAIR: 'Infrarot Stuhl',
  TRAINING: 'Training',
  HEILMASSAGE: 'Heilmassage',
  MEDICAL_MASSAGE: 'Medizinische Massage',
};

export function StaffScheduleManagement() {
  const { user: currentUser } = useAuth();
  const { isAdmin } = usePermissions();
  
  // State for staff schedules data
  const [staffWithSchedules, setStaffWithSchedules] = useState<StaffWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<StaffSchedule | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Load staff schedules on component mount
  useEffect(() => {
    loadStaffSchedules();
  }, []);

  const loadStaffSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffScheduleService.getSchedulesByStaff(true); // Only active staff
      
      if (response.success) {
        setStaffWithSchedules(response.data);
      } else {
        setError(response.error || 'Failed to load staff schedules');
      }
    } catch (error) {
      console.error('Failed to load staff schedules:', error);
      setError('Failed to load staff schedules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (scheduleData: CreateStaffScheduleRequest) => {
    try {
      setModalLoading(true);
      const response = await staffScheduleService.createStaffSchedule(scheduleData);
      
      if (response.success) {
        await loadStaffSchedules(); // Reload data
        setShowScheduleModal(false);
        setSelectedSchedule(null);
        setSelectedStaffId(null);
        setSuccessMessage('Arbeitszeit erfolgreich erstellt');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.error || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error; // Let the modal handle the error display
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateSchedule = async (scheduleData: UpdateStaffScheduleRequest) => {
    if (!selectedSchedule) return;

    try {
      setModalLoading(true);
      const response = await staffScheduleService.updateStaffSchedule(selectedSchedule.id, scheduleData);
      
      if (response.success) {
        await loadStaffSchedules(); // Reload data
        setShowScheduleModal(false);
        setSelectedSchedule(null);
        setSelectedStaffId(null);
        setSuccessMessage('Arbeitszeit erfolgreich aktualisiert');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.error || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error; // Let the modal handle the error display
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteSchedule = async (schedule: StaffSchedule) => {
    if (!confirm(`Möchten Sie die Arbeitszeit für ${DAYS_OF_WEEK[schedule.dayOfWeek]} wirklich löschen?`)) {
      return;
    }

    try {
      const response = await staffScheduleService.deleteStaffSchedule(schedule.id);
      
      if (response.success) {
        await loadStaffSchedules(); // Reload data
        setSuccessMessage('Arbeitszeit erfolgreich gelöscht');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.error || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setError('Fehler beim Löschen der Arbeitszeit. Bitte versuchen Sie es erneut.');
    }
  };

  const openCreateModal = (staffId: string) => {
    setSelectedStaffId(staffId);
    setSelectedSchedule(null);
    setShowScheduleModal(true);
  };

  const openEditModal = (schedule: StaffSchedule) => {
    setSelectedSchedule(schedule);
    setSelectedStaffId(schedule.staffId);
    setShowScheduleModal(true);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds if present
  };

  const getSpecializationLabel = (specialization?: string) => {
    if (!specialization) return null;
    return SPECIALIZATION_LABELS[specialization as keyof typeof SPECIALIZATION_LABELS] || specialization;
  };

  const getScheduleForDay = (schedules: StaffSchedule[], dayOfWeek: number) => {
    return schedules.find(schedule => schedule.dayOfWeek === dayOfWeek && schedule.isActive);
  };

  if (!isAdmin()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Keine Berechtigung</h3>
          <p className="text-muted-foreground mt-2">
            Sie haben keine Berechtigung für die Arbeitszeiten-Verwaltung.
            Nur Administratoren können auf diese Funktion zugreifen.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Clock className="h-8 w-8" />
              Mitarbeiter Arbeitszeiten
            </h1>
            <p className="text-muted-foreground">
              Verwalten Sie die Arbeitszeiten aller Mitarbeiter
            </p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
            <CheckCircle className="h-4 w-4" />
            <div>
              <h4 className="font-medium">Erfolg</h4>
              <p className="text-sm">{successMessage}</p>
            </div>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" dismissible onDismiss={() => setError(null)}>
            <AlertCircle className="h-4 w-4" />
            <div>
              <h4 className="font-medium">Fehler</h4>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        {/* Staff Schedules */}
        <div className="space-y-6">
          {staffWithSchedules.map((staff) => (
            <Card key={staff.id} className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {staff.firstName} {staff.lastName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={staff.role === 'MODERATOR' ? 'secondary' : 'outline'}>
                          {staff.role === 'MODERATOR' ? 'Supervisor' : 'Mitarbeiter'}
                        </Badge>
                        {staff.specialization && (
                          <Badge variant="outline">
                            {getSpecializationLabel(staff.specialization)}
                          </Badge>
                        )}
                        {staff.username && (
                          <span className="text-sm text-muted-foreground">
                            @{staff.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => openCreateModal(staff.id)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Arbeitszeit hinzufügen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                  {DAYS_OF_WEEK.map((day, index) => {
                    const schedule = getScheduleForDay(staff.staffSchedules, index);
                    
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="font-medium text-sm mb-2">{day}</div>
                        {schedule ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </div>
                            {schedule.breakStartTime && schedule.breakEndTime && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Coffee className="h-3 w-3" />
                                Pause: {formatTime(schedule.breakStartTime)} - {formatTime(schedule.breakEndTime)}
                              </div>
                            )}
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(schedule)}
                                className="h-6 px-2 text-xs"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSchedule(schedule)}
                                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Kein Arbeitsplan
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && staffWithSchedules.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Keine Mitarbeiter gefunden</h3>
            <p className="text-muted-foreground mt-2">
              Keine aktiven Mitarbeiter verfügbar für die Arbeitszeiten-Verwaltung.
            </p>
          </Card>
        )}
      </motion.div>

      {/* Schedule Modal */}
      <StaffScheduleModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedSchedule(null);
          setSelectedStaffId(null);
        }}
        onSave={selectedSchedule ? handleUpdateSchedule : handleCreateSchedule}
        schedule={selectedSchedule}
        staffId={selectedStaffId}
        loading={modalLoading}
      />
    </div>
  );
}
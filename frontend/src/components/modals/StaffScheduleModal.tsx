import React, { useState, useEffect } from 'react';
import { Clock, Coffee, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';
import { 
  StaffSchedule, 
  CreateStaffScheduleRequest, 
  UpdateStaffScheduleRequest 
} from '@/services/staffSchedule';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sonntag' },
  { value: 1, label: 'Montag' },
  { value: 2, label: 'Dienstag' },
  { value: 3, label: 'Mittwoch' },
  { value: 4, label: 'Donnerstag' },
  { value: 5, label: 'Freitag' },
  { value: 6, label: 'Samstag' },
];

interface StaffScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateStaffScheduleRequest | UpdateStaffScheduleRequest) => Promise<void>;
  schedule?: StaffSchedule | null;
  staffId?: string | null;
  loading?: boolean;
}

export function StaffScheduleModal({
  isOpen,
  onClose,
  onSave,
  schedule,
  staffId,
  loading = false,
}: StaffScheduleModalProps) {
  const [formData, setFormData] = useState({
    dayOfWeek: 1, // Monday default
    startTime: '09:00',
    endTime: '17:00',
    breakStartTime: '',
    breakEndTime: '',
    hasBreak: false,
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!schedule;

  // Initialize form when modal opens or schedule changes
  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        // Editing existing schedule
        setFormData({
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime.substring(0, 5), // Remove seconds
          endTime: schedule.endTime.substring(0, 5),
          breakStartTime: schedule.breakStartTime?.substring(0, 5) || '',
          breakEndTime: schedule.breakEndTime?.substring(0, 5) || '',
          hasBreak: !!(schedule.breakStartTime && schedule.breakEndTime),
          isActive: schedule.isActive,
        });
      } else {
        // Creating new schedule
        setFormData({
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          breakStartTime: '12:00',
          breakEndTime: '13:00',
          hasBreak: false,
          isActive: true,
        });
      }
      setError(null);
    }
  }, [isOpen, schedule]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateForm = () => {
    if (formData.startTime >= formData.endTime) {
      setError('Die Startzeit muss vor der Endzeit liegen');
      return false;
    }

    if (formData.hasBreak) {
      if (!formData.breakStartTime || !formData.breakEndTime) {
        setError('Bitte geben Sie die Pausenzeiten an');
        return false;
      }
      if (formData.breakStartTime >= formData.breakEndTime) {
        setError('Die Pausenstart muss vor dem Pausenende liegen');
        return false;
      }
      if (formData.breakStartTime < formData.startTime || formData.breakEndTime > formData.endTime) {
        setError('Die Pausenzeiten müssen innerhalb der Arbeitszeiten liegen');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing) {
        const updateData: UpdateStaffScheduleRequest = {
          startTime: formData.startTime,
          endTime: formData.endTime,
          breakStartTime: formData.hasBreak ? formData.breakStartTime : undefined,
          breakEndTime: formData.hasBreak ? formData.breakEndTime : undefined,
          isActive: formData.isActive,
        };
        await onSave(updateData);
      } else {
        if (!staffId) {
          setError('Mitarbeiter-ID fehlt');
          return;
        }
        const createData: CreateStaffScheduleRequest = {
          staffId: staffId,
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
          breakStartTime: formData.hasBreak ? formData.breakStartTime : undefined,
          breakEndTime: formData.hasBreak ? formData.breakEndTime : undefined,
          isActive: formData.isActive,
        };
        await onSave(createData);
      }
    } catch (error: any) {
      setError(error.message || 'Ein Fehler ist aufgetreten');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {isEditing ? 'Arbeitszeit bearbeiten' : 'Neue Arbeitszeit'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div>
                <h4 className="font-medium">Fehler</h4>
                <p className="text-sm">{error}</p>
              </div>
            </Alert>
          )}

          {/* Day of Week - only show when creating */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Wochentag
              </label>
              <Select
                options={DAYS_OF_WEEK}
                value={formData.dayOfWeek}
                onChange={(value) => handleFieldChange('dayOfWeek', value)}
                placeholder="Wochentag wählen"
              />
            </div>
          )}

          {/* Working Hours */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Startzeit"
              type="time"
              value={formData.startTime}
              onChange={(e) => handleFieldChange('startTime', e.target.value)}
              required
            />
            <Input
              label="Endzeit"
              type="time"
              value={formData.endTime}
              onChange={(e) => handleFieldChange('endTime', e.target.value)}
              required
            />
          </div>

          {/* Break Time Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasBreak"
              checked={formData.hasBreak}
              onChange={(e) => handleFieldChange('hasBreak', e.target.checked)}
            />
            <label htmlFor="hasBreak" className="text-sm font-medium cursor-pointer">
              <Coffee className="h-4 w-4 inline mr-1" />
              Pausenzeit hinzufügen
            </label>
          </div>

          {/* Break Times */}
          {formData.hasBreak && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Pausenstart"
                type="time"
                value={formData.breakStartTime}
                onChange={(e) => handleFieldChange('breakStartTime', e.target.value)}
                required={formData.hasBreak}
              />
              <Input
                label="Pausenende"
                type="time"
                value={formData.breakEndTime}
                onChange={(e) => handleFieldChange('breakEndTime', e.target.value)}
                required={formData.hasBreak}
              />
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleFieldChange('isActive', e.target.checked)}
            />
            <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
              Aktiv
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                isEditing ? 'Aktualisieren' : 'Erstellen'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
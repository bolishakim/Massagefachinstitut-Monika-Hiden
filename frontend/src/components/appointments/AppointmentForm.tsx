import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Package as PackageIcon,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Search,
  X,
  ArrowLeft,
  ArrowRight,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Patient, ServicePackage, Service, User as StaffUser, Room, PaymentMethod } from '@/types';
import { clsx } from 'clsx';
import { appointmentService } from '@/services/appointments';
import { patientService } from '@/services/patients';
import { packageService } from '@/services/packages';
import { servicesService } from '@/services/services';
import { userService } from '@/services/user';
import { roomsService } from '@/services/rooms';

const appointmentSchema = z.object({
  patientId: z.string().uuid('Patient auswählen'),
  packageId: z.string().uuid('Paket auswählen'),
  serviceId: z.string().uuid('Behandlung auswählen'),
  staffId: z.string().uuid('Therapeut auswählen'),
  roomId: z.string().uuid('Raum auswählen'),
  scheduledDate: z.string().min(1, 'Datum auswählen'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Gültige Zeit eingeben'),
  notes: z.string().optional(),
});

const multipleAppointmentsSchema = z.object({
  patientId: z.string().uuid('Patient auswählen'),
  packageId: z.string().uuid('Paket auswählen'),
  appointments: z.array(z.object({
    serviceId: z.string().uuid('Behandlung auswählen'),
    staffId: z.string().uuid('Therapeut auswählen'),
    roomId: z.string().uuid('Raum auswählen'),
    scheduledDate: z.string().min(1, 'Datum auswählen'),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Gültige Zeit eingeben'),
    notes: z.string().optional(),
  })).min(1, 'Mindestens einen Termin hinzufügen'),
});

const paymentSchema = z.object({
  amount: z.number().positive('Betrag muss positiv sein'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']),
  paidSessionsCount: z.number().positive().optional(),
});

interface AppointmentFormProps {
  mode: 'create' | 'edit';
  appointmentId?: string;
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
  allowMultiple?: boolean;
  preselectedPatient?: string;
  preselectedPackage?: string;
}

interface AppointmentSlot {
  serviceId: string;
  staffId: string;
  roomId: string;
  scheduledDate: string;
  startTime: string;
  notes?: string;
}

export function AppointmentForm({
  mode,
  appointmentId,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  allowMultiple = false,
  preselectedPatient,
  preselectedPackage
}: AppointmentFormProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isMultiple, setIsMultiple] = useState(false);
  const [includePayment, setIncludePayment] = useState(false);
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  
  // Data state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  // Availability state
  const [availability, setAvailability] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  
  // Loading states
  const [loadingData, setLoadingData] = useState(true);
  
  // Custom validation errors
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});
  
  const schema = isMultiple ? multipleAppointmentsSchema : appointmentSchema;
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      patientId: preselectedPatient || '',
      packageId: preselectedPackage || '',
      serviceId: '',
      staffId: '',
      roomId: '',
      scheduledDate: '',
      startTime: '',
      notes: '',
      appointments: []
    }
  });

  const watchedValues = watch();
  const selectedPatient = patients.find(p => p.id === watchedValues.patientId);
  const selectedPackage = packages.find(p => p.id === watchedValues.packageId);
  const selectedService = services.find(s => s.id === watchedValues.serviceId);

  // Check if package has available sessions
  const hasAvailableSessions = selectedPackage ? 
    (selectedPackage.remainingSessions !== undefined ? 
      selectedPackage.remainingSessions > 0 : 
      (selectedPackage.totalSessions - selectedPackage.usedSessions) > 0
    ) : false;


  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load packages when patient changes
  useEffect(() => {
    if (watchedValues.patientId) {
      loadPatientPackages(watchedValues.patientId);
    }
  }, [watchedValues.patientId]);

  // Load services and detailed package info when package changes
  useEffect(() => {
    if (watchedValues.packageId) {
      loadPackageDetails(watchedValues.packageId);
    }
  }, [watchedValues.packageId]);

  // Check availability when date, time, or service changes
  useEffect(() => {
    if (watchedValues.scheduledDate && watchedValues.startTime && selectedService) {
      checkAvailability();
    }
  }, [watchedValues.scheduledDate, watchedValues.startTime, selectedService]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [patientsRes, staffRes, roomsRes] = await Promise.all([
        patientService.getAllPatients(1, 100, '', { isActive: 'all' }),
        userService.getStaffUsers(),
        roomsService.getAllRooms()
      ]);

      if (patientsRes.success) setPatients(patientsRes.data);
      if (staffRes.success) setStaff(staffRes.data);
      if (roomsRes.success) setRooms(roomsRes.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadPatientPackages = async (patientId: string) => {
    try {
      const response = await packageService.getAllPackages(1, 100, '', { 
        patientId, 
        status: 'ACTIVE' 
      });
      if (response.success && response.data) {
        setPackages(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading patient packages:', error);
    }
  };

  const loadPackageDetails = async (packageId: string) => {
    try {
      const response = await packageService.getPackageById(packageId);
      if (response.success && response.data) {
        console.log('Package details loaded:', response.data);
        console.log('Total sessions:', response.data.totalSessions);
        console.log('Used sessions:', response.data.usedSessions);
        console.log('Remaining sessions:', response.data.remainingSessions);
        
        // Update the package in the packages array with the detailed information
        setPackages(prevPackages => 
          prevPackages.map(pkg => 
            pkg.id === packageId ? response.data : pkg
          )
        );
        
        // Also update the services from the package
        const packageServices = response.data.packageItems
          .filter(item => item.completedCount < item.sessionCount)
          .map(item => item.service!)
          .filter(Boolean);
        setServices(packageServices);
      }
    } catch (error) {
      console.error('Error loading package details:', error);
    }
  };

  const checkAvailability = async () => {
    if (!selectedService) return;

    try {
      setCheckingAvailability(true);
      setAvailabilityError(null);
      
      const response = await appointmentService.checkAvailability({
        date: new Date(watchedValues.scheduledDate).toISOString(),
        startTime: watchedValues.startTime,
        duration: selectedService.duration,
        serviceId: selectedService.id,
        excludeAppointmentId: appointmentId
      });

      if (response.success) {
        setAvailability(response.data);
      } else {
        setAvailabilityError(response.error || 'Fehler beim Prüfen der Verfügbarkeit');
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityError('Fehler beim Prüfen der Verfügbarkeit');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const addAppointmentSlot = () => {
    setAppointmentSlots([...appointmentSlots, {
      serviceId: '',
      staffId: '',
      roomId: '',
      scheduledDate: '',
      startTime: '',
      notes: ''
    }]);
  };

  const removeAppointmentSlot = (index: number) => {
    setAppointmentSlots(appointmentSlots.filter((_, i) => i !== index));
  };

  const updateAppointmentSlot = (index: number, field: keyof AppointmentSlot, value: string) => {
    const updated = [...appointmentSlots];
    updated[index] = { ...updated[index], [field]: value };
    setAppointmentSlots(updated);
  };

  const handleFormSubmit = (data: any) => {
    // Only allow submission from Step 3
    if (currentStep !== 3) {
      return;
    }
    
    // Final validation check before submission
    if (!hasAvailableSessions) {
      setCustomErrors({ 
        submit: 'Termin kann nicht erstellt werden. Das ausgewählte Paket hat keine verfügbaren Sitzungen mehr.' 
      });
      return;
    }

    let submissionData = { ...data };

    if (isMultiple) {
      submissionData.appointments = appointmentSlots;
    }

    if (includePayment) {
      // Payment data will be added in the parent component
      submissionData.includePayment = true;
    }

    onSubmit(submissionData);
  };

  const filteredStaff = useMemo(() => {
    if (!availability) return staff;
    return staff.filter(s => availability.availableStaff.some((as: any) => as.id === s.id));
  }, [staff, availability]);

  const filteredRooms = useMemo(() => {
    if (!availability) return rooms;
    return rooms.filter(r => availability.availableRooms.some((ar: any) => ar.id === r.id));
  }, [rooms, availability]);

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Step navigation functions
  const validateStep = (step: number): boolean => {
    const values = getValues();
    const stepErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!values.patientId) stepErrors.patientId = 'Patient auswählen';
        if (!values.packageId) stepErrors.packageId = 'Paket auswählen';
        // Check if selected package has available sessions
        if (values.packageId && !hasAvailableSessions) {
          stepErrors.packageId = 'Das ausgewählte Paket hat keine verfügbaren Sitzungen mehr';
        }
        break;
      case 2:
        if (!values.serviceId) stepErrors.serviceId = 'Behandlung auswählen';
        if (!values.staffId) stepErrors.staffId = 'Therapeut auswählen';
        if (!values.roomId) stepErrors.roomId = 'Raum auswählen';
        if (!values.scheduledDate) stepErrors.scheduledDate = 'Datum auswählen';
        if (!values.startTime) stepErrors.startTime = 'Startzeit auswählen';
        break;
      case 3:
        // Step 3 is review, no validation needed
        return true;
    }
    
    setCustomErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3)); // Ensure we don't go beyond step 3
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const resetForm = () => {
    reset();
    setCurrentStep(1);
  };

  if (loadingData) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm">Daten werden geladen...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">
              {mode === 'create' ? 'Neuer Termin' : 'Termin bearbeiten'}
            </h2>
            <p className="text-muted-foreground text-sm">
              Erstellen Sie einen neuen Behandlungstermin für einen Patienten
            </p>
          </div>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="gap-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          <div className="flex items-center flex-1">
            {[1, 2, 3].map((step, index) => (
              <React.Fragment key={step}>
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {step}
                </div>
                {index < 2 && (
                  <div className="flex-1 h-1 mx-4 bg-muted">
                    <div 
                      className={clsx('h-full bg-primary transition-all duration-300',
                        currentStep > step ? 'w-full' : 'w-0'
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <AnimatePresence mode="wait">
            {/* Step 1: Patient & Package Selection */}
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
                    Patient & Paket auswählen
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient Selection */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Patient *
                        </label>
                        <SimpleSelect
                          value={watchedValues.patientId}
                          onChange={(e) => setValue('patientId', e.target.value)}
                          className={errors.patientId ? 'border-red-500' : ''}
                        >
                          <option value="">Patient auswählen</option>
                          {patients.map(patient => (
                            <option key={patient.id} value={patient.id}>
                              {patient.firstName} {patient.lastName} - {patient.phone}
                            </option>
                          ))}
                        </SimpleSelect>
                        {errors.patientId && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.patientId.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Package Selection */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Paket *
                        </label>
                        <SimpleSelect
                          value={watchedValues.packageId}
                          onChange={(e) => {
                            setValue('packageId', e.target.value);
                            // Clear custom errors when package changes
                            setCustomErrors(prev => ({ ...prev, packageId: '' }));
                          }}
                          disabled={!watchedValues.patientId}
                          className={(errors.packageId || customErrors.packageId) ? 'border-red-500' : ''}
                        >
                          <option value="">Paket auswählen</option>
                          {packages.map(pkg => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} ({pkg.remainingSessions} verbleibende Sitzungen)
                            </option>
                          ))}
                        </SimpleSelect>
                        {(errors.packageId || customErrors.packageId) && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.packageId?.message || customErrors.packageId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Package Details */}
                  {selectedPackage && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{selectedPackage.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {selectedPackage.usedSessions} von {selectedPackage.totalSessions} Sitzungen verwendet
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Verbleibende Sitzungen: {selectedPackage.remainingSessions}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant={
                            selectedPackage.paymentStatus === 'COMPLETED' ? 'success' :
                            selectedPackage.paymentStatus === 'PARTIALLY_PAID' ? 'warning' : 'destructive'
                          }>
                            {selectedPackage.paymentStatus === 'COMPLETED' ? 'Vollzahlung' :
                             selectedPackage.paymentStatus === 'PARTIALLY_PAID' ? 'Teilzahlung' : 'Nicht bezahlt'}
                          </Badge>
                          {!hasAvailableSessions && (
                            <Badge variant="destructive">
                              Keine Sitzungen verfügbar
                            </Badge>
                          )}
                        </div>
                      </div>
                      {!hasAvailableSessions && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <p className="text-sm text-red-800 dark:text-red-200">
                              Für dieses Paket sind keine Sitzungen mehr verfügbar. Bitte wählen Sie ein anderes Paket oder erstellen Sie ein neues Paket für den Patienten.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Appointment Details */}
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
                    <Calendar className="h-5 w-5" />
                    Termindetails
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Service and Date/Time Selection */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Behandlung *
                        </label>
                        <SimpleSelect
                          value={watchedValues.serviceId}
                          onChange={(e) => setValue('serviceId', e.target.value)}
                          disabled={!services.length}
                          className={errors.serviceId ? 'border-red-500' : ''}
                        >
                          <option value="">Behandlung auswählen</option>
                          {services.map(service => (
                            <option key={service.id} value={service.id}>
                              {service.name} ({service.duration} Min)
                            </option>
                          ))}
                        </SimpleSelect>
                        {errors.serviceId && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.serviceId.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Datum *
                          </label>
                          <Input
                            type="date"
                            {...register('scheduledDate')}
                            className={errors.scheduledDate ? 'border-red-500' : ''}
                          />
                          {errors.scheduledDate && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.scheduledDate.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Startzeit *
                          </label>
                          <Input
                            type="time"
                            {...register('startTime')}
                            className={errors.startTime ? 'border-red-500' : ''}
                          />
                          {errors.startTime && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.startTime.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Room and Therapist Selection */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Raum *
                        </label>
                        <SimpleSelect
                          value={watchedValues.roomId}
                          onChange={(e) => setValue('roomId', e.target.value)}
                          className={errors.roomId ? 'border-red-500' : ''}
                        >
                          <option value="">Raum auswählen</option>
                          {filteredRooms.map(room => (
                            <option key={room.id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </SimpleSelect>
                        {errors.roomId && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.roomId.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Therapeut *
                        </label>
                        <SimpleSelect
                          value={watchedValues.staffId}
                          onChange={(e) => setValue('staffId', e.target.value)}
                          className={errors.staffId ? 'border-red-500' : ''}
                        >
                          <option value="">Therapeut auswählen</option>
                          {filteredStaff.map(staff => (
                            <option key={staff.id} value={staff.id}>
                              {staff.firstName} {staff.lastName}
                            </option>
                          ))}
                        </SimpleSelect>
                        {errors.staffId && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.staffId.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Notizen
                        </label>
                        <Input
                          {...register('notes')}
                          placeholder="Zusätzliche Notizen..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Availability Status */}
                  {availability && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800 dark:text-green-200">
                          {availability.availableStaff.length} Therapeuten und {availability.availableRooms.length} Räume verfügbar
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Review & Confirmation */}
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
                    <CheckCircle2 className="h-5 w-5" />
                    Zusammenfassung & Bestätigung
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-3">Terminübersicht</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Patient:</span>
                          <span className="ml-2 font-medium">
                            {patients.find(p => p.id === watchedValues.patientId)?.firstName}{' '}
                            {patients.find(p => p.id === watchedValues.patientId)?.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Paket:</span>
                          <span className="ml-2 font-medium">
                            {packages.find(p => p.id === watchedValues.packageId)?.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Behandlung:</span>
                          <span className="ml-2 font-medium">
                            {services.find(s => s.id === watchedValues.serviceId)?.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Therapeut:</span>
                          <span className="ml-2 font-medium">
                            {filteredStaff.find(s => s.id === watchedValues.staffId)?.firstName}{' '}
                            {filteredStaff.find(s => s.id === watchedValues.staffId)?.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Datum:</span>
                          <span className="ml-2 font-medium">
                            {watchedValues.scheduledDate ? new Date(watchedValues.scheduledDate).toLocaleDateString('de-DE') : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Zeit:</span>
                          <span className="ml-2 font-medium">
                            {watchedValues.startTime} - {selectedService ? calculateEndTime(watchedValues.startTime, selectedService.duration) : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Raum:</span>
                          <span className="ml-2 font-medium">
                            {filteredRooms.find(r => r.id === watchedValues.roomId)?.name}
                          </span>
                        </div>
                        {watchedValues.notes && (
                          <div className="md:col-span-2">
                            <span className="text-muted-foreground">Notizen:</span>
                            <span className="ml-2 font-medium">{watchedValues.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Submit Error Display */}
                    {customErrors.submit && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <p className="text-sm text-red-800 dark:text-red-200">
                            {customErrors.submit}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Zurück
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    nextStep();
                  }}
                  disabled={
                    (currentStep === 1 && (!watchedValues.patientId || !watchedValues.packageId || !hasAvailableSessions)) ||
                    (currentStep === 2 && (!watchedValues.serviceId || !watchedValues.staffId || !watchedValues.roomId || !watchedValues.scheduledDate || !watchedValues.startTime))
                  }
                  className="gap-2"
                >
                  Weiter
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || isSubmitting || !hasAvailableSessions}
                  className="gap-2"
                >
                  {loading || isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {mode === 'create' ? 'Termin erstellen' : 'Änderungen speichern'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}

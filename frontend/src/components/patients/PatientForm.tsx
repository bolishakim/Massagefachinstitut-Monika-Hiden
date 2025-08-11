import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, User, Mail, Phone, MapPin, Calendar, FileText, Stethoscope, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { PatientForm as PatientFormType, Patient, InsuranceType } from '@/types';
import { clsx } from 'clsx';

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: PatientFormType) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function PatientForm({ 
  patient, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  className 
}: PatientFormProps) {
  const [formData, setFormData] = useState<PatientFormType>({
    firstName: patient?.firstName || '',
    lastName: patient?.lastName || '',
    dateOfBirth: patient?.dateOfBirth?.split('T')[0] || '',
    email: patient?.email || '',
    phone: patient?.phone || '',
    address: patient?.address || '',
    socialInsuranceNumber: patient?.socialInsuranceNumber || '',
    notes: patient?.notes || '',
    doctorReferral: patient?.doctorReferral || '',
    insuranceType: patient?.insuranceType || undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const insuranceOptions = [
    { value: InsuranceType.PUBLIC_INSURANCE, label: 'Gesetzliche Krankenversicherung' },
    { value: InsuranceType.PRIVATE_INSURANCE, label: 'Private Krankenversicherung' },
    { value: InsuranceType.SELF_PAY, label: 'Selbstzahler' },
  ];

  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) {
        stepErrors.firstName = 'Vorname ist erforderlich';
      }
      if (!formData.lastName.trim()) {
        stepErrors.lastName = 'Nachname ist erforderlich';
      }
      if (!formData.phone.trim()) {
        stepErrors.phone = 'Telefonnummer ist erforderlich';
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        stepErrors.email = 'Ungültige E-Mail-Adresse';
      }
    }

    if (step === 2 && formData.socialInsuranceNumber) {
      // Basic Austrian SVN validation (10 digits)
      if (!/^\d{10}$/.test(formData.socialInsuranceNumber.replace(/\s/g, ''))) {
        stepErrors.socialInsuranceNumber = 'SVN muss 10 Ziffern enthalten';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleInputChange = (field: keyof PatientFormType, value: string | InsuranceType | undefined) => {
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
    
    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting patient form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSVN = (value: string) => {
    // Remove all non-digits and format as XXXX XXXXXX
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) {
      return digits;
    }
    return `${digits.slice(0, 4)} ${digits.slice(4, 10)}`;
  };

  return (
    <div className={clsx('max-w-2xl mx-auto', className)}>
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {patient ? 'Patient bearbeiten' : 'Neuer Patient'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {patient ? 'Patientendaten aktualisieren' : 'Neuen Patienten hinzufügen'}
              </p>
            </div>
          </div>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
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
                    Persönliche Daten
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Vorname"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        error={errors.firstName}
                        required
                        disabled={isSubmitting || isLoading}
                        placeholder="z.B. Maria"
                      />
                    </div>
                    <div>
                      <Input
                        label="Nachname"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        error={errors.lastName}
                        required
                        disabled={isSubmitting || isLoading}
                        placeholder="z.B. Schmidt"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Geburtsdatum"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        disabled={isSubmitting || isLoading}
                        icon={Calendar}
                      />
                    </div>
                    <div>
                      <Input
                        label="Telefonnummer"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        error={errors.phone}
                        required
                        disabled={isSubmitting || isLoading}
                        placeholder="+43 664 123 456"
                        icon={Phone}
                      />
                    </div>
                  </div>

                  <div>
                    <Input
                      label="E-Mail (optional)"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      error={errors.email}
                      disabled={isSubmitting || isLoading}
                      placeholder="maria.schmidt@email.com"
                      icon={Mail}
                    />
                  </div>

                  <div>
                    <Input
                      label="Adresse (optional)"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={isSubmitting || isLoading}
                      placeholder="Straße, PLZ Ort"
                      icon={MapPin}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting || isLoading}
                  >
                    Weiter
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Medical Information */}
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
                    Medizinische Informationen
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Sozialversicherungsnummer (optional)"
                        value={formData.socialInsuranceNumber}
                        onChange={(e) => {
                          const formatted = formatSVN(e.target.value);
                          handleInputChange('socialInsuranceNumber', formatted);
                        }}
                        error={errors.socialInsuranceNumber}
                        disabled={isSubmitting || isLoading}
                        placeholder="1234 567890"
                        maxLength={11} // 10 digits + 1 space
                      />
                    </div>
                    <div>
                      <Select
                        label="Versicherungsart (optional)"
                        value={formData.insuranceType || ''}
                        onChange={(value) => handleInputChange('insuranceType', value as InsuranceType)}
                        options={[
                          { value: '', label: 'Nicht angegeben' },
                          ...insuranceOptions
                        ]}
                        disabled={isSubmitting || isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Überweisender Arzt (optional)"
                      value={formData.doctorReferral}
                      onChange={(e) => handleInputChange('doctorReferral', e.target.value)}
                      disabled={isSubmitting || isLoading}
                      placeholder="Dr. Müller, Orthopäde"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={isSubmitting || isLoading}
                  >
                    Zurück
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting || isLoading}
                  >
                    Weiter
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Additional Notes */}
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
                    <FileText className="h-5 w-5" />
                    Zusätzliche Notizen
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Notizen (optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      disabled={isSubmitting || isLoading}
                      placeholder="Allergien, besondere Bedürfnisse, Vorgeschichte..."
                      rows={6}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Hier können Sie wichtige medizinische Informationen, Allergien oder andere relevante Details festhalten.
                    </p>
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
                    disabled={isSubmitting || isLoading}
                  >
                    Zurück
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {patient ? 'Aktualisieren' : 'Speichern'}
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
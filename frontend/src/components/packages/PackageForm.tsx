import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  X, 
  User, 
  Search,
  Package,
  Euro,
  CreditCard,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
  Calculator,
  ShoppingCart,
  Percent,
  Loader2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { PackageForm as PackageFormType, Patient, Service, PaymentMethod, ServiceCategory } from '@/types';
import { patientService } from '@/services/patients';
import { servicesService } from '@/services/services';
import { clsx } from 'clsx';

interface PackageFormProps {
  packageData?: any; // For editing existing packages
  onSubmit: (data: PackageFormType) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

interface PackageServiceItem {
  serviceId: string;
  service?: Service;
  sessionCount: number;
  pricePerSession: number;
  subtotal: number;
}

export function PackageForm({ 
  packageData, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  className 
}: PackageFormProps) {
  const [formData, setFormData] = useState<PackageFormType>({
    patientId: packageData?.patientId || '',
    name: packageData?.name || '',
    packageItems: packageData?.packageItems || [],
    totalPrice: packageData?.totalPrice || 0,
    discountAmount: packageData?.discountAmount || 0,
    finalPrice: packageData?.finalPrice || 0,
    payment: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data for dropdowns
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  
  // Package configuration
  const [packageServices, setPackageServices] = useState<PackageServiceItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Discount configuration
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');

  // Payment configuration
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<'full' | 'partial' | 'later'>('later');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paidSessionsCount, setPaidSessionsCount] = useState<number>(0);

  // Load initial data
  useEffect(() => {
    loadServices();
  }, []);

  // Load patients when search query changes
  useEffect(() => {
    if (patientSearchQuery.length >= 2) {
      loadPatients(patientSearchQuery);
    }
  }, [patientSearchQuery]);

  // Calculate totals when services change
  useEffect(() => {
    calculateTotals();
  }, [packageServices, discountType, discountValue]);

  // Update payment amount when final price or payment status changes
  useEffect(() => {
    if (paymentStatus === 'full') {
      setPaymentAmount(formData.finalPrice);
    } else if (paymentStatus === 'later') {
      setPaymentAmount(0);
    }
    // For 'partial', leave paymentAmount as set by user
  }, [formData.finalPrice, paymentStatus]);

  const loadPatients = async (search?: string) => {
    try {
      setLoadingPatients(true);
      const response = await patientService.getAllPatients(1, 20, search, { isActive: 'true' });
      if (response.success) {
        setPatients(response.data);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const response = await servicesService.getAllServices({ 
        page: 1, 
        limit: 100, 
        search: '', 
        isActive: 'true' 
      });
      if (response.success && response.data) {
        setServices(response.data || []);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const calculateTotals = () => {
    const totalPrice = packageServices.reduce((sum, item) => sum + item.subtotal, 0);
    
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (totalPrice * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
    
    const finalPrice = Math.max(0, totalPrice - discountAmount);
    
    setFormData(prev => ({
      ...prev,
      totalPrice,
      discountAmount,
      finalPrice,
      packageItems: packageServices.map(item => ({
        serviceId: item.serviceId,
        sessionCount: item.sessionCount
      }))
    }));
  };

  const addService = () => {
    setPackageServices(prev => [...prev, {
      serviceId: '',
      sessionCount: 1,
      pricePerSession: 0,
      subtotal: 0
    }]);
  };

  const removeService = (index: number) => {
    setPackageServices(prev => prev.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof PackageServiceItem, value: any) => {
    setPackageServices(prev => prev.map((item, i) => {
      if (i !== index) return item;
      
      const updated = { ...item, [field]: value };
      
      if (field === 'serviceId') {
        const service = services.find(s => s.id === value);
        updated.service = service;
        updated.pricePerSession = service ? Number(service.price) : 0;
      }
      
      updated.subtotal = updated.sessionCount * updated.pricePerSession;
      return updated;
    }));
  };

  const generatePackageName = () => {
    if (packageServices.length === 0 || !selectedPatient) return '';
    
    const serviceNames = packageServices.map(item => {
      const service = item.service;
      const sessions = item.sessionCount;
      return service ? `${sessions}x ${service.name}` : '';
    }).filter(Boolean);
    
    return serviceNames.join(' + ');
  };

  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.patientId) {
        stepErrors.patientId = 'Patient ist erforderlich';
      }
    }

    if (step === 2) {
      if (packageServices.length === 0) {
        stepErrors.services = 'Mindestens ein Service ist erforderlich';
      }
      
      packageServices.forEach((item, index) => {
        if (!item.serviceId) {
          stepErrors[`service_${index}`] = 'Service ist erforderlich';
        }
        if (item.sessionCount <= 0) {
          stepErrors[`sessions_${index}`] = 'Anzahl der Sitzungen muss positiv sein';
        }
      });
      
      if (!formData.name.trim()) {
        stepErrors.name = 'Paket Name ist erforderlich';
      }
    }

    if (step === 3) {
      if (formData.totalPrice <= 0) {
        stepErrors.totalPrice = 'Gesamtpreis muss positiv sein';
      }
    }

    if (step === 4 && paymentStatus !== 'later') {
      if (paymentAmount <= 0) {
        stepErrors.paymentAmount = 'Zahlungsbetrag muss positiv sein';
      }
      if (paymentAmount > formData.finalPrice) {
        stepErrors.paymentAmount = 'Zahlungsbetrag kann nicht höher als der Endpreis sein';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
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
    
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData: PackageFormType = {
        ...formData,
        name: formData.name || generatePackageName(),
      };

      // Add payment data if payment is being made
      if (paymentStatus !== 'later') {
        submitData.payment = {
          amount: paymentAmount,
          paymentMethod,
          paidSessionsCount: paymentStatus === 'partial' ? paidSessionsCount : undefined,
          notes: paymentNotes || undefined,
        };
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting package form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getServiceCategoryLabel = (category: ServiceCategory) => {
    switch (category) {
      case 'MASSAGE':
        return 'Massage';
      case 'PHYSIOTHERAPY':
        return 'Physiotherapie';
      case 'INFRARED_CHAIR':
        return 'Infrarot-Stuhl';
      case 'TRAINING':
        return 'Training';
      case 'HEILMASSAGE':
        return 'Heilmassage';
      case 'COMBINATION':
        return 'Kombination';
      case 'VOUCHER':
        return 'Gutschein';
      default:
        return category;
    }
  };

  const discountReasons = [
    { value: 'Senior', label: 'Senior-Rabatt' },
    { value: 'Student', label: 'Studenten-Rabatt' },
    { value: 'Loyalty', label: 'Treuerabatt' },
    { value: 'First-time', label: 'Neukunden-Rabatt' },
    { value: 'Bulk', label: 'Mengenrabatt' },
    { value: 'Medical', label: 'Medizinischer Rabatt' },
    { value: 'Other', label: 'Sonstiges' },
  ];

  return (
    <div className={clsx('max-w-4xl mx-auto', className)}>
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {packageData ? 'Paket bearbeiten' : 'Neues Paket erstellen'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {packageData ? 'Paketdaten aktualisieren' : 'Neues Servicepaket für einen Patienten erstellen'}
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
            {[1, 2, 3, 4].map((step, index) => (
              <React.Fragment key={step}>
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {step}
                </div>
                {index < 3 && (
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

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {/* Step 1: Patient Selection */}
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
                    Patient auswählen
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Input
                        label="Patient suchen"
                        placeholder="Name des Patienten eingeben..."
                        value={patientSearchQuery}
                        onChange={(e) => setPatientSearchQuery(e.target.value)}
                        icon={Search}
                        disabled={isSubmitting || isLoading}
                      />
                    </div>

                    {patientSearchQuery.length >= 2 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Verfügbare Patienten</label>
                        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                          {loadingPatients ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2 text-sm">Lade Patienten...</span>
                            </div>
                          ) : patients.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Keine Patienten gefunden
                            </p>
                          ) : (
                            patients.map((patient) => (
                              <div
                                key={patient.id}
                                className={clsx(
                                  'p-3 rounded-md border cursor-pointer transition-colors',
                                  formData.patientId === patient.id 
                                    ? 'bg-primary/10 border-primary' 
                                    : 'hover:bg-muted'
                                )}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, patientId: patient.id }));
                                  setSelectedPatient(patient);
                                  setErrors(prev => ({ ...prev, patientId: '' }));
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {patient.firstName} {patient.lastName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {patient.phone} • {patient.insuranceType}
                                    </p>
                                  </div>
                                  {formData.patientId === patient.id && (
                                    <CheckCircle className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {selectedPatient && (
                      <Card className="p-4 bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {selectedPatient.firstName} {selectedPatient.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Tel: {selectedPatient.phone} • Versicherung: {selectedPatient.insuranceType}
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {errors.patientId && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm">{errors.patientId}</p>
                      </Alert>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!formData.patientId || isSubmitting || isLoading}
                  >
                    Weiter
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Package Configuration */}
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
                    <ShoppingCart className="h-5 w-5" />
                    Services hinzufügen
                  </h3>
                  
                  <div className="space-y-4">
                    {packageServices.map((item, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div>
                            <Select
                              label="Service"
                              value={item.serviceId}
                              onChange={(value) => updateService(index, 'serviceId', value)}
                              options={[
                                { value: '', label: 'Service auswählen...' },
                                ...services.map(service => ({
                                  value: service.id,
                                  label: `${service.name} (${formatCurrency(Number(service.price))})`,
                                }))
                              ]}
                              disabled={loadingServices || isSubmitting}
                            />
                            {item.service && (
                              <div className="mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {getServiceCategoryLabel(item.service.category)}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <Input
                              label="Anzahl Sitzungen"
                              type="number"
                              min="1"
                              value={item.sessionCount.toString()}
                              onChange={(e) => updateService(index, 'sessionCount', parseInt(e.target.value) || 1)}
                              disabled={isSubmitting}
                            />
                          </div>
                          
                          <div>
                            <Input
                              label="Preis pro Sitzung"
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.pricePerSession.toString()}
                              onChange={(e) => updateService(index, 'pricePerSession', parseFloat(e.target.value) || 0)}
                              disabled={isSubmitting}
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Zwischensumme</label>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-medium">
                                {formatCurrency(item.subtotal)}
                              </span>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeService(index)}
                                disabled={packageServices.length === 1 || isSubmitting}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addService}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Service hinzufügen
                    </Button>

                    <div>
                      <Input
                        label="Paket Name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={generatePackageName() || "Paket Name eingeben..."}
                        disabled={isSubmitting}
                      />
                      {generatePackageName() && !formData.name && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, name: generatePackageName() }))}
                          className="mt-2"
                        >
                          Vorgeschlagenen Namen verwenden
                        </Button>
                      )}
                    </div>

                    {(errors.services || errors.name) && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <div>
                          {errors.services && <p className="text-sm">{errors.services}</p>}
                          {errors.name && <p className="text-sm">{errors.name}</p>}
                        </div>
                      </Alert>
                    )}
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
                    disabled={packageServices.length === 0 || isSubmitting}
                  >
                    Weiter
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Pricing & Discounts */}
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
                    <Calculator className="h-5 w-5" />
                    Preisgestaltung & Rabatte
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Price Summary */}
                    <Card className="p-4 bg-muted/50">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Gesamtpreis (vor Rabatt):</span>
                          <span className="font-medium">{formatCurrency(formData.totalPrice)}</span>
                        </div>
                        {(formData.discountAmount || 0) > 0 && (
                          <div className="flex justify-between text-destructive">
                            <span>Rabatt:</span>
                            <span>-{formatCurrency(formData.discountAmount || 0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Endpreis:</span>
                          <span>{formatCurrency(formData.finalPrice || 0)}</span>
                        </div>
                      </div>
                    </Card>

                    {/* Discount Configuration */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Rabatt anwenden (optional)
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                          label="Rabatt-Typ"
                          value={discountType}
                          onChange={(value) => setDiscountType(value as 'percentage' | 'fixed')}
                          options={[
                            { value: 'percentage', label: 'Prozent (%)' },
                            { value: 'fixed', label: 'Fester Betrag (€)' },
                          ]}
                          disabled={isSubmitting}
                        />
                        
                        <Input
                          label={`Rabatt ${discountType === 'percentage' ? '(%)' : '(€)'}`}
                          type="number"
                          step={discountType === 'percentage' ? '1' : '0.01'}
                          min="0"
                          max={discountType === 'percentage' ? '100' : formData.totalPrice.toString()}
                          value={discountValue.toString()}
                          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                        
                        <Select
                          label="Grund für Rabatt"
                          value={discountReason}
                          onChange={(value) => setDiscountReason(value)}
                          options={[
                            { value: '', label: 'Grund auswählen...' },
                            ...discountReasons
                          ]}
                          disabled={isSubmitting}
                        />
                      </div>
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

            {/* Step 4: Payment Setup */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Zahlung erfassen
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Payment Status */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">Zahlungsstatus</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { value: 'full', label: 'Vollzahlung', description: 'Kompletter Betrag wird sofort bezahlt' },
                          { value: 'partial', label: 'Teilzahlung', description: 'Teil des Betrags wird jetzt bezahlt' },
                          { value: 'later', label: 'Später zahlen', description: 'Keine Zahlung jetzt erfassen' },
                        ].map((option) => (
                          <button
                            type="button"
                            key={option.value}
                            className={clsx(
                              'p-4 cursor-pointer transition-colors rounded-lg border bg-card text-card-foreground shadow-sm pointer-events-auto select-none text-left w-full',
                              paymentStatus === option.value ? 'bg-primary/10 border-primary' : 'hover:bg-muted border-border'
                            )}
                            onClick={() => {
                              console.log('Payment option clicked:', option.value);
                              setPaymentStatus(option.value as 'full' | 'partial' | 'later');
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className={clsx(
                                'w-4 h-4 rounded-full border-2',
                                paymentStatus === option.value ? 'bg-primary border-primary' : 'border-muted-foreground'
                              )} />
                              <span className="font-medium">{option.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Details */}
                    {paymentStatus !== 'later' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Zahlungsbetrag"
                            type="number"
                            step="0.01"
                            min="0"
                            max={formData.finalPrice}
                            value={paymentAmount.toString()}
                            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                            disabled={paymentStatus === 'full' || isSubmitting}
                          />
                          
                          <Select
                            label="Zahlungsmethode"
                            value={paymentMethod}
                            onChange={(value) => setPaymentMethod(value as PaymentMethod)}
                            options={[
                              { value: 'CASH', label: 'Bargeld' },
                              { value: 'CARD', label: 'Karte' },
                              { value: 'BANK_TRANSFER', label: 'Überweisung' },
                            ]}
                            disabled={isSubmitting}
                          />
                        </div>

                        {paymentStatus === 'partial' && (
                          <Input
                            label="Anzahl bezahlter Sitzungen (optional)"
                            type="number"
                            min="0"
                            max={packageServices.reduce((sum, item) => sum + item.sessionCount, 0)}
                            value={paidSessionsCount.toString()}
                            onChange={(e) => setPaidSessionsCount(parseInt(e.target.value) || 0)}
                            disabled={isSubmitting}
                          />
                        )}

                        <div>
                          <label className="text-sm font-medium mb-2 block">Notizen zur Zahlung (optional)</label>
                          <textarea
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            disabled={isSubmitting}
                            placeholder="Zusätzliche Informationen zur Zahlung..."
                            rows={3}
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <Card className="p-4 bg-muted/50">
                      <h4 className="font-medium mb-3">Zusammenfassung</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Paket-Gesamtpreis:</span>
                          <span>{formatCurrency(formData.finalPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Jetzt zu zahlen:</span>
                          <span className="font-medium">
                            {paymentStatus === 'later' ? '€0.00' : formatCurrency(paymentAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verbleibendes Guthaben:</span>
                          <span>{formatCurrency(formData.finalPrice - (paymentStatus === 'later' ? 0 : paymentAmount))}</span>
                        </div>
                      </div>
                    </Card>

                    {errors.paymentAmount && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm">{errors.paymentAmount}</p>
                      </Alert>
                    )}
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
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {packageData ? 'Aktualisieren' : 'Paket erstellen'}
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
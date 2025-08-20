import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { appointmentService } from '@/services/appointments';
import { Appointment, PaymentMethod } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  AlertCircle, 
  Loader2, 
  CreditCard, 
  ArrowLeft, 
  CheckCircle2,
  Calendar,
  User,
  Package as PackageIcon
} from 'lucide-react';

const paymentSchema = z.object({
  amount: z.number().positive('Betrag muss positiv sein'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER'], {
    required_error: 'Zahlungsmethode auswählen'
  }),
  notes: z.string().optional()
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function AppointmentPaymentPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const appointmentIdsParam = searchParams.get('termine');
  const appointmentIds = appointmentIdsParam ? appointmentIdsParam.split(',') : [];

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: 'CASH',
      notes: ''
    }
  });

  const watchedAmount = watch('amount');

  useEffect(() => {
    if (appointmentIds.length > 0) {
      loadAppointments();
    }
  }, [appointmentIds]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all selected appointments
      const appointmentPromises = appointmentIds.map(id => 
        appointmentService.getAppointmentById(id)
      );
      
      const responses = await Promise.all(appointmentPromises);
      const loadedAppointments: Appointment[] = [];
      
      for (const response of responses) {
        if (response.success && response.data) {
          loadedAppointments.push(response.data);
        }
      }
      
      if (loadedAppointments.length === 0) {
        setError('Keine gültigen Termine gefunden');
        return;
      }
      
      setAppointments(loadedAppointments);
      
      // Calculate suggested payment amount
      const totalServicePrice = loadedAppointments.reduce(
        (sum, appointment) => sum + (appointment.service?.price || 0), 
        0
      );
      
      setValue('amount', totalServicePrice);
      
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Fehler beim Laden der Termine');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await appointmentService.markAppointmentsAsPaid({
        appointmentIds,
        payment: {
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          notes: data.notes
        }
      });
      
      if (response.success) {
        navigate('/appointments?erfolg=' + encodeURIComponent(
          `Zahlung für ${appointmentIds.length} Termin${appointmentIds.length > 1 ? 'e' : ''} erfolgreich verarbeitet`
        ));
      } else {
        setError(response.error || 'Fehler beim Verarbeiten der Zahlung');
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Fehler beim Verarbeiten der Zahlung');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/appointments');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH': return 'Bar';
      case 'CARD': return 'Karte';
      case 'BANK_TRANSFER': return 'Überweisung';
      default: return method;
    }
  };

  const totalServiceValue = appointments.reduce(
    (sum, appointment) => sum + (appointment.service?.price || 0), 
    0
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm">Termine werden geladen...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (appointmentIds.length === 0 || appointments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <h1 className="text-2xl font-bold">Zahlung verarbeiten</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Keine Termine ausgewählt</h4>
            <p className="text-sm">Es wurden keine gültigen Termine für die Zahlung gefunden.</p>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handlePaymentSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" type="button" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Zahlung verarbeiten</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Zahlung für {appointmentIds.length} Termin{appointmentIds.length > 1 ? 'e' : ''} verarbeiten
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" dismissible onDismiss={() => setError(null)}>
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Fehler</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-6">Zahlungsdetails</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <CreditCard className="h-4 w-4 inline mr-2" />
                  Betrag (€) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className={errors.amount ? 'border-red-500' : ''}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.amount.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Empfohlener Betrag: €{totalServiceValue.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Zahlungsmethode *
                </label>
                <SimpleSelect
                  {...register('paymentMethod')}
                  className={errors.paymentMethod ? 'border-red-500' : ''}
                >
                  <option value="">Zahlungsmethode auswählen</option>
                  <option value="CASH">Bar</option>
                  <option value="CARD">Karte</option>
                  <option value="BANK_TRANSFER">Überweisung</option>
                </SimpleSelect>
                {errors.paymentMethod && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.paymentMethod.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Notizen (optional)
              </label>
              <Input
                {...register('notes')}
                placeholder="Zusätzliche Notizen zur Zahlung..."
              />
            </div>

            {/* Payment Summary */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-3">Zahlungsübersicht</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Anzahl Termine:</span>
                  <span>{appointmentIds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gesamtwert der Behandlungen:</span>
                  <span>€{totalServiceValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Zahlungsbetrag:</span>
                  <span>€{watchedAmount ? Number(watchedAmount).toFixed(2) : '0.00'}</span>
                </div>
                {watchedAmount && watchedAmount !== totalServiceValue && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Differenz:</span>
                    <span className={watchedAmount > totalServiceValue ? 'text-green-600' : 'text-orange-600'}>
                      {watchedAmount > totalServiceValue ? '+' : ''}€{Number(watchedAmount - totalServiceValue).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 mt-6">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verarbeite...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Zahlung verarbeiten
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Appointment List Sidebar */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Ausgewählte Termine</h3>
            
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="pb-4 border-b border-border last:border-b-0">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {appointment.patient?.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(appointment.scheduledDate)} um {formatTime(appointment.startTime)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-sm">{appointment.service?.name}</div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          {appointment.service?.duration} Min
                        </p>
                        <p className="text-xs font-medium">
                          €{appointment.service?.price ? Number(appointment.service.price).toFixed(2) : '0.00'}
                        </p>
                      </div>
                    </div>

                    {appointment.package && (
                      <div className="flex items-start gap-2">
                        <PackageIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">
                            {appointment.package.name}
                          </p>
                          <Badge variant={
                            appointment.package.paymentStatus === 'COMPLETED' ? 'success' :
                            appointment.package.paymentStatus === 'PARTIALLY_PAID' ? 'warning' : 'destructive'
                          } className="text-xs mt-1">
                            {appointment.package.paymentStatus === 'COMPLETED' ? 'Vollzahlung' :
                             appointment.package.paymentStatus === 'PARTIALLY_PAID' ? 'Teilzahlung' : 'Nicht bezahlt'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between font-medium">
                <span>Gesamtsumme:</span>
                <span>€{totalServiceValue.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
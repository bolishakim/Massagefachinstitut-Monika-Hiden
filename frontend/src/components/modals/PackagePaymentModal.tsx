import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ServicePackage, PaymentMethod, Appointment } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { Alert } from '@/components/ui/Alert';
import { CreditCard, AlertCircle, Loader2 } from 'lucide-react';

const paymentSchema = z.object({
  amount: z.string()
    .min(1, 'Betrag ist erforderlich')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Betrag muss größer als 0 sein'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER'], {
    required_error: 'Zahlungsmethode auswählen'
  }),
  paidSessionsCount: z.string().optional(),
  notes: z.string().optional()
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PackagePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  package: ServicePackage | null;
  appointment?: Appointment | null; // Optional appointment context
  onSubmit: (packageId: string, data: {
    amount: number;
    paymentMethod: PaymentMethod;
    paidSessionsCount?: number;
    notes?: string;
  }) => Promise<void>;
}

export function PackagePaymentModal({
  isOpen,
  onClose,
  package: pkg,
  appointment,
  onSubmit
}: PackagePaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: '',
      paymentMethod: 'CASH',
      paidSessionsCount: '',
      notes: ''
    }
  });

  // Calculate single appointment amount when in appointment context
  const singleAppointmentAmount = pkg && appointment ? 
    Number(pkg.finalPrice) / pkg.totalSessions : 0;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset();
      setError(null);
      
      // Set defaults for appointment context
      if (appointment && pkg) {
        // Default to single appointment amount and 1 session
        setValue('amount', singleAppointmentAmount.toFixed(2).replace('.', ','));
        setValue('paidSessionsCount', '1');
      }
    }
  }, [isOpen, reset, appointment, pkg, singleAppointmentAmount, setValue]);

  // Calculate remaining amount when package changes
  const remainingAmount = pkg ? Number(pkg.finalPrice) - Number(pkg.totalPaid) : 0;
  const remainingSessions = pkg ? pkg.totalSessions - pkg.usedSessions : 0;

  const handleFormSubmit = async (data: PaymentFormData) => {
    if (!pkg) return;

    try {
      setLoading(true);
      setError(null);

      const amount = parseFloat(data.amount.replace(',', '.'));
      const paidSessions = data.paidSessionsCount 
        ? parseInt(data.paidSessionsCount) 
        : undefined;

      await onSubmit(pkg.id, {
        amount,
        paymentMethod: data.paymentMethod,
        paidSessionsCount: paidSessions,
        notes: data.notes
      });

      onClose();
    } catch (err) {
      console.error('Payment error:', err);
      setError('Fehler beim Hinzufügen der Zahlung');
    } finally {
      setLoading(false);
    }
  };

  const handleFullPayment = () => {
    setValue('amount', remainingAmount.toFixed(2).replace('.', ','));
    setValue('paidSessionsCount', remainingSessions.toString());
  };

  const handlePartialPayment = () => {
    const halfAmount = remainingAmount / 2;
    setValue('amount', halfAmount.toFixed(2).replace('.', ','));
    
    const halfSessions = Math.floor(remainingSessions / 2);
    setValue('paidSessionsCount', halfSessions.toString());
  };

  const handleSingleAppointmentPayment = () => {
    if (pkg) {
      setValue('amount', singleAppointmentAmount.toFixed(2).replace('.', ','));
      setValue('paidSessionsCount', '1');
    }
  };

  if (!pkg) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" className="max-w-xl max-h-[90vh] overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Zahlung hinzufügen</h2>
            <p className="text-xs text-gray-500">
              {appointment 
                ? 'Zahlung für einzelnen Termin erfassen'
                : 'Neue Zahlung für das Servicepaket erfassen'
              }
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Appointment Context Info */}
          {appointment && (
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 p-3 rounded-lg shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                🎯 Termin-Kontext
              </h3>
              <div className="text-xs text-gray-600">
                <p><strong>Patient:</strong> {appointment.patient?.firstName} {appointment.patient?.lastName}</p>
                <p><strong>Service:</strong> {appointment.service?.name}</p>
                <p><strong>Datum:</strong> {new Date(appointment.scheduledDate).toLocaleDateString('de-DE')}</p>
                <p className="mt-1 text-green-700 font-medium">
                  💡 Standard: €{singleAppointmentAmount.toFixed(2)} für 1 Sitzung
                </p>
              </div>
            </div>
          )}

          {/* Package Info */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Paket-Übersicht
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Paket</div>
                  <div className="text-sm font-semibold text-gray-900">{pkg.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Bereits bezahlt</div>
                  <div className="text-sm font-bold text-green-600">€ {Number(pkg.totalPaid).toFixed(2)}</div>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Gesamtpreis</div>
                  <div className="text-sm font-semibold text-gray-900">€ {Number(pkg.finalPrice).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Offener Betrag</div>
                  <div className="text-lg font-bold text-orange-600">€ {remainingAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Schnelle Aktionen</h4>
            <div className="flex gap-2">
              {appointment && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSingleAppointmentPayment}
                  className="flex-1 bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800 text-xs"
                >
                  🎯 Einzeltermin (€{singleAppointmentAmount.toFixed(2)})
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFullPayment}
                disabled={remainingAmount <= 0 || !!appointment}
                className={`flex-1 ${
                  appointment ? 'opacity-50 cursor-not-allowed' : 'bg-white hover:bg-blue-50'
                } border-blue-200 text-blue-700 hover:text-blue-800 text-xs`}
              >
                💳 Vollzahlung
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePartialPayment}
                disabled={remainingAmount <= 0 || !!appointment}
                className={`flex-1 ${
                  appointment ? 'opacity-50 cursor-not-allowed' : 'bg-white hover:bg-orange-50'
                } border-orange-200 text-orange-700 hover:text-orange-800 text-xs`}
              >
                📋 Teilzahlung (50%)
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg space-y-3">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Zahlungsdetails</h4>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {appointment ? 'Betrag * (€) - Einzeltermin' : 'Betrag * (€)'}
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium text-xs">€</span>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={watch('amount')}
                    onChange={(e) => setValue('amount', e.target.value)}
                    disabled={!!appointment}
                    className={`pl-6 text-right font-medium ${
                      appointment ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-900'
                    } ${errors.amount ? 'border-red-500 focus:ring-red-200 dark:border-red-400 dark:focus:ring-red-800' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-200 dark:focus:ring-blue-800'} text-gray-900 dark:text-gray-100`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Zahlungsmethode *
                </label>
                <SimpleSelect
                  value={watch('paymentMethod')}
                  onChange={(e) => setValue('paymentMethod', e.target.value)}
                  className={`bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${errors.paymentMethod ? 'border-red-500 focus:ring-red-200 dark:border-red-400 dark:focus:ring-red-800' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-200 dark:focus:ring-blue-800'}`}
                >
                  <option value="CASH">💵 Bar</option>
                  <option value="CARD">💳 Karte</option>
                  <option value="BANK_TRANSFER">🏦 Überweisung</option>
                </SimpleSelect>
                {errors.paymentMethod && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.paymentMethod.message}
                  </p>
                )}
              </div>
            </div>

            {/* Paid Sessions Count */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {appointment ? 'Bezahlte Sitzungen - Einzeltermin' : 'Bezahlte Sitzungen (optional)'}
              </label>
              <Input
                type="number"
                min="0"
                max={remainingSessions}
                placeholder={`Max. ${remainingSessions} Sitzungen`}
                value={watch('paidSessionsCount')}
                onChange={(e) => setValue('paidSessionsCount', e.target.value)}
                disabled={!!appointment}
                className={`${
                  appointment ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-900'
                } border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-200 dark:focus:ring-blue-800 text-gray-900 dark:text-gray-100`}
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {appointment 
                  ? 'Für Einzeltermin automatisch auf 1 Sitzung gesetzt'
                  : 'Geben Sie an, wie viele Sitzungen diese Zahlung abdeckt'
                }
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Notizen (optional)
              </label>
              <Input
                multiline
                rows={2}
                placeholder="Zusätzliche Informationen zur Zahlung..."
                value={watch('notes')}
                onChange={(e) => setValue('notes', e.target.value)}
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-200 dark:focus:ring-blue-800 text-gray-900 dark:text-gray-100 resize-none"
              />
              {appointment && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Termindetails werden automatisch zu den Notizen hinzugefügt
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 text-xs">Fehler</h4>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 font-medium text-sm"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading || remainingAmount <= 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <CreditCard className="h-3 w-3 mr-2" />
                  Zahlung hinzufügen
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
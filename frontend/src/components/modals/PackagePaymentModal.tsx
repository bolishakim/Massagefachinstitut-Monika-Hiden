import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ServicePackage, PaymentMethod } from '@/types';
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset();
      setError(null);
    }
  }, [isOpen, reset]);

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

  if (!pkg) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Zahlung hinzufügen" size="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Package Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-600" />
            Paket-Übersicht
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Paket</div>
              <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Gesamtpreis</div>
              <div className="text-sm font-medium text-gray-900">€ {Number(pkg.finalPrice).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Bereits bezahlt</div>
              <div className="text-sm font-medium text-green-600">€ {Number(pkg.totalPaid).toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Offener Betrag</div>
              <div className="text-lg font-bold text-orange-600">€ {remainingAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFullPayment}
            disabled={remainingAmount <= 0}
            className="flex-1 max-w-[140px]"
          >
            Vollzahlung
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePartialPayment}
            disabled={remainingAmount <= 0}
            className="flex-1 max-w-[140px]"
          >
            Teilzahlung (50%)
          </Button>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Betrag * (€)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">€</span>
              <Input
                type="text"
                placeholder="0,00"
                value={watch('amount')}
                onChange={(e) => setValue('amount', e.target.value)}
                className={`pl-8 text-right font-medium ${errors.amount ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Zahlungsmethode *
            </label>
            <SimpleSelect
              value={watch('paymentMethod')}
              onChange={(e) => setValue('paymentMethod', e.target.value)}
              className={`${errors.paymentMethod ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bezahlte Sitzungen (optional)
          </label>
          <Input
            type="number"
            min="0"
            max={remainingSessions}
            placeholder={`Max. ${remainingSessions} Sitzungen`}
            value={watch('paidSessionsCount')}
            onChange={(e) => setValue('paidSessionsCount', e.target.value)}
            className="border-gray-300 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Geben Sie an, wie viele Sitzungen diese Zahlung abdeckt
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Notizen (optional)
          </label>
          <Input
            multiline
            rows={3}
            placeholder="Zusätzliche Informationen zur Zahlung..."
            value={watch('notes')}
            onChange={(e) => setValue('notes', e.target.value)}
            className="border-gray-300 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">Fehler</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2"
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            disabled={loading || remainingAmount <= 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Zahlung hinzufügen
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
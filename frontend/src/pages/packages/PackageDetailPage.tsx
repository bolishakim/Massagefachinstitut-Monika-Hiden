import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packageService } from '@/services/packages';
import { ServicePackage } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft,
  Package,
  User,
  Phone,
  Calendar,
  Euro,
  CreditCard,
  Clock,
  Activity,
  Edit,
  Ban,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [packageData, setPackageData] = useState<ServicePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isLoading: false,
  });

  const loadPackageData = async () => {
    if (!id) {
      setError('Ungültige Paket-ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await packageService.getPackageById(id);
      
      if (response.success && response.data) {
        setPackageData(response.data);
      } else {
        setError(response.error || 'Paket nicht gefunden');
      }
    } catch (err) {
      console.error('Error loading package data:', err);
      setError('Fehler beim Laden der Paketdaten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackageData();
  }, [id]);

  const handleBack = () => {
    navigate('/packages');
  };

  const handleEdit = () => {
    navigate(`/packages/${id}/edit`);
  };

  const handleCancelPackage = () => {
    if (!packageData) return;

    setConfirmationModal({
      isOpen: true,
      title: 'Paket stornieren',
      message: `Sind Sie sicher, dass Sie das Paket "${packageData.name}" für ${packageData.patient.firstName} ${packageData.patient.lastName} stornieren möchten?`,
      onConfirm: confirmCancelPackage,
      isLoading: false,
    });
  };

  const confirmCancelPackage = async () => {
    if (!packageData) return;

    try {
      setConfirmationModal(prev => ({ ...prev, isLoading: true }));

      const response = await packageService.cancelPackage(packageData.id);
      
      if (response.success) {
        setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        setSuccessMessage('Paket erfolgreich storniert');
        // Reload package data to reflect changes
        await loadPackageData();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        setError(response.error || 'Fehler beim Stornieren des Pakets');
      }
    } catch (err) {
      console.error('Error cancelling package:', err);
      setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
      setError('Fehler beim Stornieren des Pakets');
    }
  };

  const handleAddPayment = () => {
    // TODO: Implement payment modal
    console.log('Add payment for package:', packageData?.id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-AT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Aktiv';
      case 'COMPLETED':
        return 'Abgeschlossen';
      case 'CANCELLED':
        return 'Storniert';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Lade Paketdaten...</span>
        </div>
      </div>
    );
  }

  if (error && !packageData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Pakete
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Fehler</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Pakete
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Paket nicht gefunden</h4>
            <p className="text-sm">Das angeforderte Paket existiert nicht oder wurde gelöscht.</p>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Pakete
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          {packageData.status === 'ACTIVE' && (
            <>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
              <Button variant="destructive" onClick={handleCancelPackage}>
                <Ban className="h-4 w-4 mr-2" />
                Stornieren
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" dismissible onDismiss={() => setSuccessMessage(null)}>
          <CheckCircle2 className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Erfolg</h4>
            <p className="text-sm">{successMessage}</p>
          </div>
        </Alert>
      )}

      {/* Error Message */}
      {error && packageData && (
        <Alert variant="destructive" dismissible onDismiss={() => setError(null)}>
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Fehler</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {/* Package Overview */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{packageData.name}</h1>
              <p className="text-muted-foreground">Paket-ID: {packageData.id}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(packageData.status)}>
              {getStatusLabel(packageData.status)}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Erstellt am {formatDate(packageData.createdAt)}
            </p>
          </div>
        </div>

        {/* Patient Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient
            </h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Name:</span> {packageData.patient.firstName} {packageData.patient.lastName}
              </p>
              <p className="text-sm flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {packageData.patient.phone}
              </p>
              {packageData.patient.insuranceType && (
                <p className="text-sm">
                  <span className="font-medium">Versicherung:</span> {packageData.patient.insuranceType}
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Preisübersicht
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gesamtpreis:</span>
                <span>{formatCurrency(Number(packageData.totalPrice))}</span>
              </div>
              {packageData.discountAmount && Number(packageData.discountAmount) > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Rabatt:</span>
                  <span>-{formatCurrency(Number(packageData.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Endpreis:</span>
                <span>{formatCurrency(Number(packageData.finalPrice))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{packageData.totalSessions}</div>
            <div className="text-sm text-muted-foreground">Gesamt Sitzungen</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{packageData.usedSessions}</div>
            <div className="text-sm text-muted-foreground">Genutzt</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{packageData.remainingSessions}</div>
            <div className="text-sm text-muted-foreground">Verbleibend</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{packageData.usagePercentage}%</div>
            <div className="text-sm text-muted-foreground">Nutzung</div>
          </div>
        </div>
      </Card>

      {/* Package Items */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Paket Services
        </h3>
        <div className="space-y-4">
          {packageData.packageItems.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{item.service?.name || 'Service nicht gefunden'}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.sessionCount} Sitzung{item.sessionCount !== 1 ? 'en' : ''} • 
                  {item.completedCount} abgeschlossen • 
                  {item.sessionCount - item.completedCount} verbleibend
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatCurrency(Number(item.service?.price || 0))} pro Sitzung
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(Number(item.service?.price || 0) * item.sessionCount)} gesamt
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment History */}
      {packageData.payments && packageData.payments.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Zahlungshistorie
            </h3>
            {packageData.status === 'ACTIVE' && (
              <Button variant="outline" size="sm" onClick={handleAddPayment}>
                <Plus className="h-4 w-4 mr-2" />
                Zahlung hinzufügen
              </Button>
            )}
          </div>
          <div className="space-y-4">
            {packageData.payments.map((payment, index) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(Number(payment.amount))}</span>
                    <Badge variant="secondary" className="text-xs">
                      {payment.paymentMethod}
                    </Badge>
                    <Badge 
                      className={`text-xs ${
                        payment.status === 'COMPLETED' 
                          ? 'bg-green-500/10 text-green-700' 
                          : 'bg-yellow-500/10 text-yellow-700'
                      }`}
                    >
                      {payment.status}
                    </Badge>
                  </div>
                  {payment.paidSessionsCount && (
                    <p className="text-sm text-muted-foreground">
                      Für {payment.paidSessionsCount} Sitzung{payment.paidSessionsCount !== 1 ? 'en' : ''}
                    </p>
                  )}
                  {payment.notes && (
                    <p className="text-sm text-muted-foreground">{payment.notes}</p>
                  )}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {payment.paidAt ? formatDate(payment.paidAt) : 'Ausstehend'}
                  </div>
                  {payment.createdBy && (
                    <p>von {payment.createdBy.firstName} {payment.createdBy.lastName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Payment Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Gesamt bezahlt:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(packageData.totalPaid)}
              </span>
            </div>
            {packageData.remainingBalance !== undefined && packageData.remainingBalance > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-muted-foreground">Ausstehend:</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(packageData.remainingBalance)}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText="Stornieren"
        cancelText="Abbrechen"
        variant="danger"
        isLoading={confirmationModal.isLoading}
      />
    </div>
  );
}
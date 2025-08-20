import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentService } from '@/services/appointments';
import { Appointment } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { H1, H2, H3, TextSM, TextXS } from '@/components/ui/Typography';
import { 
  AlertCircle, 
  Loader2, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Package as PackageIcon,
  FileText,
  CreditCard,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function AppointmentDetailPage() {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const successParam = searchParams.get('erfolg');

  useEffect(() => {
    if (id) {
      loadAppointment(id);
    }
  }, [id]);

  useEffect(() => {
    if (successParam) {
      setSuccessMessage(decodeURIComponent(successParam));
    }
  }, [successParam]);

  const loadAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await appointmentService.getAppointmentById(appointmentId);
      
      if (response.success && response.data) {
        setAppointment(response.data);
      } else {
        setError('Termin nicht gefunden');
      }
    } catch (err) {
      console.error('Error loading appointment:', err);
      setError('Fehler beim Laden des Termins');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/appointments/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!appointment || !window.confirm(
      `Möchten Sie den Termin für ${appointment.patient?.firstName} ${appointment.patient?.lastName} wirklich absagen?`
    )) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await appointmentService.deleteAppointment(appointment.id);
      
      if (response.success) {
        navigate('/appointments?erfolg=' + encodeURIComponent('Termin erfolgreich abgesagt'));
      } else {
        setError('Fehler beim Absagen des Termins');
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError('Fehler beim Absagen des Termins');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!appointment) return;

    try {
      setActionLoading(true);
      const response = await appointmentService.completeAppointment(
        appointment.id, 
        'Termin abgeschlossen'
      );
      
      if (response.success) {
        setSuccessMessage('Termin als abgeschlossen markiert');
        await loadAppointment(appointment.id);
      } else {
        setError('Fehler beim Abschließen des Termins');
      }
    } catch (err) {
      console.error('Error completing appointment:', err);
      setError('Fehler beim Abschließen des Termins');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = () => {
    navigate(`/appointments/${id}/verschieben`);
  };

  const handleMarkAsPaid = () => {
    navigate(`/appointments/zahlung?termine=${id}`);
  };

  const handleViewPatient = () => {
    if (appointment?.patient) {
      navigate(`/patients/${appointment.patient.id}`);
    }
  };

  const handleViewPackage = () => {
    if (appointment?.package) {
      navigate(`/packages/${appointment.package.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // "14:00" from "14:00:00"
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Geplant</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Abgeschlossen</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Abgesagt</Badge>;
      case 'NO_SHOW':
        return <Badge variant="warning">Nicht erschienen</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
  const canDelete = user?.role === 'ADMIN';

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <TextSM>Termin wird geladen...</TextSM>
          </div>
        </div>
      </Card>
    );
  }

  if (error && !appointment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/appointments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <H1>Termindetails</H1>
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

  if (!appointment) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/appointments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Terminen
          </Button>
          <div>
            <H1>Termindetails</H1>
            <TextSM className="text-muted-foreground mt-1">
              {appointment.patient?.firstName} {appointment.patient?.lastName} - {appointment.service?.name}
            </TextSM>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {appointment.status === 'SCHEDULED' && canEdit && (
            <>
              <Button variant="outline" size="sm" onClick={handleReschedule} disabled={actionLoading}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Verschieben
              </Button>
              <Button variant="outline" size="sm" onClick={handleComplete} disabled={actionLoading}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Abschließen
              </Button>
            </>
          )}
          {canEdit && (
            <Button variant="outline" size="sm" onClick={handleEdit} disabled={actionLoading}>
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={actionLoading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Absagen
            </Button>
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
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Details */}
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <H2>Termindetails</H2>
              {getStatusBadge(appointment.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Datum</div>
                    <TextSM className="text-muted-foreground">
                      {formatDate(appointment.scheduledDate)}
                    </TextSM>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Zeit</div>
                    <TextSM className="text-muted-foreground">
                      {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      <TextXS as="span" className="block text-muted-foreground">
                        ({appointment.service?.duration} Minuten)
                      </TextXS>
                    </TextSM>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Behandlung</div>
                    <TextSM className="text-muted-foreground">
                      {appointment.service?.name}
                    </TextSM>
                    <TextXS className="text-muted-foreground">
                      €{appointment.service?.price ? Number(appointment.service.price).toFixed(2) : '0.00'} - {appointment.service?.duration} Min
                    </TextXS>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Therapeut</div>
                    <TextSM className="text-muted-foreground">
                      {appointment.staff?.firstName} {appointment.staff?.lastName}
                    </TextSM>
                    <TextXS className="text-muted-foreground">
                      {appointment.staff?.specialization}
                    </TextXS>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Raum</div>
                    <TextSM className="text-muted-foreground">
                      {appointment.room?.name}
                    </TextSM>
                    {appointment.room?.description && (
                      <TextXS className="text-muted-foreground">
                        {appointment.room.description}
                      </TextXS>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {appointment.notes && (
              <div className="mt-6 pt-6 border-t">
                <H3 className="text-sm mb-2">Notizen</H3>
                <TextSM className="text-muted-foreground whitespace-pre-wrap">
                  {appointment.notes}
                </TextSM>
              </div>
            )}

            {appointment.hasConflict && (
              <Alert variant="warning" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <div>
                  <h4 className="font-medium">Terminkonflikt erkannt</h4>
                  <p className="text-sm">
                    {appointment.conflictReason || 'Es gibt einen Konflikt mit anderen Terminen.'}
                  </p>
                </div>
              </Alert>
            )}
          </Card>

          {/* Patient History */}
          {appointment.patientHistory && appointment.patientHistory.length > 0 && (
            <Card className="p-6">
              <H2 className="mb-4">Krankengeschichte</H2>
              {appointment.patientHistory.map((history) => (
                <div key={history.id} className="mb-4 last:mb-0">
                  <div className="text-sm text-muted-foreground mb-2">
                    Aufgenommen am: {new Date(history.recordedAt).toLocaleDateString('de-DE')}
                  </div>
                  {history.mainSubjectiveProblem && (
                    <div className="mb-2">
                      <strong>Hauptproblem:</strong> {history.mainSubjectiveProblem}
                    </div>
                  )}
                  {history.notes && (
                    <div className="text-muted-foreground">
                      <strong>Notizen:</strong> {history.notes}
                    </div>
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Card */}
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <H3>Patient</H3>
              <Button variant="outline" size="sm" onClick={handleViewPatient}>
                Details anzeigen
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="font-medium">
                  {appointment.patient?.firstName} {appointment.patient?.lastName}
                </div>
                {appointment.patient?.phone && (
                  <TextSM className="text-muted-foreground">
                    {appointment.patient.phone}
                  </TextSM>
                )}
                {appointment.patient?.email && (
                  <TextSM className="text-muted-foreground">
                    {appointment.patient.email}
                  </TextSM>
                )}
              </div>
            </div>
          </Card>

          {/* Package Card */}
          {appointment.package && (
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <H3>Paket</H3>
                <Button variant="outline" size="sm" onClick={handleViewPackage}>
                  Details anzeigen
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="font-medium">{appointment.package.name}</div>
                  <TextSM className="text-muted-foreground">
                    €{appointment.package.finalPrice ? Number(appointment.package.finalPrice).toFixed(2) : '0.00'}
                  </TextSM>
                </div>

                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Zahlungsstatus:</span>
                    <Badge variant={
                      appointment.package.paymentStatus === 'COMPLETED' ? 'success' :
                      appointment.package.paymentStatus === 'PARTIALLY_PAID' ? 'warning' : 'destructive'
                    }>
                      {appointment.package.paymentStatus === 'COMPLETED' ? 'Vollzahlung' :
                       appointment.package.paymentStatus === 'PARTIALLY_PAID' ? 'Teilzahlung' : 'Nicht bezahlt'}
                    </Badge>
                  </div>
                </div>

                {appointment.package.packageItems && (
                  <div>
                    <TextXS className="text-muted-foreground mb-2">Verbleibende Sitzungen:</TextXS>
                    {appointment.package.packageItems.map((item) => (
                      <div key={item.service?.id} className="flex justify-between text-sm">
                        <span>{item.service?.name}</span>
                        <span>{item.sessionCount - item.completedCount} von {item.sessionCount}</span>
                      </div>
                    ))}
                  </div>
                )}

                {appointment.package.paymentStatus !== 'COMPLETED' && (
                  <Button variant="outline" size="sm" onClick={handleMarkAsPaid} className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Als bezahlt markieren
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Payment History */}
          {appointment.package?.payments && appointment.package.payments.length > 0 && (
            <Card className="p-6">
              <H3 className="mb-4">Zahlungshistorie</H3>
              <div className="space-y-3">
                {appointment.package.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">
                        €{payment.amount ? Number(payment.amount).toFixed(2) : '0.00'}
                      </div>
                      <TextXS className="text-muted-foreground">
                        {payment.paidAt && new Date(payment.paidAt).toLocaleDateString('de-DE')}
                      </TextXS>
                    </div>
                    <Badge variant={payment.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {payment.status === 'COMPLETED' ? 'Bezahlt' : payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
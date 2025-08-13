import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  CreditCard, 
  FileText, 
  Clock, 
  Package,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  Plus,
  History,
  Activity,
  Shield,
  Download,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Patient, InsuranceType, Appointment, Package as PatientPackage, PatientHistory, Payment } from '@/types';
import { clsx } from 'clsx';

interface PatientDetailProps {
  patient: Patient;
  appointments?: Appointment[];
  packages?: PatientPackage[];
  history?: PatientHistory[];
  payments?: Payment[];
  onBack?: () => void;
  onEdit?: (patient: Patient) => void;
  onScheduleAppointment?: (patient: Patient) => void;
  onCreatePackage?: (patient: Patient) => void;
  onAddHistory?: (patient: Patient) => void;
  onExportPatientData?: (patient: Patient) => void;
  onHardDeletePatient?: (patient: Patient) => void;
  className?: string;
  loading?: boolean;
  userRole?: string;
}

type TabType = 'overview' | 'appointments' | 'packages' | 'history' | 'payments';

export function PatientDetail({
  patient,
  appointments = [],
  packages = [],
  history = [],
  payments = [],
  onBack,
  onEdit,
  onScheduleAppointment,
  onCreatePackage,
  onAddHistory,
  onExportPatientData,
  onHardDeletePatient,
  className,
  loading = false,
  userRole
}: PatientDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Calculate patient age
  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getInsuranceTypeLabel = (type: InsuranceType | undefined): string => {
    switch (type) {
      case InsuranceType.PUBLIC_INSURANCE:
        return 'Gesetzliche Krankenversicherung';
      case InsuranceType.PRIVATE_INSURANCE:
        return 'Private Krankenversicherung';
      case InsuranceType.SELF_PAY:
        return 'Selbstzahler';
      default:
        return 'Nicht angegeben';
    }
  };

  const getInsuranceColor = (type: InsuranceType | undefined): string => {
    switch (type) {
      case InsuranceType.PUBLIC_INSURANCE:
        return 'bg-blue-100 text-blue-800';
      case InsuranceType.PRIVATE_INSURANCE:
        return 'bg-green-100 text-green-800';
      case InsuranceType.SELF_PAY:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentStatusColor = (status: string): string => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPackageStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.scheduledDate) > new Date() && apt.status === 'SCHEDULED'
  ).slice(0, 3);

  const recentAppointments = appointments.filter(apt => 
    apt.status === 'COMPLETED'
  ).sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()).slice(0, 5);

  const activePackages = packages.filter(pkg => pkg.status === 'ACTIVE');
  const recentHistory = history.sort((a, b) => 
    new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  ).slice(0, 3);

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: User },
    { id: 'appointments', label: 'Termine', icon: Calendar, count: appointments.length },
    { id: 'packages', label: 'Pakete', icon: Package, count: packages.length },
    { id: 'history', label: 'Verlauf', icon: History, count: history.length },
    { id: 'payments', label: 'Zahlungen', icon: CreditCard, count: payments.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-4">
            <Avatar
              src={patient.avatar}
              alt={`${patient.firstName} ${patient.lastName}`}
              size="lg"
              fallback={`${patient.firstName[0]}${patient.lastName[0]}`}
            />
            <div>
              <h1 className="text-2xl font-bold">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Patient-ID: {patient.id.slice(-8).toUpperCase()}</span>
                {patient.dateOfBirth && (
                  <span>{calculateAge(patient.dateOfBirth)} Jahre alt</span>
                )}
                <Badge 
                  variant={patient.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {patient.isActive ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onScheduleAppointment && (
            <Button onClick={() => onScheduleAppointment(patient)}>
              <Calendar className="h-4 w-4 mr-2" />
              Termin buchen
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(patient)}>
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={clsx(
                'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
              {tab.count !== undefined && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Patient Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Kontaktinformationen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon</p>
                        <p className="font-medium">{patient.phone}</p>
                      </div>
                    </div>
                    {patient.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">E-Mail</p>
                          <p className="font-medium">{patient.email}</p>
                        </div>
                      </div>
                    )}
                    {patient.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Adresse</p>
                          <p className="font-medium">{patient.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {patient.dateOfBirth && (
                      <div>
                        <p className="text-sm text-muted-foreground">Geburtsdatum</p>
                        <p className="font-medium">
                          {new Date(patient.dateOfBirth).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    )}
                    {patient.socialInsuranceNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">Sozialversicherungsnummer</p>
                        <p className="font-medium">{patient.socialInsuranceNumber}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Versicherung</p>
                      <Badge className={clsx('text-xs', getInsuranceColor(patient.insuranceType))}>
                        {getInsuranceTypeLabel(patient.insuranceType)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Medical Information */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Medizinische Informationen
                  </h3>
                  {onAddHistory && (
                    <Button variant="outline" size="sm" onClick={() => onAddHistory(patient)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Eintrag hinzufügen
                    </Button>
                  )}
                </div>
                
                {patient.doctorReferral && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Überweisender Arzt</p>
                    <p className="font-medium">{patient.doctorReferral}</p>
                  </div>
                )}

                {patient.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Notizen</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md mt-1">{patient.notes}</p>
                  </div>
                )}

                {recentHistory.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Letzte Einträge</p>
                    <div className="space-y-2">
                      {recentHistory.map((entry) => (
                        <div key={entry.id} className="text-sm border-l-2 border-primary/20 pl-3">
                          <p className="font-medium">{entry.generalImpression || 'Allgemeine Beurteilung'}</p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(entry.recordedAt).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Upcoming Appointments */}
              {upcomingAppointments.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Nächste Termine
                  </h3>
                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div>
                          <p className="font-medium">{appointment.service?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appointment.scheduledDate).toLocaleDateString('de-DE')} um {appointment.startTime}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            mit {appointment.staff?.firstName} {appointment.staff?.lastName}
                          </p>
                        </div>
                        <Badge className={getAppointmentStatusColor(appointment.status)}>
                          Geplant
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Active Packages */}
              {activePackages.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Aktive Pakete
                    </h3>
                    {onCreatePackage && (
                      <Button variant="outline" size="sm" onClick={() => onCreatePackage(patient)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {activePackages.map((pkg) => (
                      <div key={pkg.id} className="p-3 border border-border rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{pkg.name}</p>
                          <Badge className={getPackageStatusColor(pkg.status)}>
                            Aktiv
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Gesamtpreis: €{pkg.finalPrice}</p>
                          <p>Erstellt: {new Date(pkg.createdAt).toLocaleDateString('de-DE')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* GDPR Actions - Admin only */}
              {userRole === 'ADMIN' && (onExportPatientData || onHardDeletePatient) && (
                <Card className="p-6 border-orange-200 bg-orange-50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-800">
                    <Shield className="h-5 w-5" />
                    GDPR Datenschutz
                  </h3>
                  <div className="space-y-3">
                    {onExportPatientData && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start border-orange-300 text-orange-700 hover:bg-orange-100"
                        onClick={() => onExportPatientData(patient)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Patientendaten exportieren
                      </Button>
                    )}
                    {onHardDeletePatient && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => onHardDeletePatient(patient)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Alle Daten permanent löschen
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-orange-100 rounded-md">
                    <p className="text-xs text-orange-700">
                      <strong>GDPR Artikel 17:</strong> Permanente Löschung entfernt alle Patientendaten unwiderruflich aus dem System. Diese Aktion überschreibt die 30-jährige medizinische Aufbewahrungspflicht bei rechtmäßiger Anfrage.
                    </p>
                  </div>
                </Card>
              )}

              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Statistiken
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Termine gesamt</span>
                    <span className="font-medium">{appointments.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Abgeschlossen</span>
                    <span className="font-medium">
                      {appointments.filter(a => a.status === 'COMPLETED').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pakete</span>
                    <span className="font-medium">{packages.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Zahlungen</span>
                    <span className="font-medium">
                      €{payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Seit</span>
                    <span className="font-medium">
                      {new Date(patient.createdAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'appointments' && (
          <motion.div
            key="appointments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Terminverlauf</h3>
                {onScheduleAppointment && (
                  <Button onClick={() => onScheduleAppointment(patient)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neuer Termin
                  </Button>
                )}
              </div>
              
              {appointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">Keine Termine</h4>
                  <p className="text-muted-foreground mb-4">
                    Dieser Patient hat noch keine Termine.
                  </p>
                  {onScheduleAppointment && (
                    <Button onClick={() => onScheduleAppointment(patient)}>
                      Ersten Termin buchen
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments
                    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
                    .map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border border-border rounded-md">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Stethoscope className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{appointment.service?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(appointment.scheduledDate).toLocaleDateString('de-DE')} um {appointment.startTime}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              mit {appointment.staff?.firstName} {appointment.staff?.lastName} in {appointment.room?.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getAppointmentStatusColor(appointment.status)}>
                            {appointment.status === 'SCHEDULED' && 'Geplant'}
                            {appointment.status === 'COMPLETED' && 'Abgeschlossen'}
                            {appointment.status === 'CANCELLED' && 'Abgesagt'}
                            {appointment.status === 'NO_SHOW' && 'Nicht erschienen'}
                          </Badge>
                          {appointment.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Notiz vorhanden
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === 'packages' && (
          <motion.div
            key="packages"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Behandlungspakete</h3>
                {onCreatePackage && (
                  <Button onClick={() => onCreatePackage(patient)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neues Paket
                  </Button>
                )}
              </div>
              
              {packages.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">Keine Pakete</h4>
                  <p className="text-muted-foreground mb-4">
                    Dieser Patient hat noch keine Behandlungspakete.
                  </p>
                  {onCreatePackage && (
                    <Button onClick={() => onCreatePackage(patient)}>
                      Erstes Paket erstellen
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="border border-border rounded-md p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{pkg.name}</h4>
                        <Badge className={getPackageStatusColor(pkg.status)}>
                          {pkg.status === 'ACTIVE' && 'Aktiv'}
                          {pkg.status === 'COMPLETED' && 'Abgeschlossen'}
                          {pkg.status === 'CANCELLED' && 'Storniert'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Gesamtpreis</p>
                          <p className="font-medium">€{pkg.totalPrice}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rabatt</p>
                          <p className="font-medium">€{pkg.discountAmount || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Endpreis</p>
                          <p className="font-medium">€{pkg.finalPrice}</p>
                        </div>
                      </div>
                      
                      {pkg.packageItems && pkg.packageItems.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm font-medium mb-2">Leistungen</p>
                          <div className="space-y-2">
                            {pkg.packageItems.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.service?.name || 'Unbekannte Leistung'}</span>
                                <span>{item.completedCount}/{item.sessionCount} Sitzungen</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-3">
                        Erstellt: {new Date(pkg.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Krankengeschichte</h3>
                {onAddHistory && (
                  <Button onClick={() => onAddHistory(patient)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Eintrag hinzufügen
                  </Button>
                )}
              </div>
              
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">Keine Einträge</h4>
                  <p className="text-muted-foreground mb-4">
                    Es gibt noch keine medizinischen Einträge für diesen Patienten.
                  </p>
                  {onAddHistory && (
                    <Button onClick={() => onAddHistory(patient)}>
                      Ersten Eintrag hinzufügen
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {history
                    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
                    .map((entry) => (
                      <div key={entry.id} className="border border-border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">
                            {entry.generalImpression || 'Medizinischer Eintrag'}
                          </h4>
                          <span className="text-sm text-muted-foreground">
                            {new Date(entry.recordedAt).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {entry.mainSubjectiveProblem && (
                            <div>
                              <p className="text-muted-foreground">Hauptbeschwerde</p>
                              <p>{entry.mainSubjectiveProblem}</p>
                            </div>
                          )}
                          {entry.symptomHistory && (
                            <div>
                              <p className="text-muted-foreground">Symptomverlauf</p>
                              <p>{entry.symptomHistory}</p>
                            </div>
                          )}
                          {entry.patientGoals && (
                            <div>
                              <p className="text-muted-foreground">Therapieziele</p>
                              <p>{entry.patientGoals}</p>
                            </div>
                          )}
                          {entry.activityStatus && (
                            <div>
                              <p className="text-muted-foreground">Aktivitätsstatus</p>
                              <p>{entry.activityStatus}</p>
                            </div>
                          )}
                        </div>
                        
                        {entry.notes && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-muted-foreground text-sm">Zusätzliche Notizen</p>
                            <p className="text-sm bg-muted/50 p-3 rounded-md mt-1">{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Zahlungsverlauf</h3>
              
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">Keine Zahlungen</h4>
                  <p className="text-muted-foreground">
                    Es gibt noch keine Zahlungen für diesen Patienten.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-md">
                        <div>
                          <p className="font-medium">€{payment.amount}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.paymentMethod === 'CASH' && 'Bargeld'}
                            {payment.paymentMethod === 'CARD' && 'Karte'}
                            {payment.paymentMethod === 'BANK_TRANSFER' && 'Überweisung'}
                            {payment.paidSessionsCount && ` • ${payment.paidSessionsCount} Sitzungen`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <Badge 
                          className={clsx(
                            payment.status === 'COMPLETED' && 'bg-green-100 text-green-800',
                            payment.status === 'PENDING' && 'bg-yellow-100 text-yellow-800',
                            payment.status === 'REFUNDED' && 'bg-red-100 text-red-800'
                          )}
                        >
                          {payment.status === 'COMPLETED' && 'Bezahlt'}
                          {payment.status === 'PENDING' && 'Ausstehend'}
                          {payment.status === 'REFUNDED' && 'Erstattet'}
                        </Badge>
                      </div>
                    ))}
                  
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Gesamtsumme:</span>
                      <span>€{payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
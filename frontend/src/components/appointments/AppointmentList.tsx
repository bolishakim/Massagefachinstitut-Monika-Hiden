import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Filter, 
  Search, 
  Plus,
  Edit,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  RotateCcw,
  MoreHorizontal,
  Loader2,
  X,
  Copy,
  Ban,
  Calendar as CalendarIcon,
  CheckCircle,
  UserX,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Appointment, AppointmentStatus, Role, PaginatedResponse } from '@/types';

interface AppointmentListProps {
  appointments: Appointment[];
  loading: boolean;
  onAppointmentSelect?: (appointment: Appointment) => void;
  onAppointmentEdit: (appointment: Appointment) => void;
  onAppointmentView: (appointment: Appointment) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
  onBulkDelete?: (appointmentIds: string[]) => void;
  onMarkAsPaid?: (appointmentIds: string[]) => void;
  onCompleteAppointment?: (appointment: Appointment) => void;
  onRescheduleAppointment?: (appointment: Appointment) => void;
  onCancelAppointment?: (appointment: Appointment) => void;
  onNoShowAppointment?: (appointment: Appointment) => void;
  onDuplicateAppointment?: (appointment: Appointment) => void;
  onFiltersChange?: (filters: any) => void;
  pagination?: PaginatedResponse<Appointment>['pagination'];
  onPageChange?: (page: number) => void;
  userRole?: string;
  showPatientColumn?: boolean;
  showPackageColumn?: boolean;
}

interface Filters {
  search: string;
  status: string;
  staffId: string;
  roomId: string;
  date: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const statusOptions = [
  { value: '', label: 'Alle Status' },
  { value: 'SCHEDULED', label: 'Geplant' },
  { value: 'COMPLETED', label: 'Abgeschlossen' },
  { value: 'CANCELLED', label: 'Abgesagt' },
  { value: 'NO_SHOW', label: 'Nicht erschienen' },
];

const sortOptions = [
  { value: 'scheduledDate', label: 'Terminart' },
  { value: 'patient', label: 'Patient' },
  { value: 'service', label: 'Behandlung' },
  { value: 'status', label: 'Status' },
  { value: 'createdAt', label: 'Erstellt' },
];

export function AppointmentList({
  appointments,
  loading,
  onAppointmentSelect,
  onAppointmentEdit,
  onAppointmentView,
  onCreateNew,
  onRefresh,
  onBulkDelete,
  onMarkAsPaid,
  onCompleteAppointment,
  onRescheduleAppointment,
  onCancelAppointment,
  onNoShowAppointment,
  onDuplicateAppointment,
  onFiltersChange,
  pagination,
  onPageChange,
  userRole,
  showPatientColumn = true,
  showPackageColumn = true
}: AppointmentListProps) {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    staffId: '',
    roomId: '',
    date: '',
    sortBy: 'scheduledDate',
    sortOrder: 'desc'
  });
  
  const [localSearchValue, setLocalSearchValue] = useState('');

  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    appointmentIds: string[];
    appointmentNames: string[];
  }>({
    show: false,
    appointmentIds: [],
    appointmentNames: []
  });

  // Debounce local search value and update filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearchValue);
      // Update local filters state
      setFilters(prev => ({ ...prev, search: localSearchValue }));
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchValue]);

  // Client-side filtering for search (like PatientList does)
  const filteredAppointments = useMemo(() => {
    if (!localSearchValue || localSearchValue.trim().length === 0) {
      return appointments;
    }
    
    const searchLower = localSearchValue.toLowerCase().trim();
    
    return appointments.filter(appointment => {
      // Search in patient name
      const patientName = `${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}`.toLowerCase();
      if (patientName.includes(searchLower)) return true;
      
      // Search in patient phone
      if (appointment.patient?.phone?.includes(searchLower)) return true;
      
      // Search in service name
      if (appointment.service?.name?.toLowerCase().includes(searchLower)) return true;
      
      // Search in staff name
      const staffName = `${appointment.staff?.firstName || ''} ${appointment.staff?.lastName || ''}`.toLowerCase();
      if (staffName.includes(searchLower)) return true;
      
      // Search in room name
      if (appointment.room?.name?.toLowerCase().includes(searchLower)) return true;
      
      // Search in package name
      if (appointment.package?.name?.toLowerCase().includes(searchLower)) return true;
      
      return false;
    });
  }, [appointments, localSearchValue]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter(a => a.status === 'SCHEDULED').length;
    const completed = appointments.filter(a => a.status === 'COMPLETED').length;
    const noShow = appointments.filter(a => a.status === 'NO_SHOW').length;
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;

    // Calculate paid appointments - those with packages that have been paid or individual payments
    const paid = appointments.filter(appointment => {
      if (appointment.package) {
        // For package appointments, check if package is fully or partially paid
        return appointment.package.paymentStatus === 'COMPLETED' || 
               appointment.package.paymentStatus === 'PARTIALLY_PAID';
      }
      // For non-package appointments, we'd need payment info (not available in current structure)
      return false;
    }).length;

    return { total, scheduled, completed, noShow, cancelled, paid };
  }, [appointments]);


  // Highlight search terms in real-time
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm || !text || searchTerm.trim().length === 0) return text;
    
    // Escape special regex characters
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create regex for partial matching (case insensitive)
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => {
          // Check if this part matches the search term
          const isMatch = regex.test(part);
          // Reset regex lastIndex to avoid issues with global flag
          regex.lastIndex = 0;
          
          return isMatch ? (
            <mark 
              key={index} 
              className="bg-yellow-200 dark:bg-yellow-800/50 px-0.5 py-0.5 rounded text-yellow-900 dark:text-yellow-100 font-medium transition-colors"
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          );
        })}
      </span>
    );
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    if (key === 'search') {
      // For search, update local value immediately (for responsive UI)
      setLocalSearchValue(value);
      // The debounced useEffect will handle parent notification
    } else {
      // For non-search filters, update normally and notify immediately
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      if (onFiltersChange) {
        onFiltersChange(newFilters);
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAppointments(appointments.map(a => a.id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleSelectAppointment = (appointmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAppointments([...selectedAppointments, appointmentId]);
    } else {
      setSelectedAppointments(selectedAppointments.filter(id => id !== appointmentId));
    }
  };

  const handleBulkDelete = () => {
    const appointmentsToDelete = appointments.filter(a => selectedAppointments.includes(a.id));
    setDeleteModal({
      show: true,
      appointmentIds: selectedAppointments,
      appointmentNames: appointmentsToDelete.map(a => 
        `${a.patient?.firstName} ${a.patient?.lastName} - ${a.service?.name} (${formatDate(a.scheduledDate)} ${a.startTime})`
      )
    });
  };

  const confirmBulkDelete = () => {
    onBulkDelete?.(deleteModal.appointmentIds);
    setDeleteModal({ show: false, appointmentIds: [], appointmentNames: [] });
    setSelectedAppointments([]);
  };

  const handleBulkMarkAsPaid = () => {
    onMarkAsPaid?.(selectedAppointments);
    setSelectedAppointments([]);
  };

  const getStatusBadge = (status: AppointmentStatus) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // "14:00" from "14:00:00"
  };

  const canEdit = userRole === Role.ADMIN || userRole === Role.MODERATOR;
  const canDelete = userRole === Role.ADMIN;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Termine werden geladen...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Termine</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Termine und Behandlungen
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Neuer Termin
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gesamt</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Geplant</p>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Abgeschlossen</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <UserX className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No Show</p>
              <p className="text-2xl font-bold">{stats.noShow}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Abgesagt</p>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bezahlt</p>
              <p className="text-2xl font-bold">{stats.paid}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1 relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Patient oder Behandlung suchen..."
                value={localSearchValue}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleFilterChange('search', '');
                  }
                }}
                className="pl-10 pr-10"
                autoComplete="off"
                spellCheck="false"
              />
              {localSearchValue !== debouncedSearch && localSearchValue && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                </div>
              )}
              {localSearchValue && localSearchValue === debouncedSearch && (
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Suche löschen"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <SimpleSelect
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Alle Status</option>
              {statusOptions.slice(1).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SimpleSelect>
            <Input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-auto"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Weniger Filter' : 'Mehr Filter'}
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <SimpleSelect
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  Sortieren nach {option.label}
                </option>
              ))}
            </SimpleSelect>
            <SimpleSelect
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
            >
              <option value="desc">Absteigend</option>
              <option value="asc">Aufsteigend</option>
            </SimpleSelect>
          </div>
        )}
      </Card>

      {/* Bulk Actions */}
      {selectedAppointments.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedAppointments.length} Termin(e) ausgewählt
            </p>
            <div className="flex gap-2">
              {onMarkAsPaid && (
                <Button variant="outline" size="sm" onClick={handleBulkMarkAsPaid}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Als bezahlt markieren
                </Button>
              )}
              {onBulkDelete && canDelete && (
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Search Results Summary */}
      {(filters.search || appointments.length > 0) && !loading && (
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>
              {filteredAppointments.length} Termin{filteredAppointments.length > 1 ? 'e' : ''} 
              {localSearchValue && ` für "${localSearchValue}"`}
            </span>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-sm font-medium text-muted-foreground">
                <th className="text-left p-4">
                  <Checkbox
                    checked={selectedAppointments.length === appointments.length && appointments.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="text-left p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Datum & Zeit
                  </div>
                </th>
                {showPatientColumn && (
                  <th className="text-left p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Patient
                    </div>
                  </th>
                )}
                <th className="text-left p-4">Behandlung</th>
                <th className="text-left p-4">Therapeut</th>
                <th className="text-left p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Raum
                  </div>
                </th>
                {showPackageColumn && (
                  <th className="text-left p-4">Paket</th>
                )}
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="border-t hover:bg-muted/25">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedAppointments.includes(appointment.id)}
                      onChange={(e) => 
                        handleSelectAppointment(appointment.id, e.target.checked)
                      }
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium">
                        {formatDate(appointment.scheduledDate)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </p>
                    </div>
                  </td>
                  {showPatientColumn && (
                    <td className="p-4">
                      <div>
                        <div className="font-medium">
                          {highlightSearchTerm(
                            `${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}`.trim(),
                            localSearchValue
                          )}
                        </div>
                        {appointment.patient?.phone && (
                          <p className="text-xs text-muted-foreground">
                            {highlightSearchTerm(appointment.patient.phone, localSearchValue)}
                          </p>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="p-4">
                    <div>
                      <div className="font-medium">
                        {highlightSearchTerm(appointment.service?.name || '', localSearchValue)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {appointment.service?.duration} Min
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">
                      {highlightSearchTerm(
                        `${appointment.staff?.firstName || ''} ${appointment.staff?.lastName || ''}`.trim(),
                        localSearchValue
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">
                      {highlightSearchTerm(appointment.room?.name || '', localSearchValue)}
                    </div>
                  </td>
                  {showPackageColumn && (
                    <td className="p-4">
                      {appointment.package ? (
                        <div className="font-medium">
                          {highlightSearchTerm(appointment.package.name, localSearchValue)}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Kein Paket</p>
                      )}
                    </td>
                  )}
                  <td className="p-4">
                    {getStatusBadge(appointment.status)}
                    {appointment.hasConflict && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 text-warning" />
                        <p className="text-xs text-warning">Konflikt</p>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAppointmentView(appointment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAppointmentEdit(appointment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {appointment.status === 'SCHEDULED' && onCompleteAppointment && (() => {
                            // Check if appointment is in the future
                            const appointmentDate = new Date(appointment.scheduledDate);
                            const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);
                            appointmentDate.setHours(endHours, endMinutes, 0, 0);
                            const isFuture = appointmentDate > new Date();
                            
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onCompleteAppointment(appointment)}
                                className={isFuture ? "text-gray-400 cursor-not-allowed" : "text-green-600 hover:text-green-700"}
                                disabled={isFuture}
                                title={isFuture ? "Ein zukünftiger Termin kann nicht als abgeschlossen markiert werden." : "Termin abschließen"}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            );
                          })()}
                          {appointment.status === 'SCHEDULED' && onRescheduleAppointment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRescheduleAppointment(appointment)}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                      {/* Dropdown Menu for additional actions */}
                      <DropdownMenu
                        trigger={
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                        items={[
                          {
                            id: 'duplicate',
                            label: 'Duplizieren',
                            icon: <Copy className="h-4 w-4" />,
                            onClick: () => onDuplicateAppointment?.(appointment),
                            show: canEdit && !!onDuplicateAppointment
                          },
                          {
                            id: 'pay',
                            label: 'Als bezahlt markieren',
                            icon: <CreditCard className="h-4 w-4" />,
                            onClick: () => onMarkAsPaid?.([appointment.id]),
                            show: appointment.status !== 'CANCELLED' && !!onMarkAsPaid
                          },
                          (() => {
                            // Check if appointment is in the future
                            const appointmentDate = new Date(appointment.scheduledDate);
                            const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
                            appointmentDate.setHours(startHours, startMinutes, 0, 0);
                            const isFuture = appointmentDate > new Date();
                            
                            return {
                              id: 'noshow',
                              label: isFuture ? 'No Show (zukünftig)' : 'No Show',
                              icon: <XCircle className="h-4 w-4" />,
                              onClick: () => onNoShowAppointment?.(appointment),
                              variant: 'warning' as const,
                              disabled: isFuture,
                              show: appointment.status === 'SCHEDULED' && !!onNoShowAppointment
                            };
                          })(),
                          {
                            id: 'cancel',
                            label: 'Termin absagen',
                            icon: <Ban className="h-4 w-4" />,
                            onClick: () => onCancelAppointment?.(appointment),
                            variant: 'destructive',
                            show: appointment.status === 'SCHEDULED' && canDelete && !!onCancelAppointment
                          }
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAppointments.length === 0 && appointments.length > 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Termine gefunden</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Keine Termine entsprechen dem Suchbegriff "{localSearchValue}".
            </p>
          </div>
        )}

        {appointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Termine gefunden</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Es wurden keine Termine mit den aktuellen Filterkriterien gefunden.
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Termin erstellen
            </Button>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Seite {pagination.page} von {pagination.pages} 
              ({pagination.total} Termine gesamt)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange?.(pagination.page - 1)}
              >
                Vorherige
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => onPageChange?.(pagination.page + 1)}
              >
                Nächste
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, appointmentIds: [], appointmentNames: [] })}
        onConfirm={confirmBulkDelete}
        title="Termine löschen"
        description={
          deleteModal.appointmentIds.length === 1
            ? `Möchten Sie den folgenden Termin wirklich löschen?\n\n${deleteModal.appointmentNames[0]}`
            : `Möchten Sie die folgenden ${deleteModal.appointmentIds.length} Termine wirklich löschen?\n\n${deleteModal.appointmentNames.slice(0, 3).join('\n')}${deleteModal.appointmentNames.length > 3 ? '\n...' : ''}`
        }
        confirmText="Löschen"
        variant="destructive"
      />
    </div>
  );
}
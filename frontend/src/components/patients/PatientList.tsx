import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Calendar, 
  Phone, 
  Mail,
  User,
  ChevronDown,
  X,
  Download,
  RefreshCw,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Patient, InsuranceType, PaginatedResponse } from '@/types';
import { clsx } from 'clsx';

interface PatientListProps {
  patients: Patient[];
  loading?: boolean;
  onPatientSelect?: (patient: Patient) => void;
  onPatientEdit?: (patient: Patient) => void;
  onPatientView?: (patient: Patient) => void;
  onCreateNew?: () => void;
  onRefresh?: () => void;
  onBulkDelete?: (patientIds: string[]) => Promise<void>;
  onBulkHardDelete?: (patientIds: string[]) => Promise<void>;
  onReactivatePatient?: (patient: Patient) => Promise<void>;
  onFiltersChange?: (filters: Partial<FilterOptions>) => void;
  className?: string;
  pagination?: PaginatedResponse<Patient>['pagination'];
  onPageChange?: (page: number) => void;
  userRole?: string;
}

interface FilterOptions {
  search: string;
  insuranceType: InsuranceType | 'all';
  isActive: 'all' | 'active' | 'inactive';
  ageRange: 'all' | 'child' | 'adult' | 'senior';
  hasEmail: 'all' | 'yes' | 'no';
  hasDoctor: 'all' | 'yes' | 'no';
  sortBy: 'name' | 'created' | 'age' | 'lastVisit';
  sortOrder: 'asc' | 'desc';
}

export function PatientList({
  patients,
  loading = false,
  onPatientSelect,
  onPatientEdit,
  onPatientView,
  onCreateNew,
  onRefresh,
  onBulkDelete,
  onBulkHardDelete,
  onReactivatePatient,
  onFiltersChange,
  className,
  pagination,
  onPageChange,
  userRole
}: PatientListProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    insuranceType: 'all',
    isActive: 'active',
    ageRange: 'all',
    hasEmail: 'all',
    hasDoctor: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHardDeleteDialog, setShowHardDeleteDialog] = useState(false);
  const [deletingPatients, setDeletingPatients] = useState(false);

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

  // Get age category
  const getAgeCategory = (age: number | null): string => {
    if (age === null) return 'Unbekannt';
    if (age < 18) return 'Kind';
    if (age < 65) return 'Erwachsener';
    return 'Senior';
  };

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
    let filtered = patients.filter(patient => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const searchLower = filters.search.toLowerCase();
      
      // Search filter
      if (filters.search && !fullName.includes(searchLower) && 
          !patient.phone?.includes(filters.search) && 
          !patient.email?.toLowerCase().includes(searchLower)) {
        return false;
      }

      // Insurance type filter
      if (filters.insuranceType !== 'all' && patient.insuranceType !== filters.insuranceType) {
        return false;
      }

      // Age range filter
      if (filters.ageRange !== 'all') {
        const age = calculateAge(patient.dateOfBirth);
        switch (filters.ageRange) {
          case 'child':
            if (age === null || age >= 18) return false;
            break;
          case 'adult':
            if (age === null || age < 18 || age >= 65) return false;
            break;
          case 'senior':
            if (age === null || age < 65) return false;
            break;
        }
      }

      // Email filter
      if (filters.hasEmail !== 'all') {
        const hasEmail = Boolean(patient.email);
        if ((filters.hasEmail === 'yes' && !hasEmail) || (filters.hasEmail === 'no' && hasEmail)) {
          return false;
        }
      }

      // Doctor referral filter
      if (filters.hasDoctor !== 'all') {
        const hasDoctor = Boolean(patient.doctorReferral);
        if ((filters.hasDoctor === 'yes' && !hasDoctor) || (filters.hasDoctor === 'no' && hasDoctor)) {
          return false;
        }
      }

      return true;
    });

    // Sort patients
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'age':
          const ageA = calculateAge(a.dateOfBirth) || 0;
          const ageB = calculateAge(b.dateOfBirth) || 0;
          comparison = ageA - ageB;
          break;
        // Note: lastVisit would need to be implemented based on appointments data
        case 'lastVisit':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [patients, filters]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter(p => p.isActive).length;
    const withInsurance = patients.filter(p => p.insuranceType && p.insuranceType !== InsuranceType.SELF_PAY).length;
    const withEmail = patients.filter(p => p.email).length;

    return { total, active, withInsurance, withEmail };
  }, [patients]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Notify parent component about filter changes
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      insuranceType: 'all',
      isActive: 'active',
      ageRange: 'all',
      hasEmail: 'all',
      hasDoctor: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    } as FilterOptions;
    
    setFilters(clearedFilters);
    
    // Notify parent component about filter changes
    if (onFiltersChange) {
      onFiltersChange(clearedFilters);
    }
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPatients.size === filteredPatients.length) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(filteredPatients.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedPatients.size === 0) return;

    try {
      setDeletingPatients(true);
      await onBulkDelete(Array.from(selectedPatients));
      setSelectedPatients(new Set());
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting patients:', error);
    } finally {
      setDeletingPatients(false);
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(true);
  };

  const handleHardDeleteConfirm = () => {
    if (userRole !== 'ADMIN') return;
    setShowHardDeleteDialog(true);
  };

  const handleHardDeleteExecute = async () => {
    if (!onBulkHardDelete || selectedPatients.size === 0 || userRole !== 'ADMIN') return;

    setDeletingPatients(true);
    try {
      await onBulkHardDelete(Array.from(selectedPatients));
      setSelectedPatients(new Set());
      setShowHardDeleteDialog(false);
    } catch (error) {
      console.error('Error hard deleting patients:', error);
    } finally {
      setDeletingPatients(false);
    }
  };

  const getInsuranceTypeLabel = (type: InsuranceType | undefined): string => {
    switch (type) {
      case InsuranceType.PUBLIC_INSURANCE:
        return 'Gesetzlich';
      case InsuranceType.PRIVATE_INSURANCE:
        return 'Privat';
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

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Patienten</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Patienten des Massagefachinstituts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          )}
          {onCreateNew && (
            <Button onClick={onCreateNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Neuer Patient
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gesamt</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktiv</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Versichert</p>
              <p className="text-2xl font-bold">{stats.withInsurance}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mit E-Mail</p>
              <p className="text-2xl font-bold">{stats.withEmail}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Suchen Sie nach Name, Telefon oder E-Mail..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
              <ChevronDown className={clsx('h-4 w-4 transition-transform', 
                showFilters && 'rotate-180')} />
            </Button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t pt-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Select
                    label="Versicherung"
                    value={filters.insuranceType}
                    onChange={(value) => handleFilterChange('insuranceType', value)}
                    options={[
                      { value: 'all', label: 'Alle' },
                      { value: InsuranceType.PUBLIC_INSURANCE, label: 'Gesetzlich' },
                      { value: InsuranceType.PRIVATE_INSURANCE, label: 'Privat' },
                      { value: InsuranceType.SELF_PAY, label: 'Selbstzahler' }
                    ]}
                  />

                  <Select
                    label="Status"
                    value={filters.isActive}
                    onChange={(value) => handleFilterChange('isActive', value)}
                    options={[
                      { value: 'all', label: 'Alle' },
                      { value: 'active', label: 'Aktiv' },
                      { value: 'inactive', label: 'Inaktiv' }
                    ]}
                  />

                  <Select
                    label="Altersgruppe"
                    value={filters.ageRange}
                    onChange={(value) => handleFilterChange('ageRange', value)}
                    options={[
                      { value: 'all', label: 'Alle' },
                      { value: 'child', label: 'Kinder (< 18)' },
                      { value: 'adult', label: 'Erwachsene (18-64)' },
                      { value: 'senior', label: 'Senioren (65+)' }
                    ]}
                  />

                  <Select
                    label="E-Mail"
                    value={filters.hasEmail}
                    onChange={(value) => handleFilterChange('hasEmail', value)}
                    options={[
                      { value: 'all', label: 'Alle' },
                      { value: 'yes', label: 'Mit E-Mail' },
                      { value: 'no', label: 'Ohne E-Mail' }
                    ]}
                  />

                  <Select
                    label="Arzt-Überweisung"
                    value={filters.hasDoctor}
                    onChange={(value) => handleFilterChange('hasDoctor', value)}
                    options={[
                      { value: 'all', label: 'Alle' },
                      { value: 'yes', label: 'Mit Überweisung' },
                      { value: 'no', label: 'Ohne Überweisung' }
                    ]}
                  />

                  <Select
                    label="Sortieren nach"
                    value={filters.sortBy}
                    onChange={(value) => handleFilterChange('sortBy', value)}
                    options={[
                      { value: 'name', label: 'Name' },
                      { value: 'created', label: 'Erstellungsdatum' },
                      { value: 'age', label: 'Alter' },
                      { value: 'lastVisit', label: 'Letzter Besuch' }
                    ]}
                  />

                  <Select
                    label="Reihenfolge"
                    value={filters.sortOrder}
                    onChange={(value) => handleFilterChange('sortOrder', value)}
                    options={[
                      { value: 'asc', label: 'Aufsteigend' },
                      { value: 'desc', label: 'Absteigend' }
                    ]}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Filter zurücksetzen
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredPatients.length} von {patients.length} Patienten
          {filteredPatients.length !== patients.length && ' (gefiltert)'}
        </span>
        {selectedPatients.size > 0 && (
          <span>{selectedPatients.size} ausgewählt</span>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedPatients.size > 0 && onBulkDelete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {selectedPatients.size} Patient{selectedPatients.size !== 1 ? 'en' : ''} ausgewählt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPatients(new Set())}
                  >
                    Auswahl aufheben
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteConfirm}
                    className="flex items-center gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    Deaktivieren
                  </Button>
                  {userRole === 'ADMIN' && onBulkHardDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleHardDeleteConfirm}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      GDPR Permanent löschen
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient List */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Lade Patienten...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Patienten gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {filters.search || filters.insuranceType !== 'all' || filters.ageRange !== 'all' 
                ? 'Versuchen Sie, die Filter zu ändern oder zu löschen.'
                : 'Fügen Sie Ihren ersten Patienten hinzu.'}
            </p>
            {onCreateNew && (
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Patient hinzufügen
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Table Header */}
            <div className="bg-muted/50 p-4 border-b">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-muted-foreground">
                <div className="col-span-3 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedPatients.size === filteredPatients.length && filteredPatients.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-input"
                  />
                  <span>Patient</span>
                </div>
                <div className="col-span-2">Kontakt</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Alter</div>
                <div className="col-span-2">Versicherung</div>
                <div className="col-span-2">Aktionen</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {filteredPatients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className={clsx(
                    "grid grid-cols-12 gap-4 items-center",
                    !patient.isActive && "opacity-60"
                  )}>
                    {/* Patient Info */}
                    <div className="col-span-3 flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPatients.has(patient.id)}
                        onChange={() => handleSelectPatient(patient.id)}
                        className="rounded border-input"
                        disabled={!patient.isActive}
                      />
                      <Avatar
                        src={patient.avatar}
                        alt={`${patient.firstName} ${patient.lastName}`}
                        size="md"
                        fallback={`${patient.firstName[0]}${patient.lastName[0]}`}
                      />
                      <div>
                        <h3 className={clsx(
                          "font-medium",
                          !patient.isActive && "line-through text-muted-foreground"
                        )}>
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {patient.socialInsuranceNumber ? `SVN: ${patient.socialInsuranceNumber}` : 'Keine SVN'}
                        </p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          <span>{patient.phone}</span>
                        </div>
                        {patient.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{patient.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      <Badge 
                        variant="secondary" 
                        className={clsx(
                          'text-xs flex items-center gap-1',
                          patient.isActive 
                            ? 'text-green-600 bg-green-100 dark:bg-green-900/20'
                            : 'text-red-600 bg-red-100 dark:bg-red-900/20'
                        )}
                      >
                        {patient.isActive ? (
                          <>
                            <UserCheck className="h-3 w-3" />
                            Aktiv
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3" />
                            Inaktiv
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Age */}
                    <div className="col-span-2">
                      {patient.dateOfBirth ? (
                        <div>
                          <span className="font-medium">{calculateAge(patient.dateOfBirth)} Jahre</span>
                          <p className="text-xs text-muted-foreground">
                            {new Date(patient.dateOfBirth).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Nicht angegeben</span>
                      )}
                    </div>

                    {/* Insurance */}
                    <div className="col-span-2">
                      <Badge 
                        variant="secondary" 
                        className={clsx('text-xs', getInsuranceColor(patient.insuranceType))}
                      >
                        {getInsuranceTypeLabel(patient.insuranceType)}
                      </Badge>
                      {patient.doctorReferral && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Überweisung: {patient.doctorReferral}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center gap-2">
                      {patient.isActive ? (
                        <>
                          {onPatientView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onPatientView(patient)}
                              title="Patient anzeigen"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onPatientEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onPatientEdit(patient)}
                              title="Patient bearbeiten"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPatientSelect?.(patient)}
                            title="Termin buchen"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {onPatientView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onPatientView(patient)}
                              title="Patient anzeigen"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onReactivatePatient && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onReactivatePatient(patient)}
                              title="Patient reaktivieren"
                              className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Seite {pagination.page} von {pagination.pages} ({pagination.total} Einträge)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Vorherige
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
            >
              Nächste
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title="Patienten deaktivieren"
        message={`Sind Sie sicher, dass Sie ${selectedPatients.size} Patient${selectedPatients.size !== 1 ? 'en' : ''} deaktivieren möchten? Die Patienten werden als inaktiv markiert, aber ihre Daten bleiben erhalten.`}
        confirmText="Deaktivieren"
        cancelText="Abbrechen"
        variant="danger"
        isLoading={deletingPatients}
      />

      {/* GDPR Hard Delete Dialog */}
      <ConfirmDialog
        isOpen={showHardDeleteDialog}
        onClose={() => setShowHardDeleteDialog(false)}
        onConfirm={handleHardDeleteExecute}
        title="GDPR: Permanente Löschung"
        message={
          `ACHTUNG: UNWIDERRUFLICHE LÖSCHUNG\n\n` +
          `Sie sind dabei, ALLE Daten von ${selectedPatients.size} Patient${selectedPatients.size !== 1 ? 'en' : ''} permanent zu löschen.\n\n` +
          `Dies umfasst für jeden Patienten:\n` +
          `• Komplettes Patientenprofil\n` +
          `• Gesamte Krankengeschichte\n` +
          `• Alle Termine und Behandlungen\n` +
          `• Behandlungspakete und Zahlungen\n\n` +
          `Diese Aktion überschreibt die 30-jährige medizinische Aufbewahrungspflicht gemäß GDPR Artikel 17 und kann NIEMALS rückgängig gemacht werden.\n\n` +
          `NUR fortfahren wenn eine rechtmäßige GDPR-Löschungsanfrage vorliegt.`
        }
        confirmText="Permanent löschen"
        cancelText="Abbrechen"
        variant="danger"
        isLoading={deletingPatients}
      />
    </div>
  );
}
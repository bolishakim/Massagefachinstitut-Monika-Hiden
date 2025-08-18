import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Package,
  CreditCard,
  Ban,
  CheckCircle,
  Clock,
  Euro,
  Activity,
  Users
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { ServicePackage, PackageStatus, PaginatedResponse, InsuranceType } from '@/types';
import { clsx } from 'clsx';

interface PackageListProps {
  packages: ServicePackage[];
  loading?: boolean;
  onPackageSelect?: (pkg: ServicePackage) => void;
  onPackageEdit?: (pkg: ServicePackage) => void;
  onPackageView?: (pkg: ServicePackage) => void;
  onCreateNew?: () => void;
  onRefresh?: () => void;
  onAddPayment?: (pkg: ServicePackage) => void;
  onCancelPackage?: (pkg: ServicePackage) => void;
  onFiltersChange?: (filters: Partial<FilterOptions>) => void;
  className?: string;
  pagination?: PaginatedResponse<ServicePackage>['pagination'];
  onPageChange?: (page: number) => void;
}

interface FilterOptions {
  search: string;
  patientId?: string;
  status: PackageStatus | 'ALL';
  startDate?: string;
  endDate?: string;
  sortBy: 'createdAt' | 'finalPrice' | 'name';
  sortOrder: 'asc' | 'desc';
}

export function PackageList({
  packages,
  loading = false,
  onPackageSelect,
  onPackageEdit,
  onPackageView,
  onCreateNew,
  onRefresh,
  onAddPayment,
  onCancelPackage,
  onFiltersChange,
  className,
  pagination,
  onPageChange
}: PackageListProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'ALL',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Notify parent of filter changes
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, search: debouncedSearch });
    }
  }, [filters, debouncedSearch]);

  // Update local filters when external filters change
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Get status badge variant
  const getStatusVariant = (status: PackageStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'secondary';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Get status icon
  const getStatusIcon = (status: PackageStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Activity className="h-3 w-3" />;
      case 'COMPLETED':
        return <CheckCircle className="h-3 w-3" />;
      case 'CANCELLED':
        return <Ban className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Get status label in German
  const getStatusLabel = (status: PackageStatus) => {
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

  // Get insurance type label in German
  const getInsuranceLabel = (type?: InsuranceType) => {
    switch (type) {
      case 'PUBLIC_INSURANCE':
        return 'Gesetzlich';
      case 'PRIVATE_INSURANCE':
        return 'Privat';
      case 'SELF_PAY':
        return 'Selbstzahler';
      default:
        return 'Unbekannt';
    }
  };

  // Highlight search terms
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm || !text || searchTerm.trim().length === 0) return text;
    
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => {
          const isMatch = regex.test(part);
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

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Pakete verwalten</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Servicepakete für Patienten
            </p>
          </div>
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
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Paket erstellen
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Suchen nach Patient oder Paket..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              icon={Search}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            <ChevronDown className={clsx('h-4 w-4 ml-2 transition-transform', showFilters && 'rotate-180')} />
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t pt-4 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Status"
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value as PackageStatus | 'ALL')}
                  options={[
                    { value: 'ALL', label: 'Alle Status' },
                    { value: 'ACTIVE', label: 'Aktiv' },
                    { value: 'COMPLETED', label: 'Abgeschlossen' },
                    { value: 'CANCELLED', label: 'Storniert' },
                  ]}
                />
                <Select
                  label="Sortieren nach"
                  value={filters.sortBy}
                  onChange={(value) => handleFilterChange('sortBy', value)}
                  options={[
                    { value: 'createdAt', label: 'Erstellungsdatum' },
                    { value: 'finalPrice', label: 'Preis' },
                    { value: 'name', label: 'Name' },
                  ]}
                />
                <Select
                  label="Reihenfolge"
                  value={filters.sortOrder}
                  onChange={(value) => handleFilterChange('sortOrder', value)}
                  options={[
                    { value: 'desc', label: 'Absteigend' },
                    { value: 'asc', label: 'Aufsteigend' },
                  ]}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Package List */}
      {loading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : !packages || packages.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Keine Pakete gefunden</h3>
          <p className="text-muted-foreground mb-4">
            {filters.search || filters.status !== 'ALL' 
              ? 'Keine Pakete entsprechen den aktuellen Filterkriterien.'
              : 'Es wurden noch keine Pakete erstellt.'}
          </p>
          {onCreateNew && !filters.search && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Erstes Paket erstellen
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {packages?.map((pkg) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar size="md">
                        <User className="h-5 w-5" />
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {highlightSearchTerm(
                            `${pkg.patient.firstName} ${pkg.patient.lastName}`,
                            filters.search
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {pkg.patient.phone}
                          <span className="mx-2">•</span>
                          {getInsuranceLabel(pkg.patient.insuranceType)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(pkg.status)}>
                      {getStatusIcon(pkg.status)}
                      <span className="ml-1">{getStatusLabel(pkg.status)}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Paket Name</p>
                      <p className="text-sm text-muted-foreground">
                        {highlightSearchTerm(pkg.name, filters.search)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Gesamtpreis</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(pkg.finalPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sitzungen</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {pkg.usedSessions}/{pkg.totalSessions}
                        </p>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${pkg.usagePercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {pkg.usagePercentage}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Erstellt am</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(pkg.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Euro className="h-4 w-4" />
                      <span>Bezahlt: {formatCurrency(pkg.totalPaid)}</span>
                      {pkg.totalPaid < pkg.finalPrice && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Ausstehend: {formatCurrency(pkg.finalPrice - pkg.totalPaid)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {onPackageView && (
                        <Button variant="outline" size="sm" onClick={() => onPackageView(pkg)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onPackageEdit && pkg.status === 'ACTIVE' && (
                        <Button variant="outline" size="sm" onClick={() => onPackageEdit(pkg)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onAddPayment && pkg.status === 'ACTIVE' && pkg.totalPaid < pkg.finalPrice && (
                        <Button variant="outline" size="sm" onClick={() => onAddPayment(pkg)}>
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      {onCancelPackage && pkg.status === 'ACTIVE' && (
                        <Button variant="destructive" size="sm" onClick={() => onCancelPackage(pkg)}>
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Zeige {((pagination.page - 1) * pagination.limit) + 1} bis{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} von{' '}
            {pagination.total} Paketen
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              Zurück
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = pagination.page <= 3 
                  ? i + 1 
                  : pagination.page >= pagination.pages - 2 
                    ? pagination.pages - 4 + i 
                    : pagination.page - 2 + i;
                
                if (page < 1 || page > pagination.pages) return null;
                
                return (
                  <Button
                    key={page}
                    variant={page === pagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange?.(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Weiter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
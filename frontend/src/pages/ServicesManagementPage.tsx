import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Euro,
  Clock,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { servicesService, Service, ServiceCategory, ServiceFilters, CreateServiceData } from '@/services/services';
import { PaginatedResponse } from '@/types';
import { CreateServiceModal } from '@/components/forms/CreateServiceModal';

export function ServicesManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginatedResponse<Service>['pagination']>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load services from backend
  const loadServices = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading services from backend...');
      
      const filters: ServiceFilters = {
        page,
        limit: 10,
        search: searchTerm || undefined,
        isActive: 'all'
      };
      
      console.log('Sending API request with filters:', filters);
      
      const response = await servicesService.getAllServices(filters);
      
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        setServices(response.data);
        setPagination(response.pagination);
        console.log('Services loaded successfully:', response.data.length, 'services');
      } else {
        const errorMsg = response.error || 'Failed to load services';
        setError(errorMsg);
        console.error('Failed to load services:', errorMsg);
      }
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Network error while loading services');
    } finally {
      setLoading(false);
    }
  };

  // Load services on component mount and when search changes
  useEffect(() => {
    loadServices();
  }, [searchTerm]);

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Are you sure you want to delete service "${serviceName}"?`)) {
      return;
    }
    
    try {
      const response = await servicesService.deleteService(serviceId);
      
      if (response.success) {
        await loadServices(); // Reload services after delete
      } else {
        setError(response.error || 'Failed to delete service');
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('Network error while deleting service');
    }
  };

  const handleCreateService = async (data: CreateServiceData) => {
    try {
      setCreating(true);
      const response = await servicesService.createService(data);
      
      if (response.success) {
        await loadServices(); // Reload services after creation
        setShowCreateModal(false);
      } else {
        setError(response.error || 'Failed to create service');
      }
    } catch (err) {
      console.error('Error creating service:', err);
      setError('Network error while creating service');
    } finally {
      setCreating(false);
    }
  };

  const getCategoryLabel = (category: ServiceCategory): string => {
    const labels = {
      [ServiceCategory.MASSAGE]: 'Massage',
      [ServiceCategory.PHYSIOTHERAPY]: 'Physiotherapy',
      [ServiceCategory.INFRARED_CHAIR]: 'Infrared Chair',
      [ServiceCategory.TRAINING]: 'Training',
      [ServiceCategory.HEILMASSAGE]: 'Healing Massage',
      [ServiceCategory.COMBINATION]: 'Combination',
      [ServiceCategory.VOUCHER]: 'Voucher'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: ServiceCategory): string => {
    const colors = {
      [ServiceCategory.MASSAGE]: 'bg-green-100 text-green-800',
      [ServiceCategory.PHYSIOTHERAPY]: 'bg-blue-100 text-blue-800',
      [ServiceCategory.INFRARED_CHAIR]: 'bg-purple-100 text-purple-800',
      [ServiceCategory.TRAINING]: 'bg-orange-100 text-orange-800',
      [ServiceCategory.HEILMASSAGE]: 'bg-indigo-100 text-indigo-800',
      [ServiceCategory.COMBINATION]: 'bg-teal-100 text-teal-800',
      [ServiceCategory.VOUCHER]: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Error</h4>
            <p className="text-sm">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            Dienstleistungen verwalten
          </h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle therapeutischen Dienstleistungen und Behandlungen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadServices()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4" />
            Neue Dienstleistung
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gesamt</p>
              <p className="text-2xl font-bold">{pagination?.total || 0}</p>
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
              <p className="text-2xl font-bold">
                {(services || []).filter(s => s.isActive).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Tag className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kategorien</p>
              <p className="text-2xl font-bold">
                {new Set((services || []).map(s => s.category)).size}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Euro className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ø Preis</p>
              <p className="text-2xl font-bold">
                €{(services || []).length > 0 
                  ? Math.round((services || []).reduce((sum, s) => sum + Number(s.price), 0) / (services || []).length)
                  : 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Dienstleistungen suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Services List */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Lade Dienstleistungen...</p>
          </div>
        ) : (services || []).length === 0 ? (
          <div className="p-8 text-center">
            <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Dienstleistungen gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Versuchen Sie, die Suchbegriffe anzupassen.' : 'Erstellen Sie Ihre erste Dienstleistung.'}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Erste Dienstleistung erstellen
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Table Header */}
            <div className="bg-muted/50 p-4 border-b">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-muted-foreground">
                <div className="col-span-4">Dienstleistung</div>
                <div className="col-span-2">Kategorie</div>
                <div className="col-span-1">Dauer</div>
                <div className="col-span-2">Preis</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Aktionen</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {(services || []).map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`p-4 hover:bg-muted/30 transition-colors ${
                    !service.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Service Info */}
                    <div className="col-span-4">
                      <div>
                        <h3 className={`font-medium ${
                          !service.isActive ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {service.name}
                        </h3>
                        {service.nameGerman && (
                          <p className="text-sm text-muted-foreground">
                            {service.nameGerman}
                          </p>
                        )}
                        {service.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getCategoryColor(service.category)}`}
                      >
                        {getCategoryLabel(service.category)}
                      </Badge>
                      {service.isVoucher && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          Voucher
                        </Badge>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        <span>{service.duration}m</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Euro className="h-3 w-3" />
                        <span>{Number(service.price).toFixed(2)}</span>
                      </div>
                      {service.isForChildren && (
                        <p className="text-xs text-blue-600">Kinderpreis verfügbar</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs flex items-center gap-1 w-fit ${
                          service.isActive 
                            ? 'text-green-600 bg-green-100'
                            : 'text-red-600 bg-red-100'
                        }`}
                      >
                        {service.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Aktiv
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3" />
                            Inaktiv
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {}}
                        title="Dienstleistung bearbeiten"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteService(service.id, service.name)}
                        className="text-destructive hover:text-destructive"
                        title="Dienstleistung löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => loadServices(pagination.page - 1)}
          >
            Zurück
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Seite {pagination.page} von {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.pages}
            onClick={() => loadServices(pagination.page + 1)}
          >
            Weiter
          </Button>
        </div>
      )}

      {/* Create Service Modal */}
      <CreateServiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateService}
        isLoading={creating}
      />
    </div>
  );
}
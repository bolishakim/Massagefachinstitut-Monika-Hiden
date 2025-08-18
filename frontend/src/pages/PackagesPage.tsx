import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PackageList } from '@/components/packages/PackageList';
import { packageService } from '@/services/packages';
import { ServicePackage, PaginatedResponse } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function PackagesPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<ServicePackage>['pagination'] | undefined>();
  const [currentFilters, setCurrentFilters] = useState<any>({});
  
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
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get current page, search and status filter from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'ALL';

  const loadPackages = async (page: number = currentPage, search: string = searchQuery, filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert frontend filter values to backend API values
      const apiFilters: any = {};
      
      if (filters?.status && filters.status !== 'ALL') {
        apiFilters.status = filters.status;
      }
      
      if (filters?.startDate) {
        apiFilters.startDate = filters.startDate;
      }
      
      if (filters?.endDate) {
        apiFilters.endDate = filters.endDate;
      }
      
      if (filters?.sortBy) {
        apiFilters.sortBy = filters.sortBy;
      }
      
      if (filters?.sortOrder) {
        apiFilters.sortOrder = filters.sortOrder;
      }

      const response = await packageService.getAllPackages(page, 10, search, apiFilters);
      
      if (response.success && response.data) {
        setPackages(response.data.data || []);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Fehler beim Laden der Pakete');
        setPackages([]);
      }
    } catch (err) {
      console.error('Error loading packages:', err);
      setError('Fehler beim Laden der Pakete');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  // Load packages on component mount and when filters change
  useEffect(() => {
    loadPackages(currentPage, searchQuery, currentFilters);
  }, [currentPage, searchQuery, currentFilters]);

  const handlePageChange = (page: number) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (page > 1) {
        newParams.set('page', page.toString());
      } else {
        newParams.delete('page');
      }
      return newParams;
    });
  };

  const handleRefresh = () => {
    loadPackages(currentPage, searchQuery, currentFilters);
  };

  const handlePackageView = (pkg: ServicePackage) => {
    navigate(`/packages/${pkg.id}`);
  };

  const handlePackageEdit = (pkg: ServicePackage) => {
    navigate(`/packages/${pkg.id}/edit`);
  };

  const handleCreateNew = () => {
    navigate('/packages/new');
  };

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
    
    // Update URL params
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (filters.search) {
        newParams.set('search', filters.search);
      } else {
        newParams.delete('search');
      }
      
      if (filters.status && filters.status !== 'ALL') {
        newParams.set('status', filters.status);
      } else {
        newParams.delete('status');
      }
      
      // Reset to page 1 when filters change, but only add to URL if not page 1
      if (currentPage !== 1) {
        newParams.set('page', '1');
      } else {
        newParams.delete('page');
      }
      return newParams;
    });
  }, [setSearchParams, currentPage]);

  const handleAddPayment = async (pkg: ServicePackage) => {
    // TODO: Open payment modal
    console.log('Add payment for package:', pkg.id);
  };

  const handleCancelPackage = (pkg: ServicePackage) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Paket stornieren',
      message: `Sind Sie sicher, dass Sie das Paket "${pkg.name}" für ${pkg.patient.firstName} ${pkg.patient.lastName} stornieren möchten?`,
      onConfirm: () => confirmCancelPackage(pkg),
      isLoading: false,
    });
  };

  const confirmCancelPackage = async (pkg: ServicePackage) => {
    try {
      setConfirmationModal(prev => ({ ...prev, isLoading: true }));

      const response = await packageService.cancelPackage(pkg.id);
      
      if (response.success) {
        setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        setSuccessMessage('Paket erfolgreich storniert');
        loadPackages(currentPage, searchQuery, currentFilters);
        
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

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Fehler</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Erfolgreich</h4>
            <p className="text-sm">{successMessage}</p>
          </div>
        </Alert>
      )}

      <PackageList
        packages={packages}
        loading={loading}
        onPackageView={handlePackageView}
        onPackageEdit={handlePackageEdit}
        onCreateNew={handleCreateNew}
        onRefresh={handleRefresh}
        onAddPayment={handleAddPayment}
        onCancelPackage={handleCancelPackage}
        onFiltersChange={handleFiltersChange}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

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
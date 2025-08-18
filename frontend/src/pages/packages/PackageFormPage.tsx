import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PackageForm } from '@/components/packages/PackageForm';
import { packageService } from '@/services/packages';
import { PackageForm as PackageFormType } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function PackageFormPage() {
  const [loading, setLoading] = useState(false);
  const [initialPackage, setInitialPackage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Load package data for editing
  useEffect(() => {
    if (isEdit && id) {
      loadPackage(id);
    }
  }, [isEdit, id]);

  const loadPackage = async (packageId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await packageService.getPackageById(packageId);
      
      if (response.success) {
        setInitialPackage(response.data);
      } else {
        setError(response.error || 'Fehler beim Laden des Pakets');
      }
    } catch (err) {
      console.error('Error loading package:', err);
      setError('Fehler beim Laden des Pakets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: PackageFormType) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      let response;
      
      if (isEdit && id) {
        response = await packageService.updatePackage(id, formData);
      } else {
        response = await packageService.createPackage(formData);
      }
      
      if (response.success) {
        if (isEdit) {
          // For updates, single package response
          setSuccessMessage('Paket erfolgreich aktualisiert');
        } else {
          // For creation, multiple packages response
          const createdPackages = Array.isArray(response.data) ? response.data : [response.data];
          const packageCount = createdPackages.length;
          
          if (packageCount === 1) {
            setSuccessMessage('Paket erfolgreich erstellt');
          } else {
            setSuccessMessage(`${packageCount} Pakete erfolgreich erstellt`);
          }
        }
        
        // Navigate back to packages list after a short delay
        setTimeout(() => {
          navigate('/packages');
        }, 1500);
      } else {
        setError(response.error || 'Fehler beim Speichern des Pakets');
      }
    } catch (err) {
      console.error('Error submitting package form:', err);
      setError('Fehler beim Speichern des Pakets');
    }
  };

  const handleCancel = () => {
    navigate('/packages');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Paket...</p>
        </div>
      </div>
    );
  }

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

      <PackageForm
        packageData={initialPackage}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
      />
    </div>
  );
}
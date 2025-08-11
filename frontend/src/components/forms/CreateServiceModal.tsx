import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Stethoscope,
  Euro,
  Clock,
  Tag,
  Users,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { ServiceCategory, CreateServiceData } from '@/services/services';

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceData) => Promise<void>;
  isLoading?: boolean;
}

export function CreateServiceModal({ isOpen, onClose, onSubmit, isLoading = false }: CreateServiceModalProps) {
  const [formData, setFormData] = useState<CreateServiceData>({
    name: '',
    nameGerman: '',
    description: '',
    duration: 30,
    price: 0,
    category: ServiceCategory.MASSAGE,
    categoryColor: '#10B981',
    isForChildren: false,
    isVoucher: false,
  });

  const [errors, setErrors] = useState<Partial<CreateServiceData>>({});

  const categoryOptions = [
    { value: ServiceCategory.MASSAGE, label: 'Massage' },
    { value: ServiceCategory.PHYSIOTHERAPY, label: 'Physiotherapie' },
    { value: ServiceCategory.INFRARED_CHAIR, label: 'Infrarot-Stuhl' },
    { value: ServiceCategory.TRAINING, label: 'Training' },
    { value: ServiceCategory.HEILMASSAGE, label: 'Heilmassage' },
    { value: ServiceCategory.COMBINATION, label: 'Kombination' },
    { value: ServiceCategory.VOUCHER, label: 'Gutschein' },
  ];

  const durationOptions = [
    { value: '15', label: '15 Minuten' },
    { value: '30', label: '30 Minuten' },
    { value: '45', label: '45 Minuten' },
    { value: '60', label: '1 Stunde' },
    { value: '75', label: '1 Stunde 15 Minuten' },
    { value: '90', label: '1 Stunde 30 Minuten' },
    { value: '120', label: '2 Stunden' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateServiceData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Dienstleistungsname ist erforderlich';
    }
    
    if (formData.duration <= 0) {
      newErrors.duration = 'Dauer muss größer als 0 sein';
    }
    
    if (formData.price < 0) {
      newErrors.price = 'Preis kann nicht negativ sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        name: '',
        nameGerman: '',
        description: '',
        duration: 30,
        price: 0,
        category: ServiceCategory.MASSAGE,
        categoryColor: '#10B981',
        isForChildren: false,
        isVoucher: false,
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating service:', error);
    }
  };

  const handleInputChange = (field: keyof CreateServiceData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="m-4">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Neue Dienstleistung erstellen</h2>
                    <p className="text-sm text-muted-foreground">
                      Neue therapeutische Dienstleistung zum System hinzufügen
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Service Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Dienstleistungsname"
                    placeholder="z.B. Tiefengewebsmassage"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={errors.name}
                    required
                  />
                  <Input
                    label="Deutscher Name (optional)"
                    placeholder="z.B. Alternative deutsche Bezeichnung"
                    value={formData.nameGerman || ''}
                    onChange={(e) => handleInputChange('nameGerman', e.target.value)}
                  />
                </div>

                {/* Description */}
                <Input
                  label="Beschreibung"
                  placeholder="Kurze Beschreibung der Dienstleistung"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                />

                {/* Category and Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Kategorie"
                    value={formData.category}
                    onChange={(value) => handleInputChange('category', value)}
                    options={categoryOptions}
                    required
                  />
                  <Select
                    label="Dauer"
                    value={formData.duration.toString()}
                    onChange={(value) => handleInputChange('duration', parseInt(value))}
                    options={durationOptions}
                    required
                  />
                </div>

                {/* Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Preis (€)"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    error={errors.price}
                    required
                  />
                  <Input
                    label="Kategorienfarbe"
                    type="color"
                    value={formData.categoryColor || '#10B981'}
                    onChange={(e) => handleInputChange('categoryColor', e.target.value)}
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <Checkbox
                    label="Kinderdienstleistung"
                    description="Diese Dienstleistung ist für Kinder verfügbar"
                    checked={formData.isForChildren || false}
                    onChange={(e) => handleInputChange('isForChildren', e.target.checked)}
                  />
                  <Checkbox
                    label="Gutschein-Dienstleistung"
                    description="Diese Dienstleistung kann als Gutschein erworben werden"
                    checked={formData.isVoucher || false}
                    onChange={(e) => handleInputChange('isVoucher', e.target.checked)}
                  />
                </div>

                {/* Preview */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">Vorschau:</h4>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="secondary" 
                      style={{ 
                        backgroundColor: formData.categoryColor + '20',
                        color: formData.categoryColor 
                      }}
                    >
                      {categoryOptions.find(opt => opt.value === formData.category)?.label}
                    </Badge>
                    <span className="font-medium">{formData.name || 'Dienstleistungsname'}</span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formData.duration} Min</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Euro className="h-3 w-3" />
                      <span>{formData.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Dienstleistung erstellen
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
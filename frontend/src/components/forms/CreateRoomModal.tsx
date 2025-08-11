import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Building,
  Users,
  Plus,
  Trash2,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CreateRoomData } from '@/services/rooms';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRoomData) => Promise<void>;
  isLoading?: boolean;
}

export function CreateRoomModal({ isOpen, onClose, onSubmit, isLoading = false }: CreateRoomModalProps) {
  const [formData, setFormData] = useState<CreateRoomData>({
    name: '',
    description: '',
    features: [],
    capacity: 1,
  });

  const [newFeature, setNewFeature] = useState('');
  const [errors, setErrors] = useState<Partial<CreateRoomData>>({});

  const commonFeatures = [
    'Massageliege',
    'Soundsystem',
    'Klimaanlage',
    'Dimmerbeleuchtung',
    'Ätherische Öle',
    'Fitnessgeräte',
    'Behandlungsliege',
    'Widerstandsbänder',
    'Infrarot-Stuhl',
    'Entspannungsmusik',
    'Kraftgeräte',
    'Cardio-Geräte',
    'Spiegel',
    'Yogamatten',
    'Wasserspender',
    'Sichtschutz',
    'Schreibtisch',
    'Computer',
    'Aktenschrank',
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateRoomData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Raumname ist erforderlich';
    }
    
    if (formData.capacity <= 0) {
      newErrors.capacity = 'Kapazität muss größer als 0 sein';
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
        description: '',
        features: [],
        capacity: 1,
      });
      setNewFeature('');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleInputChange = (field: keyof CreateRoomData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addFeature = (feature: string) => {
    if (feature.trim() && !formData.features.includes(feature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== featureToRemove)
    }));
  };

  const addCommonFeature = (feature: string) => {
    if (!formData.features.includes(feature)) {
      addFeature(feature);
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
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Neuen Raum erstellen</h2>
                    <p className="text-sm text-muted-foreground">
                      Neuen Behandlungsraum oder Einrichtung hinzufügen
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
                {/* Room Name */}
                <Input
                  label="Raumname"
                  placeholder="z.B. Massageraum 1"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  required
                />

                {/* Description */}
                <Input
                  label="Beschreibung"
                  placeholder="Kurze Beschreibung des Raumes"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                />

                {/* Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Kapazität"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 1)}
                    error={errors.capacity}
                    required
                  />
                  <div className="flex items-end">
                    <div className="text-sm text-muted-foreground">
                      Maximale Anzahl Personen, die diesen Raum gleichzeitig nutzen können
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Raumausstattung</label>
                  
                  {/* Current Features */}
                  {formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.features.map((feature, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {feature}
                          <button
                            type="button"
                            onClick={() => removeFeature(feature)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Add Custom Feature */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Eigene Ausstattung hinzufügen..."
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addFeature(newFeature);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addFeature(newFeature)}
                      disabled={!newFeature.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Common Features */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Häufige Ausstattung schnell hinzufügen:</p>
                    <div className="flex flex-wrap gap-1">
                      {commonFeatures
                        .filter(f => !formData.features.includes(f))
                        .slice(0, 8)
                        .map((feature) => (
                          <button
                            key={feature}
                            type="button"
                            onClick={() => addCommonFeature(feature)}
                            className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                          >
                            + {feature}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">Vorschau:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formData.name || 'Raumname'}</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{formData.capacity}</span>
                      </div>
                    </div>
                    {formData.description && (
                      <p className="text-sm text-muted-foreground">{formData.description}</p>
                    )}
                    {formData.features.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    )}
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
                  Raum erstellen
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
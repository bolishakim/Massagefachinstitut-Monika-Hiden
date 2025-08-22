import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff, Save, Plus, Edit } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Stack } from '../ui/Layout';
import { Badge } from '../ui/Badge';
import { User, Role } from '@/types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserFormData) => Promise<void>;
  user?: User | null;
  title?: string;
  loading?: boolean;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  role: Role;
  password?: string;
}

const roleOptions = [
  { value: Role.USER, label: 'Benutzer' },
  { value: Role.MODERATOR, label: 'Moderator' },
  { value: Role.ADMIN, label: 'Administrator' },
];

export function UserModal({ 
  isOpen, 
  onClose, 
  onSave, 
  user, 
  title, 
  loading = false 
}: UserModalProps) {
  const isEditMode = Boolean(user);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    role: Role.USER,
    password: '',
  });
  const [errors, setErrors] = useState<Partial<UserFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username || '',
        email: user.email || '',
        role: user.role,
        password: '',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        role: Role.USER,
        password: '',
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vorname ist erforderlich';
    } else if (formData.firstName.length > 50) {
      newErrors.firstName = 'Vorname ist zu lang';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nachname ist erforderlich';
    } else if (formData.lastName.length > 50) {
      newErrors.lastName = 'Nachname ist zu lang';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Benutzername ist erforderlich';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Benutzername muss mindestens 3 Zeichen lang sein';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Benutzername ist zu lang';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      newErrors.username = 'Benutzername darf nur Buchstaben, Zahlen, Punkte, Unterstriche und Bindestriche enthalten';
    }

    // Email is optional now
    if (formData.email && formData.email.trim()) {
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
      }
    }

    if (!isEditMode && !formData.password) {
      newErrors.password = 'Passwort ist für neue Benutzer erforderlich';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      role: Role.USER,
      password: '',
    });
    setErrors({});
    onClose();
  };

  const modalTitle = title || (isEditMode ? 'Benutzer bearbeiten' : 'Neuen Benutzer hinzufügen');

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="lg"
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <div className="flex items-center space-x-2">
            {isEditMode ? (
              <Edit className="h-5 w-5 text-primary" />
            ) : (
              <Plus className="h-5 w-5 text-primary" />
            )}
            <ModalTitle>{modalTitle}</ModalTitle>
            {isEditMode && (
              <Badge variant={user?.isActive ? 'default' : 'secondary'}>
                {user?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>
        </ModalHeader>

        <ModalContent>
          <Stack space="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Vorname"
                placeholder="Vorname eingeben"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                error={errors.firstName}
                disabled={isSubmitting}
                required
              />
              <Input
                label="Nachname"
                placeholder="Nachname eingeben"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                error={errors.lastName}
                disabled={isSubmitting}
                required
              />
            </div>

            <Input
              label="Benutzername"
              placeholder="Benutzername eingeben"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={errors.username}
              disabled={isSubmitting}
              required
              helperText="Für die Anmeldung verwendet. Mindestens 3 Zeichen, nur Buchstaben, Zahlen, Punkte, Unterstriche und Bindestriche."
            />

            <Input
              label="E-Mail-Adresse"
              type="email"
              placeholder="E-Mail-Adresse eingeben (optional)"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              disabled={isSubmitting}
              helperText="Optional - wird für Benachrichtigungen verwendet, falls angegeben"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Rolle
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Select
                  options={roleOptions}
                  value={formData.role}
                  onChange={(value) => setFormData({ ...formData, role: value as Role })}
                  placeholder="Rolle auswählen"
                  disabled={isSubmitting}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Passwort {!isEditMode && <span className="text-red-500 ml-1">*</span>}
                  {isEditMode && <span className="text-muted-foreground text-xs">(leer lassen, um das aktuelle zu behalten)</span>}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isEditMode ? 'Neues Passwort eingeben (optional)' : 'Passwort eingeben'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={errors.password}
                    disabled={isSubmitting}
                    required={!isEditMode}
                  />
                  {formData.password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isEditMode && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">Account Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Login:</span>
                    <span className="ml-2">
                      {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email Verified:</span>
                    <Badge 
                      variant={user?.emailVerified ? 'default' : 'secondary'} 
                      className="ml-2 text-xs"
                    >
                      {user?.emailVerified ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge 
                      variant={user?.isActive ? 'default' : 'secondary'} 
                      className="ml-2 text-xs"
                    >
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {!isEditMode && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                💡 <strong>Tip:</strong> New users will receive an email with login instructions. 
                Admin users are automatically verified.
              </div>
            )}
          </Stack>
        </ModalContent>

        <ModalFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="default"
            disabled={isSubmitting || loading}
            className="min-w-24"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? 'Save Changes' : 'Create User'}
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
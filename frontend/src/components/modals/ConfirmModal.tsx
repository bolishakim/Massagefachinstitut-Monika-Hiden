import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2, UserX, UserCheck } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false,
}: ConfirmModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      case 'info':
        return <AlertTriangle className="h-6 w-6 text-blue-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
    }
  };

  const getConfirmVariant = () => {
    switch (type) {
      case 'danger':
        return 'destructive' as const;
      case 'warning':
        return 'outline' as const;
      case 'info':
        return 'default' as const;
      default:
        return 'destructive' as const;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={loading ? () => {} : onClose}
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <ModalHeader>
        <div className="flex items-center space-x-3">
          {getIcon()}
          <ModalTitle>{title}</ModalTitle>
        </div>
      </ModalHeader>

      <ModalContent>
        <div className="text-sm text-muted-foreground">
          {message}
        </div>
      </ModalContent>

      <ModalFooter>
        <Button 
          variant="outline" 
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button 
          variant={getConfirmVariant()}
          onClick={onConfirm}
          disabled={loading}
          className="min-w-24"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            />
          ) : (
            confirmText
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Specific confirmation modals for common user actions
interface UserConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  loading?: boolean;
}

export function DeleteUserModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName, 
  loading = false 
}: UserConfirmModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Benutzer löschen"
      message={`Sind Sie sicher, dass Sie ${userName} löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden und alle Benutzerdaten werden dauerhaft entfernt.`}
      confirmText="Benutzer löschen"
      cancelText="Abbrechen"
      type="danger"
      loading={loading}
    />
  );
}

export function ToggleUserStatusModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName, 
  currentStatus,
  loading = false 
}: UserConfirmModalProps & { currentStatus: boolean }) {
  const action = currentStatus ? 'deactivate' : 'activate';
  const actionPast = currentStatus ? 'deactivated' : 'activated';
  
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`${action.charAt(0).toUpperCase() + action.slice(1)} User`}
      message={`Are you sure you want to ${action} ${userName}? ${
        currentStatus 
          ? 'They will no longer be able to access the system.' 
          : 'They will regain access to the system.'
      }`}
      confirmText={`${action.charAt(0).toUpperCase() + action.slice(1)} User`}
      type={currentStatus ? 'warning' : 'info'}
      loading={loading}
    />
  );
}
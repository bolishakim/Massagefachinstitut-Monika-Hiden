import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  variant = 'warning',
  isLoading = false
}: ConfirmDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          confirmButtonVariant: 'destructive' as const
        };
      case 'warning':
        return {
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-100',
          confirmButtonVariant: 'default' as const
        };
      case 'info':
        return {
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          confirmButtonVariant: 'default' as const
        };
      default:
        return {
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-100',
          confirmButtonVariant: 'default' as const
        };
    }
  };

  const styles = getVariantStyles();

  const handleConfirm = () => {
    onConfirm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
    if (e.key === 'Enter' && !isLoading) {
      handleConfirm();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={!isLoading ? onClose : undefined}
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-background rounded-lg shadow-xl border max-w-md w-full mx-4"
              onKeyDown={handleKeyDown}
              tabIndex={-1}
            >
              {/* Header */}
              <div className="flex items-start gap-4 p-6 pb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
                  <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    {title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {message}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 px-6 pb-6">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {cancelText}
                </Button>
                <Button
                  variant={styles.confirmButtonVariant}
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
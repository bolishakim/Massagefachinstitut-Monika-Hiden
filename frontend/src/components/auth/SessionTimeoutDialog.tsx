import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface SessionTimeoutDialogProps {
  show: boolean;
  timeRemaining: string;
  onExtendSession: () => void;
  onLogout: () => void;
}

export function SessionTimeoutDialog({
  show,
  timeRemaining,
  onExtendSession,
  onLogout
}: SessionTimeoutDialogProps) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()} // Prevent clicking outside to close
        />
        
        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <Card className="p-6 border-2 border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-900">
            {/* Warning Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Sitzung läuft ab
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ihre Sitzung läuft aufgrund von Inaktivität ab.
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Automatische Abmeldung in:
                </span>
              </div>
              <div className="text-center">
                <span className="text-3xl font-mono font-bold text-orange-600 dark:text-orange-400">
                  {timeRemaining}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300"
              >
                <LogOut className="w-4 h-4" />
                Abmelden
              </Button>
              <Button
                size="sm"
                onClick={onExtendSession}
                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCw className="w-4 h-4" />
                Verlängern
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Klicken Sie auf "Verlängern" um Ihre Sitzung fortzusetzen
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
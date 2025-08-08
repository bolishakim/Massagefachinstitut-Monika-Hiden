import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  title?: string;
}

export function Alert({ 
  children, 
  variant = 'default', 
  className,
  dismissible = false,
  onDismiss,
  icon,
  title 
}: AlertProps) {
  const baseClasses = [
    'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  ];

  const variantClasses = {
    default: 'bg-background text-foreground',
    success: 'border-success/50 text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-950/30',
    warning: 'border-warning/50 text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-950/30',
    destructive: 'border-destructive/50 text-destructive-600 dark:text-destructive-400 bg-destructive-50 dark:bg-destructive-950/30',
    info: 'border-info/50 text-info-600 dark:text-info-400 bg-info-50 dark:bg-info-950/30',
  };

  const getDefaultIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'destructive':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={clsx(baseClasses, variantClasses[variant], className)}
    >
      {icon || getDefaultIcon()}
      <div className="flex-1">
        {title && (
          <AlertTitle className="mb-1">
            {title}
          </AlertTitle>
        )}
        <AlertDescription>
          {children}
        </AlertDescription>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </button>
      )}
    </motion.div>
  );
}

export function AlertTitle({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <h5 className={clsx('mb-1 font-medium leading-none tracking-tight', className)}>
      {children}
    </h5>
  );
}

export function AlertDescription({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={clsx('text-sm [&_p]:leading-relaxed', className)}>
      {children}
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className,
  animate = false 
}: BadgeProps) {
  const baseClasses = [
    'inline-flex items-center justify-center rounded-full font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ];

  const variantClasses = {
    default: 'bg-primary/10 text-primary hover:bg-primary/20',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    success: 'bg-success/10 text-success hover:bg-success/20',
    warning: 'bg-warning/10 text-warning hover:bg-warning/20',
    info: 'bg-info/10 text-info hover:bg-info/20',
    destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 h-5',
    md: 'text-xs px-3 py-1 h-6',
    lg: 'text-sm px-4 py-1.5 h-7',
  };

  const content = (
    <span className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
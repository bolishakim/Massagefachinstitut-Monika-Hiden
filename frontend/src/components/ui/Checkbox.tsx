import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { clsx } from 'clsx';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  indeterminate?: boolean;
  animate?: boolean;
}

export function Checkbox({
  label,
  description,
  error,
  size = 'md',
  indeterminate = false,
  animate = true,
  className,
  ...props
}: CheckboxProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const checkboxId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  const checkmarkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1 },
  };

  const checkboxVariants = {
    unchecked: { scale: 1 },
    checked: { scale: 1.05 },
  };

  return (
    <div className={clsx('flex items-start gap-3', className)}>
      <div className="flex items-center">
        <div className="relative">
          <input
            type="checkbox"
            id={checkboxId}
            className="sr-only"
            {...props}
          />
          <motion.label
            htmlFor={checkboxId}
            variants={animate ? checkboxVariants : undefined}
            animate={props.checked ? 'checked' : 'unchecked'}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={clsx(
              'flex items-center justify-center rounded border-2 cursor-pointer transition-colors',
              sizeClasses[size],
              props.checked || indeterminate
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-input hover:border-primary',
              props.disabled && 'opacity-50 cursor-not-allowed',
              error && 'border-destructive'
            )}
          >
            <AnimatePresence>
              {(props.checked || indeterminate) && (
                <motion.div
                  initial={animate ? 'hidden' : false}
                  animate="visible"
                  exit="hidden"
                  variants={animate ? checkmarkVariants : undefined}
                  transition={{ duration: 0.2 }}
                >
                  {indeterminate ? (
                    <Minus className="h-3 w-3" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.label>
        </div>
      </div>

      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label
              htmlFor={checkboxId}
              className={clsx(
                'text-sm font-medium leading-none cursor-pointer',
                props.disabled && 'opacity-50 cursor-not-allowed',
                error ? 'text-destructive' : 'text-foreground'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={clsx(
              'text-sm mt-1',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {description}
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function CheckboxGroup({
  children,
  label,
  description,
  error,
  className,
}: {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  className?: string;
}) {
  return (
    <fieldset className={clsx('space-y-2', className)}>
      {label && (
        <legend className="text-sm font-medium leading-none text-foreground">
          {label}
        </legend>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="space-y-3">
        {children}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </fieldset>
  );
}
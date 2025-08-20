import React from 'react';
import { clsx } from 'clsx';

interface SimpleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function SimpleSelect({
  label,
  error,
  className,
  children,
  ...props
}: SimpleSelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2" htmlFor={props.id}>
          {label}
        </label>
      )}
      <select
        className={clsx(
          'w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-destructive focus:ring-destructive',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
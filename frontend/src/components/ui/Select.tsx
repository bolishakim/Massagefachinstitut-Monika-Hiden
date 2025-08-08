import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
  clearable?: boolean;
}

export function Select({
  options,
  value,
  defaultValue,
  placeholder = 'Select an option',
  onChange,
  disabled = false,
  error,
  label,
  className,
  clearable = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '');
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === selectedValue);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    
    setSelectedValue(option.value);
    onChange?.(option.value);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedValue('');
    onChange?.('');
  };

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  };

  return (
    <div className={clsx('relative', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
          {label}
        </label>
      )}
      
      <div ref={selectRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={clsx(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:ring-destructive',
            isOpen && 'ring-2 ring-ring ring-offset-2'
          )}
        >
          <span className={clsx(
            selectedOption ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          
          <div className="flex items-center gap-1">
            {clearable && selectedValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-accent rounded-sm transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <ChevronDown 
              className={clsx(
                'h-4 w-4 transition-transform duration-200',
                isOpen && 'rotate-180'
              )} 
            />
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-elegant max-h-60 overflow-auto"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={option.disabled}
                  className={clsx(
                    'relative flex w-full cursor-pointer select-none items-center py-2 pl-8 pr-2 text-sm outline-none',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground',
                    'disabled:pointer-events-none disabled:opacity-50',
                    option.value === selectedValue && 'bg-accent text-accent-foreground'
                  )}
                >
                  <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                    {option.value === selectedValue && <Check className="h-3 w-3" />}
                  </span>
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
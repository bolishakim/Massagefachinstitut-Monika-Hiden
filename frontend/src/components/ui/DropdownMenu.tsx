import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  show?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function DropdownMenu({ trigger, items, align = 'end', className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const visibleItems = items.filter(item => item.show !== false);

  return (
    <div className={clsx('relative inline-block', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && visibleItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={clsx(
              'absolute z-50 mt-1 min-w-[180px] rounded-md bg-background border shadow-lg',
              'focus:outline-none',
              align === 'start' && 'left-0',
              align === 'center' && 'left-1/2 -translate-x-1/2',
              align === 'end' && 'right-0'
            )}
            onKeyDown={handleKeyDown}
          >
            <div className="py-1">
              {visibleItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick();
                      setIsOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                  className={clsx(
                    'w-full px-4 py-2 text-sm text-left flex items-center gap-2',
                    'transition-colors',
                    item.disabled && 'opacity-50 cursor-not-allowed',
                    !item.disabled && 'hover:bg-muted',
                    item.variant === 'destructive' && !item.disabled && 'text-destructive hover:bg-destructive/10',
                    index > 0 && visibleItems[index - 1].variant !== item.variant && 'border-t'
                  )}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
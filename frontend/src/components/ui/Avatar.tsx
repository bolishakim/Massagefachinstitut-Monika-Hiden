import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { clsx } from 'clsx';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
  className?: string;
  animate?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  fallback, 
  className,
  animate = false,
  status 
}: AvatarProps) {
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-20 w-20 text-2xl',
  };

  const statusClasses = {
    online: 'bg-success border-background',
    offline: 'bg-secondary border-background',
    away: 'bg-warning border-background',
    busy: 'bg-destructive border-background',
  };

  const statusSizeClasses = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
    '2xl': 'h-5 w-5',
  };

  const avatarContent = (
    <div className={clsx('relative inline-block', className)}>
      <div className={clsx(
        'flex items-center justify-center rounded-full bg-muted overflow-hidden',
        sizeClasses[size]
      )}>
        {src ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="h-full w-full object-cover"
          />
        ) : fallback ? (
          <span className="font-medium text-muted-foreground">
            {fallback}
          </span>
        ) : (
          <User className="h-1/2 w-1/2 text-muted-foreground" />
        )}
      </div>
      {status && (
        <motion.span
          initial={animate ? { scale: 0 } : false}
          animate={animate ? { scale: 1 } : false}
          className={clsx(
            'absolute bottom-0 right-0 block rounded-full border-2',
            statusClasses[status],
            statusSizeClasses[size]
          )}
        />
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {avatarContent}
      </motion.div>
    );
  }

  return avatarContent;
}

export function AvatarGroup({ 
  children, 
  max = 3, 
  className 
}: { 
  children: React.ReactNode[]; 
  max?: number; 
  className?: string; 
}) {
  const childrenArray = React.Children.toArray(children);
  const displayedChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <div className={clsx('flex -space-x-2', className)}>
      {displayedChildren.map((child, index) => (
        <div key={index} className="ring-2 ring-background rounded-full">
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="flex items-center justify-center rounded-full bg-muted text-muted-foreground h-10 w-10 text-sm font-medium ring-2 ring-background">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
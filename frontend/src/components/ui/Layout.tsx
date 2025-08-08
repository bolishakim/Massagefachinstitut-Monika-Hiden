import React from 'react';
import { clsx } from 'clsx';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export function Section({ 
  children, 
  className, 
  as: Component = 'section',
  padding = 'md'
}: SectionProps) {
  const paddingClasses = {
    none: '',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24',
  };

  return (
    <Component className={clsx(paddingClasses[padding], className)}>
      {children}
    </Component>
  );
}

interface StackProps {
  children: React.ReactNode;
  space?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

export function Stack({ 
  children, 
  space = 'md', 
  align = 'stretch',
  className 
}: StackProps) {
  const spaceClasses = {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
    '2xl': 'space-y-12',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div className={clsx(
      'flex flex-col',
      spaceClasses[space],
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
}

interface InlineProps {
  children: React.ReactNode;
  space?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'baseline';
  wrap?: boolean;
  className?: string;
}

export function Inline({ 
  children, 
  space = 'md', 
  align = 'center',
  wrap = true,
  className 
}: InlineProps) {
  const spaceClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
  };

  return (
    <div className={clsx(
      'flex',
      spaceClasses[space],
      alignClasses[align],
      wrap ? 'flex-wrap' : 'flex-nowrap',
      className
    )}>
      {children}
    </div>
  );
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SidebarLayout({
  children,
  sidebar,
  sidebarPosition = 'left',
  sidebarWidth = 'md',
  className,
}: SidebarLayoutProps) {
  const sidebarWidthClasses = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
  };

  return (
    <div className={clsx('flex min-h-screen', className)}>
      {sidebarPosition === 'left' && (
        <aside className={clsx('flex-shrink-0', sidebarWidthClasses[sidebarWidth])}>
          {sidebar}
        </aside>
      )}
      <main className="flex-1 min-w-0">
        {children}
      </main>
      {sidebarPosition === 'right' && (
        <aside className={clsx('flex-shrink-0', sidebarWidthClasses[sidebarWidth])}>
          {sidebar}
        </aside>
      )}
    </div>
  );
}

interface CenterProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
  className?: string;
}

export function Center({ 
  children, 
  maxWidth = 'lg',
  className 
}: CenterProps) {
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    none: 'max-w-none',
  };

  return (
    <div className={clsx(
      'mx-auto',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  text?: string;
}

export function Divider({ 
  orientation = 'horizontal', 
  className,
  text 
}: DividerProps) {
  if (text) {
    return (
      <div className={clsx('relative', className)}>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{text}</span>
        </div>
      </div>
    );
  }

  if (orientation === 'vertical') {
    return <div className={clsx('border-l border-border h-full', className)} />;
  }

  return <hr className={clsx('border-t border-border w-full', className)} />;
}
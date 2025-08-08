import React from 'react';
import { clsx } from 'clsx';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

// Display Components
export function DisplayXL({ children, className, as: Component = 'h1' }: TypographyProps) {
  return (
    <Component className={clsx('text-display-2xl font-bold tracking-tight', className)}>
      {children}
    </Component>
  );
}

export function DisplayLG({ children, className, as: Component = 'h1' }: TypographyProps) {
  return (
    <Component className={clsx('text-display-lg font-bold tracking-tight', className)}>
      {children}
    </Component>
  );
}

export function DisplayMD({ children, className, as: Component = 'h1' }: TypographyProps) {
  return (
    <Component className={clsx('text-display-md font-bold tracking-tight', className)}>
      {children}
    </Component>
  );
}

export function DisplaySM({ children, className, as: Component = 'h2' }: TypographyProps) {
  return (
    <Component className={clsx('text-display-sm font-bold tracking-tight', className)}>
      {children}
    </Component>
  );
}

// Heading Components
export function H1({ children, className, as: Component = 'h1' }: TypographyProps) {
  return (
    <Component className={clsx('text-4xl font-bold tracking-tight lg:text-5xl', className)}>
      {children}
    </Component>
  );
}

export function H2({ children, className, as: Component = 'h2' }: TypographyProps) {
  return (
    <Component className={clsx('text-3xl font-semibold tracking-tight lg:text-4xl', className)}>
      {children}
    </Component>
  );
}

export function H3({ children, className, as: Component = 'h3' }: TypographyProps) {
  return (
    <Component className={clsx('text-2xl font-semibold tracking-tight lg:text-3xl', className)}>
      {children}
    </Component>
  );
}

export function H4({ children, className, as: Component = 'h4' }: TypographyProps) {
  return (
    <Component className={clsx('text-xl font-semibold tracking-tight lg:text-2xl', className)}>
      {children}
    </Component>
  );
}

export function H5({ children, className, as: Component = 'h5' }: TypographyProps) {
  return (
    <Component className={clsx('text-lg font-semibold tracking-tight lg:text-xl', className)}>
      {children}
    </Component>
  );
}

export function H6({ children, className, as: Component = 'h6' }: TypographyProps) {
  return (
    <Component className={clsx('text-base font-semibold tracking-tight lg:text-lg', className)}>
      {children}
    </Component>
  );
}

// Text Components
export function TextLG({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={clsx('text-lg leading-7', className)}>
      {children}
    </Component>
  );
}

export function TextMD({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={clsx('text-base leading-6', className)}>
      {children}
    </Component>
  );
}

export function TextSM({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={clsx('text-sm leading-5', className)}>
      {children}
    </Component>
  );
}

export function TextXS({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={clsx('text-xs leading-4', className)}>
      {children}
    </Component>
  );
}

// Special Text Components
export function Lead({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={clsx('text-xl text-muted-foreground leading-8', className)}>
      {children}
    </Component>
  );
}

export function Subtitle({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={clsx('text-lg text-muted-foreground leading-7', className)}>
      {children}
    </Component>
  );
}

export function Caption({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={clsx('text-sm text-muted-foreground leading-5', className)}>
      {children}
    </Component>
  );
}

export function Overline({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={clsx('text-xs font-medium uppercase tracking-wide text-muted-foreground leading-4', className)}>
      {children}
    </Component>
  );
}

// Code Components
export function Code({ children, className, as: Component = 'code' }: TypographyProps) {
  return (
    <Component className={clsx(
      'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-medium',
      className
    )}>
      {children}
    </Component>
  );
}

export function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <pre className={clsx(
      'rounded-lg bg-muted p-4 overflow-x-auto',
      'border border-border',
      className
    )}>
      <code className="font-mono text-sm">{children}</code>
    </pre>
  );
}

// List Components
export function UnorderedList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ul className={clsx('list-disc list-inside space-y-2', className)}>
      {children}
    </ul>
  );
}

export function OrderedList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ol className={clsx('list-decimal list-inside space-y-2', className)}>
      {children}
    </ol>
  );
}

export function ListItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <li className={clsx('text-base leading-6', className)}>
      {children}
    </li>
  );
}

// Quote Component
export function Blockquote({ children, className, cite }: { 
  children: React.ReactNode; 
  className?: string;
  cite?: string;
}) {
  return (
    <blockquote className={clsx(
      'border-l-4 border-primary pl-6 italic text-muted-foreground',
      className
    )}>
      {children}
      {cite && <cite className="block text-sm font-medium not-italic mt-2">— {cite}</cite>}
    </blockquote>
  );
}

// Link Component
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'muted';
  underline?: 'always' | 'hover' | 'none';
}

export function Link({ 
  children, 
  className, 
  variant = 'default',
  underline = 'hover',
  ...props 
}: LinkProps) {
  const variantClasses = {
    default: 'text-primary hover:text-primary/80',
    subtle: 'text-foreground hover:text-primary',
    muted: 'text-muted-foreground hover:text-foreground',
  };

  const underlineClasses = {
    always: 'underline',
    hover: 'hover:underline',
    none: 'no-underline',
  };

  return (
    <a 
      className={clsx(
        'font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        variantClasses[variant],
        underlineClasses[underline],
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}
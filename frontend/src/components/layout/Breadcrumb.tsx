import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { clsx } from 'clsx';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
}

export function Breadcrumb({ 
  items, 
  className, 
  showHome = true,
  separator = <ChevronRight className="h-4 w-4" />
}: BreadcrumbProps) {
  const allItems = showHome 
    ? [{ label: 'Home', href: '/dashboard' }, ...items]
    : items;

  if (allItems.length === 0) return null;

  return (
    <nav 
      className={clsx('flex items-center space-x-1 text-sm text-muted-foreground', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1" role="list">
        {allItems.map((item, index) => (
          <li key={index} className="flex items-center space-x-1" role="listitem">
            {index > 0 && (
              <span className="text-muted-foreground/50" aria-hidden="true">
                {separator}
              </span>
            )}
            
            {index === 0 && showHome && (
              <Home className="h-4 w-4 mr-1" aria-hidden="true" />
            )}
            
            {item.href && index < allItems.length - 1 ? (
              <a
                href={item.href}
                className="hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1"
              >
                {item.label}
              </a>
            ) : (
              <span 
                className={clsx(
                  'px-1',
                  index === allItems.length - 1 && 'text-foreground font-medium'
                )}
                aria-current={index === allItems.length - 1 ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Hook to generate breadcrumbs from current path
export function useBreadcrumbs(currentPath?: string): BreadcrumbItem[] {
  if (!currentPath) return [];

  const segments = currentPath.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Route mapping for better labels
  const routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    users: 'Users',
    products: 'Products',
    orders: 'Orders',
    analytics: 'Analytics',
    settings: 'Settings',
    billing: 'Billing',
    security: 'Security',
    profile: 'Profile',
    categories: 'Categories',
  };

  let currentHref = '';
  
  segments.forEach((segment, index) => {
    currentHref += `/${segment}`;
    
    // Skip if it's an ID (numeric or UUID-like)
    const isId = /^\d+$/.test(segment) || /^[0-9a-f-]{36}$/i.test(segment);
    if (isId && index < segments.length - 1) return;
    
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentHref,
    });
  });

  return breadcrumbs;
}

// Breadcrumb variants for different contexts
export function SimpleBreadcrumb({ 
  items, 
  className 
}: { 
  items: BreadcrumbItem[]; 
  className?: string; 
}) {
  return (
    <Breadcrumb 
      items={items} 
      className={className}
      showHome={false}
      separator={<span>/</span>}
    />
  );
}

export function CompactBreadcrumb({ 
  items, 
  className 
}: { 
  items: BreadcrumbItem[]; 
  className?: string; 
}) {
  // Show only last 3 items for compact view
  const compactItems = items.length > 3 
    ? [
        { label: '...', href: undefined },
        ...items.slice(-2)
      ]
    : items;

  return (
    <Breadcrumb 
      items={compactItems} 
      className={className}
      separator={<ChevronRight className="h-3 w-3" />}
    />
  );
}
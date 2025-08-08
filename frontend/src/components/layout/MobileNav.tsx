import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  BarChart3, 
  Package, 
  FileText, 
  Settings,
  Plus
} from 'lucide-react';
import { clsx } from 'clsx';
import { Badge } from '../ui/Badge';

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  requiredRoles?: string[];
}

interface MobileNavProps {
  currentPath?: string;
  userRole?: string;
}

const mobileNavItems: MobileNavItem[] = [
  {
    id: 'dashboard',
    label: 'Home',
    icon: Home,
    href: '/dashboard',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    requiredRoles: ['admin', 'manager'],
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    href: '/products',
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: FileText,
    href: '/orders',
    badge: '3',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
  },
];

export function MobileNav({ currentPath, userRole = 'user' }: MobileNavProps) {
  const filterItemsByRole = (items: MobileNavItem[]): MobileNavItem[] => {
    return items.filter(item => {
      if (!item.requiredRoles) return true;
      return item.requiredRoles.includes(userRole);
    });
  };

  const isActiveRoute = (href: string): boolean => {
    if (!currentPath) return false;
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  const visibleItems = filterItemsByRole(mobileNavItems);

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-40">
        <div className="flex">
          {visibleItems.slice(0, 4).map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <a
                key={item.id}
                href={item.href}
                className={clsx(
                  'flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors relative',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5 mb-1" />
                  {item.badge && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="truncate max-w-full">{item.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute top-0 left-1/2 w-8 h-0.5 bg-primary rounded-full"
                    style={{ x: '-50%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </a>
            );
          })}
          
          {/* More/Overflow button if there are more than 4 items */}
          {visibleItems.length > 4 && (
            <MoreButton 
              items={visibleItems.slice(4)} 
              currentPath={currentPath}
            />
          )}
        </div>
        
        {/* Safe area for devices with home indicator */}
        <div className="h-safe-bottom bg-background" />
      </nav>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 md:hidden z-30">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-elegant flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Quick action"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </div>
    </>
  );
}

interface MoreButtonProps {
  items: MobileNavItem[];
  currentPath?: string;
}

function MoreButton({ items, currentPath }: MoreButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const hasActiveItem = items.some(item => 
    currentPath === item.href || currentPath?.startsWith(item.href + '/')
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          'flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset',
          hasActiveItem
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Settings className="h-5 w-5 mb-1" />
        <span>More</span>
        {hasActiveItem && (
          <motion.div
            layoutId="mobile-nav-indicator"
            className="absolute top-0 left-1/2 w-8 h-0.5 bg-primary rounded-full"
            style={{ x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </button>

      {/* More Items Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full bg-background rounded-t-lg border-t border-border p-6 pb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">More Options</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {items.map((item) => {
                const isActive = currentPath === item.href || currentPath?.startsWith(item.href + '/');
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={clsx(
                      'flex flex-col items-center justify-center p-4 rounded-lg border transition-colors',
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  Settings, 
  BarChart3, 
  FileText, 
  Package, 
  CreditCard,
  Shield,
  Menu,
  X,
  ChevronLeft,
  Search,
  Bot
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  requiredRoles?: string[];
  children?: NavItem[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentPath?: string;
  userRole?: string;
  isMobile?: boolean;
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    id: 'assistant',
    label: 'AI Assistant',
    icon: Bot,
    href: '/assistant',
    badge: 'AI',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    requiredRoles: ['admin', 'manager'],
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    href: '/users',
    requiredRoles: ['admin'],
    badge: 'New',
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    href: '/products',
    children: [
      {
        id: 'products-list',
        label: 'All Products',
        icon: Package,
        href: '/products',
      },
      {
        id: 'products-categories',
        label: 'Categories',
        icon: Package,
        href: '/products/categories',
      },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: FileText,
    href: '/orders',
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    href: '/billing',
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    href: '/security',
    requiredRoles: ['admin'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
  },
];

export function Sidebar({ collapsed, onToggle, currentPath, userRole = 'user', isMobile = false }: SidebarProps) {
  const filterItemsByRole = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      if (!item.requiredRoles) return true;
      return item.requiredRoles.includes(userRole);
    });
  };

  const isActiveRoute = (href: string): boolean => {
    if (!currentPath) return false;
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  const visibleItems = filterItemsByRole(navigationItems);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={clsx(
        'flex items-center justify-between p-4 border-b border-border',
        collapsed && !isMobile && 'px-2'
      )}>
        {(!collapsed || isMobile) && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-foreground">App Name</span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={clsx(
            'p-1.5',
            collapsed && !isMobile && 'w-full justify-center'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isMobile ? (
            <X className="h-4 w-4" />
          ) : collapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Search */}
      {(!collapsed || isMobile) && (
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4" role="navigation" aria-label="Main navigation">
        <ul className="space-y-1 px-2">
          {visibleItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              collapsed={collapsed && !isMobile}
              isActive={isActiveRoute(item.href)}
              currentPath={currentPath}
            />
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {(!collapsed || isMobile) && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Version 1.0.0
          </div>
        </div>
      )}
    </div>
  );
}

interface NavItemProps {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  currentPath?: string;
  level?: number;
}

function NavItem({ item, collapsed, isActive, currentPath, level = 0 }: NavItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(isActive);
  const hasChildren = item.children && item.children.length > 0;

  React.useEffect(() => {
    if (isActive) setIsExpanded(true);
  }, [isActive]);

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren && !collapsed) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <li>
      <a
        href={item.href}
        onClick={handleClick}
        className={clsx(
          'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative group',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          isActive 
            ? 'bg-primary text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          collapsed && 'justify-center px-2',
          level > 0 && 'ml-6'
        )}
        role="menuitem"
        aria-current={isActive ? 'page' : undefined}
      >
        <item.icon className={clsx('h-4 w-4 flex-shrink-0', !collapsed && 'mr-3')} />
        
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.div>
            )}
          </>
        )}

        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-popover border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <span className="text-xs whitespace-nowrap">{item.label}</span>
          </div>
        )}
      </a>

      {/* Children */}
      {hasChildren && !collapsed && (
        <motion.ul
          initial={false}
          animate={{ 
            height: isExpanded ? 'auto' : 0,
            opacity: isExpanded ? 1 : 0
          }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          {item.children?.map((child) => (
            <NavItem
              key={child.id}
              item={child}
              collapsed={false}
              isActive={currentPath === child.href}
              currentPath={currentPath}
              level={level + 1}
            />
          ))}
        </motion.ul>
      )}
    </li>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  User,
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
  Bot,
  Calendar,
  UserPlus,
  Stethoscope,
  Clock,
  Building2,
  Briefcase,
  Plus
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { AppName, AppNameShort } from '../ui/AppName';
import { FileTextPlus } from '../ui/FileTextPlus';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType | React.ComponentType<{ className?: string }>;
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
    label: 'Übersicht',
    icon: Home,
    href: '/dashboard',
  },
  {
    id: 'calendar',
    label: 'Terminkalender',
    icon: Calendar,
    href: '/calendar',
    badge: 'Heute',
  },
  {
    id: 'patients',
    label: 'Patienten',
    icon: UserPlus,
    href: '/patients',
    children: [
      {
        id: 'patients-list',
        label: 'Alle Patienten',
        icon: Users,
        href: '/patients',
      },
      {
        id: 'patients-add',
        label: 'Neuer Patient',
        icon: UserPlus,
        href: '/patients/new',
      },
      {
        id: 'patients-history',
        label: 'Krankengeschichte',
        icon: FileText,
        href: '/patients/history',
      },
      {
        id: 'patients-history-new',
        label: 'Neue Krankengeschichte',
        icon: FileTextPlus,
        href: '/patients/history/new',
      },
    ],
  },
  {
    id: 'appointments',
    label: 'Termine',
    icon: Clock,
    href: '/appointments',
    children: [
      {
        id: 'appointments-schedule',
        label: 'Terminplanung',
        icon: Calendar,
        href: '/appointments',
      },
      {
        id: 'appointments-new',
        label: 'Neuer Termin',
        icon: Clock,
        href: '/appointments/new',
      },
    ],
  },
  {
    id: 'services',
    label: 'Behandlungen',
    icon: Stethoscope,
    href: '/services',
    children: [
      {
        id: 'services-list',
        label: 'Alle Behandlungen',
        icon: Stethoscope,
        href: '/services',
      },
      {
        id: 'services-packages',
        label: 'Pakete & Voucher',
        icon: Package,
        href: '/services/packages',
      },
    ],
  },
  {
    id: 'staff',
    label: 'Personal',
    icon: Briefcase,
    href: '/staff',
    children: [
      {
        id: 'staff-profile',
        label: 'Mein Profil',
        icon: User,
        href: '/staff/profile',
      },
      {
        id: 'staff-list',
        label: 'Mitarbeiter',
        icon: Users,
        href: '/staff',
        requiredRoles: ['admin', 'moderator'],
      },
      {
        id: 'staff-schedules',
        label: 'Arbeitszeiten',
        icon: Clock,
        href: '/staff/schedules',
        requiredRoles: ['admin', 'moderator'],
      },
      {
        id: 'staff-leaves',
        label: 'Urlaub & Ausfall',
        icon: Calendar,
        href: '/staff/leaves',
        requiredRoles: ['admin', 'moderator'],
      },
    ],
  },
  {
    id: 'rooms',
    label: 'Behandlungsräume',
    icon: Building2,
    href: '/rooms',
    requiredRoles: ['admin', 'moderator'],
  },
  {
    id: 'payments',
    label: 'Abrechnung',
    icon: CreditCard,
    href: '/payments',
    requiredRoles: ['admin', 'moderator'],
  },
  {
    id: 'analytics',
    label: 'Berichte',
    icon: BarChart3,
    href: '/analytics',
    requiredRoles: ['admin', 'moderator'],
  },
  {
    id: 'assistant',
    label: 'KI-Assistent',
    icon: Bot,
    href: '/assistant',
    badge: 'KI',
  },
  {
    id: 'settings',
    label: 'Systemverwaltung',
    icon: Settings,
    href: '/settings',
    children: [
      {
        id: 'settings-services',
        label: 'Dienstleistungen verwalten',
        icon: Stethoscope,
        href: '/settings/services',
        requiredRoles: ['admin', 'moderator'],
      },
      {
        id: 'settings-rooms',
        label: 'Räume verwalten',
        icon: Building2,
        href: '/settings/rooms',
        requiredRoles: ['admin', 'moderator'],
      },
      {
        id: 'settings-users',
        label: 'Benutzerverwaltung',
        icon: Users,
        href: '/settings/users',
        requiredRoles: ['admin'],
      },
      {
        id: 'settings-security',
        label: 'Sicherheit',
        icon: Shield,
        href: '/settings/security',
        requiredRoles: ['admin'],
      },
    ],
  },
];

export function Sidebar({ collapsed, onToggle, currentPath, userRole = 'user', isMobile = false }: SidebarProps) {
  const filterItemsByRole = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      // Filter the item itself
      if (item.requiredRoles && !item.requiredRoles.includes(userRole)) {
        return false;
      }
      
      // Filter child items if they exist
      if (item.children) {
        item.children = item.children.filter(child => {
          if (!child.requiredRoles) return true;
          return child.requiredRoles.includes(userRole);
        });
      }
      
      return true;
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
      <div className="flex items-center justify-between p-4 border-b border-border h-[118px]">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {(!collapsed || isMobile) && (
            <div className="min-w-0 flex-1">
              {/* Show full name on larger screens, abbreviated on small */}
              <div className="block sm:hidden">
                <AppNameShort />
              </div>
              <div className="hidden sm:block">
                <AppName variant="elegant" />
              </div>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-1.5 flex-shrink-0"
          aria-label={collapsed ? 'Seitenleiste erweitern' : 'Seitenleiste einklappen'}
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


      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4" role="navigation" aria-label="Hauptnavigation">
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
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  Monitor,
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Plus,
  UserPlus,
  FileText,
  Clock
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FileTextPlus } from '../ui/FileTextPlus';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onMenuClick: () => void;
  showMenuButton: boolean;
}

export function Header({ user, onMenuClick, showMenuButton }: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const { theme, setTheme, isDark } = useTheme();
  const { logout } = useAuth();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setNewMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
        setThemeMenuOpen(false);
        setNewMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      case 'system':
        return Monitor;
      default:
        return Monitor;
    }
  };

  const mockNotifications = [
    { id: '1', title: 'Neuer Benutzer registriert', message: 'John Doe ist der Plattform beigetreten', time: 'vor 2 Min', unread: true },
    { id: '2', title: 'Bestellung abgeschlossen', message: 'Bestellung #12345 wurde verarbeitet', time: 'vor 1 Std', unread: true },
    { id: '3', title: 'System-Update', message: 'Wartung für heute Abend geplant', time: 'vor 3 Std', unread: false },
  ];

  const unreadCount = mockNotifications.filter(n => n.unread).length;

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
    <header className="bg-background border-b border-border sticky top-0 z-30 shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="p-2 md:hidden"
              aria-label="Menü öffnen"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Search - Desktop */}
          <div className="hidden md:block">
            <div className={clsx(
              'relative transition-all duration-200',
              searchFocused ? 'w-80' : 'w-64'
            )}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Alles durchsuchen..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Quick Actions - New Menu */}
          <div className="relative hidden lg:block" ref={newMenuRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewMenuOpen(!newMenuOpen)}
              className="flex items-center space-x-2"
              aria-label="Neu erstellen"
            >
              <Plus className="h-4 w-4" />
              <span>Neu</span>
              <ChevronDown className="h-3 w-3" />
            </Button>

            <AnimatePresence>
              {newMenuOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-popover border rounded-md shadow-elegant z-50"
                >
                  <div className="py-2">
                    <a
                      href="/patients/new"
                      className="flex items-center px-4 py-3 text-sm hover:bg-accent transition-colors"
                      onClick={() => setNewMenuOpen(false)}
                    >
                      <UserPlus className="h-4 w-4 mr-3 text-primary" />
                      <div>
                        <p className="font-medium">Neuer Patient</p>
                        <p className="text-xs text-muted-foreground">Patientendaten erfassen</p>
                      </div>
                    </a>
                    <a
                      href="/patients/history/new"
                      className="flex items-center px-4 py-3 text-sm hover:bg-accent transition-colors"
                      onClick={() => setNewMenuOpen(false)}
                    >
                      <FileTextPlus className="h-4 w-4 mr-3" />
                      <div>
                        <p className="font-medium">Neue Krankengeschichte</p>
                        <p className="text-xs text-muted-foreground">Medizinische Dokumentation erstellen</p>
                      </div>
                    </a>
                    <a
                      href="/appointments/new"
                      className="flex items-center px-4 py-3 text-sm hover:bg-accent transition-colors"
                      onClick={() => setNewMenuOpen(false)}
                    >
                      <Clock className="h-4 w-4 mr-3 text-primary" />
                      <div>
                        <p className="font-medium">Neuer Termin</p>
                        <p className="text-xs text-muted-foreground">Behandlungstermin vereinbaren</p>
                      </div>
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <div className="relative" ref={themeMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="p-2"
              aria-label="Design-Einstellungen"
            >
              {React.createElement(getThemeIcon(), { className: "h-4 w-4" })}
            </Button>

            <AnimatePresence>
              {themeMenuOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute right-0 top-full mt-2 w-40 bg-popover border rounded-md shadow-elegant z-50"
                >
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setTheme('light');
                        setThemeMenuOpen(false);
                      }}
                      className={clsx(
                        'flex items-center w-full px-4 py-2 text-sm hover:bg-accent transition-colors',
                        theme === 'light' && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <Sun className="h-4 w-4 mr-3" />
                      Hell
                    </button>
                    <button
                      onClick={() => {
                        setTheme('dark');
                        setThemeMenuOpen(false);
                      }}
                      className={clsx(
                        'flex items-center w-full px-4 py-2 text-sm hover:bg-accent transition-colors',
                        theme === 'dark' && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <Moon className="h-4 w-4 mr-3" />
                      Dunkel
                    </button>
                    <button
                      onClick={() => {
                        setTheme('system');
                        setThemeMenuOpen(false);
                      }}
                      className={clsx(
                        'flex items-center w-full px-4 py-2 text-sm hover:bg-accent transition-colors',
                        theme === 'system' && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <Monitor className="h-4 w-4 mr-3" />
                      System
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 relative"
              aria-label="Benachrichtigungen"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-popover border rounded-md shadow-elegant z-50"
                >
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold">Benachrichtigungen</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {mockNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={clsx(
                          'p-4 border-b border-border last:border-0 hover:bg-accent transition-colors cursor-pointer',
                          notification.unread && 'bg-accent/50'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                          </div>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-border">
                    <Button variant="outline" size="sm" className="w-full">
                      Alle Benachrichtigungen anzeigen
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 h-auto"
                aria-label="Benutzermenü"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <span className="text-primary-foreground text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-popover border rounded-md shadow-elegant z-50"
                  >
                    <div className="p-4 border-b border-border">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="mt-2 text-xs capitalize">
                        {user.role}
                      </Badge>
                    </div>
                    <div className="py-2">
                      <a
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <User className="h-4 w-4 mr-3" />
                        Profil
                      </a>
                      <a
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Einstellungen
                      </a>
                    </div>
                    <div className="border-t border-border py-2">
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await logout();
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Abmelden
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 md:hidden"
            aria-label="Suchen"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
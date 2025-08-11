import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Breadcrumb } from './Breadcrumb';
import { SkipLink } from '../ui/SkipLink';

interface AppLayoutProps {
  children: React.ReactNode;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  currentPath?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export function AppLayout({ children, user, currentPath, breadcrumbs }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize from localStorage, default to false if not found
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-collapsed');
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen && isMobile) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, isMobile]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, sidebarOpen]);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      const newCollapsed = !sidebarCollapsed;
      setSidebarCollapsed(newCollapsed);
      // Persist to localStorage
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to content link */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{
            width: sidebarCollapsed ? 58 : 256,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex-shrink-0 border-r border-border bg-muted/30 shadow-xl"
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            currentPath={currentPath}
            userRole={user?.role}
          />
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            user={user}
            onMenuClick={toggleSidebar}
            showMenuButton={false}
          />
          
          <main 
            id="main-content" 
            className="flex-1 overflow-auto"
            role="main"
            aria-label="Main content"
          >
            <div className="p-6">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb items={breadcrumbs} className="mb-6" />
              )}
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen">
        {/* Mobile Header */}
        <Header
          user={user}
          onMenuClick={toggleSidebar}
          showMenuButton={true}
        />

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={closeSidebar}
              />

              {/* Sidebar */}
              <motion.aside
                initial={{ x: -256 }}
                animate={{ x: 0 }}
                exit={{ x: -256 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 z-50 h-full w-64 bg-muted/30 border-r border-border shadow-2xl"
              >
                <Sidebar
                  collapsed={false}
                  onToggle={closeSidebar}
                  currentPath={currentPath}
                  userRole={user?.role}
                  isMobile={true}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main 
          id="main-content" 
          className="pt-16"
          role="main"
          aria-label="Main content"
        >
          <div className="p-4">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumb items={breadcrumbs} className="mb-4" />
            )}
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav currentPath={currentPath} userRole={user?.role} />
      </div>
    </div>
  );
}
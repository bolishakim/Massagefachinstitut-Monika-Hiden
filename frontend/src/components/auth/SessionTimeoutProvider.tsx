import React from 'react';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import { useAuth } from '../../hooks/useAuth';
import { SessionTimeoutDialog } from './SessionTimeoutDialog';

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  timeoutDuration?: number; // in milliseconds, default 15 minutes
  warningDuration?: number; // warning duration in milliseconds, default 2 minutes
}

export function SessionTimeoutProvider({ 
  children, 
  timeoutDuration = 15 * 60 * 1000, // 15 minutes
  warningDuration = 2 * 60 * 1000   // 2 minutes warning
}: SessionTimeoutProviderProps) {
  const { isAuthenticated, logout } = useAuth();
  
  const {
    showWarning,
    timeRemainingFormatted,
    extendSession,
  } = useSessionTimeout({
    timeoutDuration,
    warningDuration,
  });

  // Don't show session timeout for unauthenticated users
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during manual logout from timeout dialog:', error);
      // Force logout even if API call fails
      window.location.href = '/login';
    }
  };

  return (
    <>
      {children}
      <SessionTimeoutDialog
        show={showWarning}
        timeRemaining={timeRemainingFormatted}
        onExtendSession={extendSession}
        onLogout={handleLogout}
      />
    </>
  );
}
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

interface SessionTimeoutConfig {
  timeoutDuration?: number; // in milliseconds
  warningDuration?: number; // warning before timeout (in milliseconds)
  checkInterval?: number; // how often to check for timeout (in milliseconds)
}

interface SessionTimeoutState {
  isActive: boolean;
  timeRemaining: number;
  showWarning: boolean;
  lastActivity: number;
}

const DEFAULT_CONFIG: Required<SessionTimeoutConfig> = {
  timeoutDuration: 15 * 60 * 1000, // 15 minutes
  warningDuration: 2 * 60 * 1000,  // 2 minutes warning
  checkInterval: 1000, // check every second
};

// Events that indicate user activity
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'keydown',
  'scroll',
  'touchstart',
  'click',
] as const;

export function useSessionTimeout(config: SessionTimeoutConfig = {}) {
  const { logout, isAuthenticated } = useAuth();
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<SessionTimeoutState>({
    isActive: true,
    timeRemaining: fullConfig.timeoutDuration,
    showWarning: false,
    lastActivity: Date.now(),
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Update last activity time
  const updateActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    
    setState(prevState => ({
      ...prevState,
      lastActivity: now,
      isActive: true,
      showWarning: false,
      timeRemaining: fullConfig.timeoutDuration,
    }));
  }, [fullConfig.timeoutDuration]);

  // Handle session timeout
  const handleTimeout = useCallback(async () => {
    console.log('🕐 Session timeout - logging out user');
    
    setState(prevState => ({
      ...prevState,
      isActive: false,
      timeRemaining: 0,
      showWarning: false,
    }));

    try {
      await logout();
    } catch (error) {
      console.error('Error during session timeout logout:', error);
    }
  }, [logout]);

  // Extend session (reset timer)
  const extendSession = useCallback(() => {
    console.log('🔄 Session extended by user');
    updateActivity();
  }, [updateActivity]);

  // Start session timeout
  const startTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, fullConfig.timeoutDuration);
  }, [handleTimeout, fullConfig.timeoutDuration]);

  // Setup activity listeners
  useEffect(() => {
    if (!isAuthenticated) {
      return; // Don't track activity if user is not authenticated
    }

    // Add event listeners for user activity
    const handleActivity = () => {
      updateActivity();
      startTimeout();
    };

    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial setup
    updateActivity();
    startTimeout();

    return () => {
      // Cleanup event listeners
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated, updateActivity, startTimeout]);

  // Setup check interval to update time remaining and show warnings
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    checkIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const remaining = Math.max(0, fullConfig.timeoutDuration - timeSinceActivity);
      
      const shouldShowWarning = remaining > 0 && remaining <= fullConfig.warningDuration;
      
      setState(prevState => ({
        ...prevState,
        timeRemaining: remaining,
        showWarning: shouldShowWarning,
      }));

      // If time is up, trigger timeout
      if (remaining <= 0 && state.isActive) {
        handleTimeout();
      }
    }, fullConfig.checkInterval);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isAuthenticated, fullConfig.timeoutDuration, fullConfig.warningDuration, fullConfig.checkInterval, handleTimeout, state.isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Format time remaining for display
  const formatTimeRemaining = useCallback((milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    isActive: state.isActive,
    showWarning: state.showWarning,
    timeRemaining: state.timeRemaining,
    lastActivity: state.lastActivity,
    
    // Formatted values
    timeRemainingFormatted: formatTimeRemaining(state.timeRemaining),
    
    // Actions
    extendSession,
    
    // Configuration
    config: fullConfig,
  };
}
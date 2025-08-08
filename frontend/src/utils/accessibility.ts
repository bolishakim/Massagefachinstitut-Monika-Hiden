// Accessibility utilities and hooks
import React from 'react';

export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function generateId(prefix: string = 'element'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Hook for managing focus
export function useFocusManagement() {
  const restoreFocus = (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  };

  const saveFocus = () => {
    return document.activeElement as HTMLElement;
  };

  return { saveFocus, restoreFocus };
}

// Keyboard navigation handler
export function useKeyboardNavigation(
  items: Array<{ id: string; element?: HTMLElement }>,
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
  } = {}
) {
  const { loop = true, orientation = 'vertical' } = options;
  
  const navigate = (currentIndex: number, direction: 'next' | 'prev' | 'first' | 'last') => {
    let newIndex = currentIndex;
    
    switch (direction) {
      case 'next':
        newIndex = loop ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
        break;
      case 'prev':
        newIndex = loop ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = items.length - 1;
        break;
    }
    
    return newIndex;
  };

  const handleKeyDown = (e: KeyboardEvent, currentIndex: number, onNavigate: (index: number) => void) => {
    const isHorizontal = orientation === 'horizontal';
    
    switch (e.key) {
      case 'ArrowDown':
        if (!isHorizontal) {
          e.preventDefault();
          onNavigate(navigate(currentIndex, 'next'));
        }
        break;
      case 'ArrowUp':
        if (!isHorizontal) {
          e.preventDefault();
          onNavigate(navigate(currentIndex, 'prev'));
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          e.preventDefault();
          onNavigate(navigate(currentIndex, 'next'));
        }
        break;
      case 'ArrowLeft':
        if (isHorizontal) {
          e.preventDefault();
          onNavigate(navigate(currentIndex, 'prev'));
        }
        break;
      case 'Home':
        e.preventDefault();
        onNavigate(navigate(currentIndex, 'first'));
        break;
      case 'End':
        e.preventDefault();
        onNavigate(navigate(currentIndex, 'last'));
        break;
    }
  };

  return { handleKeyDown, navigate };
}

// High contrast mode detection
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    setIsHighContrast(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isHighContrast;
}

// Reduced motion detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// Skip link component - moved to separate JSX file due to TypeScript limitations
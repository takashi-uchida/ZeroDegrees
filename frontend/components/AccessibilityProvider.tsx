'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useReducedMotion, useHighContrast } from '@/hooks/useAccessibility';

interface AccessibilityContextType {
  reducedMotion: boolean;
  highContrast: boolean;
  toggleHighContrast: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const { highContrast, toggle } = useHighContrast();

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  return (
    <AccessibilityContext.Provider
      value={{ reducedMotion, highContrast, toggleHighContrast: toggle }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
}

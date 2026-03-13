import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

export function useHighContrast() {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('highContrast');
    if (stored) setHighContrast(stored === 'true');
  }, []);

  const toggle = () => {
    setHighContrast(prev => {
      const next = !prev;
      localStorage.setItem('highContrast', String(next));
      return next;
    });
  };

  return { highContrast, toggle };
}

export function useKeyboardNavigation(
  items: string[],
  onSelect: (id: string) => void
) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        onSelect(items[focusedIndex]);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items, focusedIndex, onSelect]);

  return { focusedIndex, setFocusedIndex };
}

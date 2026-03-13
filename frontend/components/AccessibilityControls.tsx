'use client';

import { useAccessibility } from './AccessibilityProvider';

export default function AccessibilityControls() {
  const { highContrast, toggleHighContrast, reducedMotion } = useAccessibility();

  return (
    <div
      className="fixed top-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50"
      role="region"
      aria-label="Accessibility controls"
    >
      <h2 className="text-sm font-semibold mb-2">Accessibility</h2>
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={highContrast}
            onChange={toggleHighContrast}
            className="w-4 h-4"
            aria-label="Toggle high contrast mode"
          />
          <span className="text-sm">High Contrast</span>
        </label>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {reducedMotion && '✓ Reduced motion active'}
        </div>
      </div>
    </div>
  );
}

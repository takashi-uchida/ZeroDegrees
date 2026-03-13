'use client';

import { useState, useEffect } from 'react';

const SHORTCUTS = [
  { key: 'Tab', description: 'Navigate to next node' },
  { key: 'Shift + Tab', description: 'Navigate to previous node' },
  { key: 'Escape', description: 'Deselect current node' },
  { key: '/', description: 'Focus search input' },
  { key: '?', description: 'Show keyboard shortcuts' },
];

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full bg-slate-800 p-3 text-white shadow-lg hover:bg-slate-700"
        aria-label="Show keyboard shortcuts"
      >
        <span className="text-sm font-semibold">?</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-labelledby="shortcuts-title"
      aria-modal="true"
    >
      <div className="max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 id="shortcuts-title" className="text-xl font-semibold">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close shortcuts dialog"
          >
            ✕
          </button>
        </div>
        <dl className="space-y-3">
          {SHORTCUTS.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <dt className="text-sm text-gray-600 dark:text-gray-400">{description}</dt>
              <dd className="rounded bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-mono font-semibold">
                {key}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

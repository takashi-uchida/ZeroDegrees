import { SearchState } from '@/types/search';
import { useAccessibility } from './AccessibilityProvider';

interface SearchStatusProps {
  searchState: SearchState;
  visualizationMode?: string;
}

export default function SearchStatus({ searchState, visualizationMode }: SearchStatusProps) {
  const { reducedMotion } = useAccessibility();

  if (searchState === 'idle') return null;

  const messages = {
    searching: 'Tracing the shortest trusted route through the graph...',
    found: 'Path discovered',
  };

  return (
    <div
      className="absolute inset-x-3 bottom-3 z-20 rounded-full border border-sky-300/20 bg-slate-950/80 px-4 py-2.5 backdrop-blur-sm sm:inset-x-6 sm:bottom-6 sm:px-5 sm:py-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {searchState === 'searching' && (
            <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
              {!reducedMotion && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-300 opacity-75" />
              )}
              <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-300" />
            </span>
          )}
          {searchState === 'found' && (
            <span className="flex h-3 w-3">
              <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
          )}
          <p className="text-xs font-medium text-slate-100 sm:text-sm">{messages[searchState]}</p>
        </div>
        {visualizationMode && (
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 sm:text-xs">
            {visualizationMode}
          </p>
        )}
      </div>
    </div>
  );
}

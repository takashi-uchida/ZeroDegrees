'use client';

import { useState, useEffect } from 'react';
import { TargetType } from '@/types/search';

const TARGET_OPTIONS: Array<{
  value: TargetType;
  label: string;
  description: string;
}> = [
  { value: 'future_self', label: 'Future Self', description: 'Someone who already crossed this threshold' },
  { value: 'comrade', label: 'Comrade', description: 'Someone navigating the same passage now' },
  { value: 'guide', label: 'Guide', description: 'Someone who holds the key to your next move' },
  { value: 'any', label: 'Any path', description: 'Trust the constellation to reveal the strongest connection' },
];

const EXAMPLE_PROMPTS = [
  {
    label: 'Technical co-founder',
    prompt: 'I want to launch an AI SaaS company but need a technical co-founder who shares my vision.',
  },
  {
    label: 'Operator to founder',
    prompt: 'I need to cross from operator to founder, but the path forward is unclear.',
  },
  {
    label: 'Global expansion',
    prompt: 'I want to build a global company from Japan and need the right bridge to make it happen.',
  },
];

const DESTINY_MESSAGES = [
  'Calculating your path...',
  'Mapping the constellation...',
  'Tracing the threads of connection...',
  'Discovering hidden bridges...',
  'Aligning the stars...',
];

const validateInput = (value: string): string | null => {
  if (!value.trim()) return 'Please describe your challenge';
  if (value.trim().length < 10) return 'Please provide more detail (at least 10 characters)';
  if (value.trim().length > 500) return 'Please keep it under 500 characters';
  return null;
};

const generateRefinements = (value: string): string[] => {
  const refinements: string[] = [];
  const lowerValue = value.toLowerCase();
  if (value.length > 0 && !/industr|field|sector|domain/.test(lowerValue)) {
    refinements.push('Consider adding your industry or field');
  }
  if (value.length > 0 && !/stage|position|level|phase/.test(lowerValue)) {
    refinements.push('Mention your current stage or position');
  }
  if (value.length > 0 && value.length < 50) {
    refinements.push('Add more context for better matches');
  }
  return refinements;
};

export default function SearchInput({
  value,
  targetType,
  isSearching,
  onChange,
  onTargetTypeChange,
  onSearch,
}: {
  value: string;
  targetType: TargetType;
  isSearching: boolean;
  onChange: (value: string) => void;
  onTargetTypeChange: (value: TargetType) => void;
  onSearch: () => void;
}) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [refinements, setRefinements] = useState<string[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isSearching) {
      setMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % DESTINY_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isSearching]);

  useEffect(() => {
    setRefinements(generateRefinements(value));
  }, [value]);

  const handleSearch = () => {
    const error = validateInput(value);
    setValidationError(error);
    if (!error) {
      onSearch();
    }
  };

  if (isSearching) {
    return (
      <section className="rounded-[30px] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.3)]">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative h-24 w-24">
            <div className="absolute inset-0 animate-ping rounded-full bg-sky-300/20" />
            <div className="absolute inset-2 animate-spin rounded-full border-4 border-slate-800 border-t-sky-300" />
            <div className="absolute inset-6 animate-pulse rounded-full bg-sky-300/30" />
          </div>
          <p className="mt-6 text-lg font-semibold text-white">{DESTINY_MESSAGES[messageIndex]}</p>
          <p className="mt-2 text-sm text-slate-400">This may take a moment</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[30px] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.3)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">Pathfinder</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
        Describe the threshold you need to cross.
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Be specific. The constellation reveals itself only when the question is clear.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {EXAMPLE_PROMPTS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onChange(item.prompt)}
            className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-left transition hover:border-sky-300/30 hover:bg-sky-400/10"
          >
            <p className="text-sm font-semibold text-white">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{item.prompt}</p>
          </button>
        ))}
      </div>

      <textarea
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setValidationError(null);
        }}
        placeholder="Describe the passage, transformation, or destined encounter you seek..."
        className={`mt-5 h-36 w-full resize-none rounded-3xl border px-4 py-4 text-base leading-7 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
          validationError
            ? 'border-red-500/40 bg-red-950/20 focus:border-red-400/40 focus:ring-red-400/10'
            : 'border-slate-800 bg-slate-900 focus:border-sky-300/40 focus:ring-sky-300/10'
        }`}
      />

      {validationError && (
        <p className="mt-2 text-sm text-red-400">{validationError}</p>
      )}

      {!validationError && refinements.length > 0 && value.length > 0 && (
        <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-950/20 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Suggestions</p>
          <ul className="mt-2 space-y-1">
            {refinements.map((refinement, index) => (
              <li key={index} className="text-sm text-amber-200/80">• {refinement}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {TARGET_OPTIONS.map((option) => {
          const isActive = option.value === targetType;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onTargetTypeChange(option.value)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-sky-300/40 bg-sky-400/10 text-white'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{option.label}</span>
                {isActive && (
                  <span className="rounded-full bg-sky-300/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                    Selected
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-400">{option.description}</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSearch}
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-sky-300 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {isSearching ? 'Calculating your destiny...' : 'Calculate the path'}
      </button>
    </section>
  );
}

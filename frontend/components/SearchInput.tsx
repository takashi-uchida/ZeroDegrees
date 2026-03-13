'use client';

import { TargetType } from '@/types/search';

const TARGET_OPTIONS: Array<{
  value: TargetType;
  label: string;
  description: string;
}> = [
  { value: 'future_self', label: 'Future Self', description: 'Someone who already crossed this gap' },
  { value: 'comrade', label: 'Comrade', description: 'Someone living the same tension now' },
  { value: 'guide', label: 'Guide', description: 'Someone who can unlock the next move' },
  { value: 'any', label: 'Any path', description: 'Let the system choose the strongest destiny' },
];

const EXAMPLE_PROMPTS = [
  {
    label: 'AI SaaS founder',
    prompt: 'I want to start an AI SaaS company but I still do not have a technical co-founder.',
  },
  {
    label: 'Operator to founder',
    prompt: 'I need to move from operator to founder, but I cannot see the shortest route.',
  },
  {
    label: 'Japan to global',
    prompt: 'I want to build globally from Japan and need the right first bridge.',
  },
];

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
  return (
    <section className="rounded-[30px] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.3)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">Search</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
        Describe the gap you are trying to cross.
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Keep it plain. The graph is only useful if the problem statement is specific.
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
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe the challenge, transition, or person-shaped gap you are trying to cross..."
        className="mt-5 h-36 w-full resize-none rounded-3xl border border-slate-800 bg-slate-900 px-4 py-4 text-base leading-7 text-white placeholder:text-slate-500 focus:border-sky-300/40 focus:outline-none focus:ring-2 focus:ring-sky-300/10"
      />

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
        onClick={onSearch}
        disabled={isSearching || !value.trim()}
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-sky-300 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {isSearching ? 'Mapping the route...' : 'Map the route'}
      </button>
    </section>
  );
}

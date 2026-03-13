'use client';

import { Node } from '@/types/graph';
import { VisualizationMode } from '@/types/ui';

const MODE_META: Record<
  VisualizationMode,
  { title: string; description: string }
> = {
  concentric: {
    title: 'Concentric',
    description: 'Distance appears as rings around the current self.',
  },
  heatmap: {
    title: 'Heatmap',
    description: 'Farther viewpoints glow warmer so gaps read instantly.',
  },
  path: {
    title: 'Path',
    description: 'The strongest route is emphasized over the rest of the graph.',
  },
};

const LEGEND = [
  { label: 'You', color: '#7dd3fc' },
  { label: 'Future Self', color: '#6ee7b7' },
  { label: 'Comrade', color: '#38bdf8' },
  { label: 'Guide', color: '#fcd34d' },
];

export default function DistanceVisualizationLayer({
  mode,
  onModeChange,
  showDistanceMetrics,
  onToggleDistanceMetrics,
  nodes,
  activeRouteLength,
}: {
  mode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
  showDistanceMetrics: boolean;
  onToggleDistanceMetrics: () => void;
  nodes: Node[];
  activeRouteLength: number;
}) {
  const maxDistance = Math.max(...nodes.map((node) => node.distance), 1);

  return (
    <section className="rounded-[30px] border border-slate-800 bg-slate-950/90 p-5 shadow-[0_16px_60px_rgba(2,6,23,0.24)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Graph view</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{MODE_META[mode].title} mode</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            {MODE_META[mode].description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['concentric', 'heatmap', 'path'] as VisualizationMode[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onModeChange(value)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                value === mode
                  ? 'border-sky-300/40 bg-sky-400/10 text-sky-100'
                  : 'border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              {MODE_META[value].title}
            </button>
          ))}
          <button
            type="button"
            onClick={onToggleDistanceMetrics}
            className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              showDistanceMetrics
                ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
                : 'border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            Distance labels
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Max distance</p>
          <p className="mt-2 text-lg font-semibold text-white">{maxDistance} shifts</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Active route</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {activeRouteLength > 0 ? `${activeRouteLength} hops` : 'Select a node'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">What distance means</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Distance is not geography. It is the number of viewpoint shifts between now and the
            person you need next.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {LEGEND.map((item) => (
          <div
            key={item.label}
            className="rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300"
          >
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}

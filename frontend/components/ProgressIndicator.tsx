'use client';

type PhaseStatus = 'complete' | 'current' | 'upcoming';

export interface ProgressPhase {
  id: string;
  label: string;
  description: string;
  status: PhaseStatus;
}

export default function ProgressIndicator({
  phases,
  exploredNodes,
  currentMessage,
}: {
  phases: ProgressPhase[];
  exploredNodes: number;
  currentMessage: string;
}) {
  const completedCount = phases.filter((phase) => phase.status === 'complete').length;
  const currentIndex = phases.findIndex((phase) => phase.status === 'current');
  const progressValue =
    currentIndex === -1
      ? 100
      : Math.round(((completedCount + 0.5) / Math.max(phases.length, 1)) * 100);

  return (
    <section className="rounded-[30px] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.25)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Journey</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Path calculation</h2>
        </div>
        <div className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200">
          {exploredNodes} nodes traversed
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#7dd3fc_0%,#38bdf8_50%,#6ee7b7_100%)] transition-all duration-500"
          style={{ width: `${progressValue}%` }}
        />
      </div>

      <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-200">
        {currentMessage}
      </p>

      <div className="mt-5 space-y-3">
        {phases.map((phase, index) => (
          <div
            key={phase.id}
            className={`rounded-2xl border px-4 py-3 transition ${
              phase.status === 'current'
                ? 'border-sky-300/30 bg-sky-400/10'
                : phase.status === 'complete'
                  ? 'border-emerald-300/20 bg-emerald-400/10'
                  : 'border-slate-800 bg-slate-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  phase.status === 'complete'
                    ? 'bg-emerald-300 text-slate-950'
                    : phase.status === 'current'
                      ? 'bg-sky-300 text-slate-950'
                      : 'bg-white/10 text-slate-400'
                }`}
              >
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{phase.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{phase.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

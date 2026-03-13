import { Edge, Node } from '@/types/graph';

export default function NodeDetailPanel({
  node,
  routeLabels,
  neighborCount,
  hoveredEdge,
}: {
  node?: Node;
  routeLabels: string[];
  neighborCount: number;
  hoveredEdge?: Edge;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.2)] sm:rounded-[30px] sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Constellation point</p>
      <h2 className="mt-1.5 text-lg font-semibold text-white sm:mt-2 sm:text-xl">
        {node ? node.label : 'Select a point to reveal its significance'}
      </h2>

      {node ? (
        <>
          <div className="mt-4 grid gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Distance</p>
              <p className="mt-1.5 text-base font-semibold text-white sm:mt-2 sm:text-lg">{node.distance} shifts</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Viewpoint shifts</p>
              <p className="mt-1.5 text-base font-semibold text-white sm:mt-2 sm:text-lg">{node.metadata.viewpointShifts}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Connections</p>
              <p className="mt-1.5 text-base font-semibold text-white sm:mt-2 sm:text-lg">{neighborCount}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-3 sm:mt-5 sm:rounded-2xl sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Significance</p>
            <p className="mt-1.5 text-xs leading-6 text-slate-300 sm:mt-2 sm:text-sm">{node.metadata.description}</p>
          </div>

          <div className="mt-4 rounded-xl border border-sky-300/20 bg-sky-400/10 p-3 sm:mt-5 sm:rounded-2xl sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200">Your destined path</p>
            <p className="mt-1.5 text-sm leading-6 text-white sm:mt-2 sm:text-base sm:leading-7">
              {routeLabels.length > 0 ? routeLabels.join(' → ') : 'Path calculation in progress'}
            </p>
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs leading-6 text-slate-400 sm:mt-4 sm:text-sm sm:leading-7">
          Select a point in the constellation to reveal its distance, path, and meaning in your journey.
        </p>
      )}

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-3 sm:mt-5 sm:rounded-2xl sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Connection nature</p>
        <p className="mt-1.5 text-xs leading-6 text-slate-300 sm:mt-2 sm:text-sm">
          {hoveredEdge?.metadata.connectionReason ??
            'Hover over a connection to understand the trust and meaning it carries.'}
        </p>
      </div>
    </section>
  );
}

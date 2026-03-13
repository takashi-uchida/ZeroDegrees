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
    <section 
      className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.2)] sm:rounded-[30px] sm:p-6"
      aria-labelledby="node-detail-heading"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Selected node</p>
      <h2 id="node-detail-heading" className="mt-1.5 text-lg font-semibold text-white sm:mt-2 sm:text-xl">
        {node ? node.label : 'Select a node to inspect the route'}
      </h2>

      {node ? (
        <>
          <div className="mt-4 grid gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3" role="group" aria-label="Node statistics">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Distance</p>
              <p className="mt-1.5 text-base font-semibold text-white sm:mt-2 sm:text-lg" aria-label={`Distance: ${node.distance} shifts`}>
                {node.distance} shifts
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Viewpoint shifts</p>
              <p className="mt-1.5 text-base font-semibold text-white sm:mt-2 sm:text-lg" aria-label={`Viewpoint shifts: ${node.metadata.viewpointShifts}`}>
                {node.metadata.viewpointShifts}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Neighbors</p>
              <p className="mt-1.5 text-base font-semibold text-white sm:mt-2 sm:text-lg" aria-label={`Neighbors: ${neighborCount}`}>
                {neighborCount}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-3 sm:mt-5 sm:rounded-2xl sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Why this node matters</p>
            <p className="mt-1.5 text-xs leading-6 text-slate-300 sm:mt-2 sm:text-sm">{node.metadata.description}</p>
          </div>

          <div className="mt-4 rounded-xl border border-sky-300/20 bg-sky-400/10 p-3 sm:mt-5 sm:rounded-2xl sm:p-4" role="region" aria-label="Shortest route">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200">Shortest route from you</p>
            <p className="mt-1.5 text-sm leading-6 text-white sm:mt-2 sm:text-base sm:leading-7">
              {routeLabels.length > 0 ? routeLabels.join(' → ') : 'No visible route yet'}
            </p>
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs leading-6 text-slate-400 sm:mt-4 sm:text-sm sm:leading-7">
          Click a node in the graph to reveal its distance, route, and role in the six-degrees map.
        </p>
      )}

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-3 sm:mt-5 sm:rounded-2xl sm:p-4" role="status" aria-live="polite">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Hovered connection</p>
        <p className="mt-1.5 text-xs leading-6 text-slate-300 sm:mt-2 sm:text-sm">
          {hoveredEdge?.metadata.connectionReason ??
            'Hover an edge to see why that bridge exists and what kind of trust it represents.'}
        </p>
      </div>
    </section>
  );
}

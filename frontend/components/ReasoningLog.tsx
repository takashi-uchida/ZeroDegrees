'use client'

import { DiscoveryEvent } from '@/lib/discovery-types'

export default function ReasoningLog({ events }: { events: DiscoveryEvent[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Reasoning log</h2>
      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
        {events.map((event, index) => (
          <div key={`${event.type}-${index}`} className="rounded-2xl border border-slate-200 p-4">
            {event.type === 'status' && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{event.data.step}</p>
                <p className="mt-1 text-sm text-slate-700">{event.data.label}</p>
              </div>
            )}
            {event.type === 'context' && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current state</p>
                <p className="mt-1 text-sm text-slate-700">{event.data.situation}</p>
              </div>
            )}
            {event.type === 'candidates' && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Candidates</p>
                <p className="mt-1 text-sm text-slate-700">
                  Found {event.data.count} relevant people.
                </p>
              </div>
            )}
            {event.type === 'forum' && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{event.data.agent}</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{event.data.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

'use client'

import { ActionPlanItemView } from '@/lib/discovery-types'

export default function ActionPlan({ items }: { items: ActionPlanItemView[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">This week</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Your next move</h2>
        </div>
        <p className="max-w-xl text-sm text-slate-500">
          ZeroDegrees should end with action, not just explanation.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.rationale}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

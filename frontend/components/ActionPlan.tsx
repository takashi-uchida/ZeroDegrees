'use client'

import { ActionPlanItemView, PersonMatchView } from '@/lib/discovery-types'

const ROLE_META = {
  future_self: 'Future Self',
  comrade: 'Comrade',
  guide: 'Guide',
}

export default function ActionPlan({
  items,
  people = [],
}: {
  items: ActionPlanItemView[]
  people?: PersonMatchView[]
}) {
  const peopleById = Object.fromEntries(people.map((person) => [person.person_id, person]))

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">This week</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Your next move</h2>
        </div>
        <p className="max-w-xs text-sm leading-6 text-slate-500">
          The first action should be obvious enough to take today.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {items.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className={`rounded-2xl border p-4 ${
              index === 0 ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  index === 0 ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'
                }`}
              >
                {index + 1}
              </div>
              <div>
                {item.target_person_id && peopleById[item.target_person_id] && (
                  <p
                    className={`text-xs uppercase tracking-[0.22em] ${
                      index === 0 ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {
                      ROLE_META[
                        peopleById[item.target_person_id].role as keyof typeof ROLE_META
                      ]
                    }{' '}
                    · {peopleById[item.target_person_id].name}
                  </p>
                )}
                <h3
                  className={`mt-2 text-base font-semibold ${
                    index === 0 ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {item.title}
                </h3>
                <p
                  className={`mt-2 text-sm leading-6 ${
                    index === 0 ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {item.rationale}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

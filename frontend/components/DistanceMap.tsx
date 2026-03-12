'use client'

import { PersonMatchView } from '@/lib/discovery-types'

const ROLE_META = {
  future_self: {
    eyebrow: 'Already solved it',
    title: 'Future Self',
    accent: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  },
  comrade: {
    eyebrow: 'Facing it now',
    title: 'Comrade',
    accent: 'border-sky-500 bg-sky-50 text-sky-700',
  },
  guide: {
    eyebrow: 'Can unlock next',
    title: 'Guide',
    accent: 'border-amber-500 bg-amber-50 text-amber-700',
  },
}

export default function DistanceMap({
  currentState,
  people,
}: {
  currentState: {
    summary: string
    blocker: string
    desiredNextStep: string
  }
  people: PersonMatchView[]
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">You are here</p>
        <h2 className="mt-3 text-2xl font-semibold">{currentState.summary}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Primary blocker</p>
            <p className="mt-2 text-sm text-slate-100">{currentState.blocker}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Desired next step</p>
            <p className="mt-2 text-sm text-slate-100">{currentState.desiredNextStep}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {people.map((person) => {
          const meta = ROLE_META[person.role]

          return (
            <article
              key={person.person_id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{meta.eyebrow}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">{meta.title}</h3>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${meta.accent}`}>
                  {person.distance_label ?? 'Meaningful path'}
                </span>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold text-slate-900">{person.name}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{person.bio}</p>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Why this person</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{person.reasoning}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Proof</p>
                  <ul className="mt-2 space-y-2">
                    {person.evidence.map((item) => (
                      <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">First question</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {person.first_question ?? 'What would you ask them first?'}
                  </p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

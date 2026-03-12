'use client'

import { useState } from 'react'
import { ActionPlanItemView, PersonMatchView } from '@/lib/discovery-types'

const ROLE_ORDER: PersonMatchView['role'][] = ['future_self', 'comrade', 'guide']

const ROLE_META = {
  future_self: {
    eyebrow: 'Already solved it',
    title: 'Future Self',
    badge: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200',
    chip: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
    lineGlow: 'from-emerald-300/15 via-emerald-300 to-emerald-100/20',
    dot: 'bg-emerald-300 shadow-[0_0_24px_rgba(110,231,183,0.75)]',
    pill: 'text-emerald-200',
  },
  comrade: {
    eyebrow: 'Facing it now',
    title: 'Comrade',
    badge: 'border-sky-300/30 bg-sky-300/10 text-sky-200',
    chip: 'border-sky-300/20 bg-sky-300/10 text-sky-100',
    lineGlow: 'from-sky-300/15 via-sky-300 to-sky-100/20',
    dot: 'bg-sky-300 shadow-[0_0_24px_rgba(125,211,252,0.75)]',
    pill: 'text-sky-200',
  },
  guide: {
    eyebrow: 'Can unlock next',
    title: 'Guide',
    badge: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
    chip: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
    lineGlow: 'from-amber-300/15 via-amber-300 to-amber-100/20',
    dot: 'bg-amber-300 shadow-[0_0_24px_rgba(252,211,77,0.75)]',
    pill: 'text-amber-200',
  },
}

function summarizeReasoning(reasoning: string) {
  const firstSentenceMatch = reasoning.match(/.+?[.!?](?:\s|$)/)
  const summary = firstSentenceMatch?.[0]?.trim() ?? reasoning.trim()

  if (summary.length <= 150) {
    return summary
  }

  return `${summary.slice(0, 147).trimEnd()}...`
}

export default function DistanceMap({
  currentState,
  people,
  actionPlan = [],
}: {
  currentState: {
    summary: string
    blocker: string
    desiredNextStep: string
  }
  people: PersonMatchView[]
  actionPlan?: ActionPlanItemView[]
}) {
  const orderedPeople = [...people].sort(
    (left, right) => ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role)
  )
  const [activeRole, setActiveRole] = useState<PersonMatchView['role']>(
    orderedPeople[0]?.role ?? 'future_self'
  )
  const peopleById = Object.fromEntries(orderedPeople.map((person) => [person.person_id, person]))

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#07111F] p-6 text-white shadow-[0_30px_120px_rgba(2,6,23,0.45)] md:p-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            'radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.16), transparent 24%), radial-gradient(circle at 85% 30%, rgba(251, 191, 36, 0.12), transparent 18%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.85), transparent 100%)',
        }}
      />

      <div className="relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200/80">Your current distance</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              From where you are now to the people who can move you forward.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-300">
            This is not a results list. It is a field map of who has already solved your problem,
            who is living it with you, and who can unlock the next step.
          </p>
        </div>

        <div className="relative mt-8 grid gap-6 lg:grid-cols-[320px_minmax(120px,1fr)_minmax(0,440px)]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">You are here</p>

            <div className="mt-6 flex items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-sky-400/20 blur-md" />
                <span className="absolute h-12 w-12 rounded-full border border-sky-300/30 animate-pulse" />
                <span className="relative h-5 w-5 rounded-full bg-sky-300 shadow-[0_0_30px_rgba(125,211,252,0.8)]" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">Origin node</p>
                <h3 className="mt-2 text-2xl font-semibold leading-tight text-white">
                  {currentState.summary}
                </h3>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                  Primary blocker
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-100">{currentState.blocker}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                  Desired next step
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  {currentState.desiredNextStep}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col justify-around py-4">
            {orderedPeople.map((person) => {
              const meta = ROLE_META[person.role]
              const isActive = activeRole === person.role

              return (
                <div key={person.person_id} className="flex items-center gap-4">
                  <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    <span
                      className={`absolute h-5 w-5 rounded-full ${meta.dot} transition-opacity duration-300 ${
                        isActive ? 'opacity-100' : 'opacity-70'
                      }`}
                    />
                    <span className="absolute h-9 w-9 rounded-full border border-white/10" />
                  </div>

                  <div className="relative h-px flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${meta.lineGlow} transition-all duration-300 ${
                        isActive ? 'w-full opacity-100' : 'w-3/4 opacity-55'
                      }`}
                    />
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition duration-300 ${meta.badge} ${
                      isActive ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-80'
                    }`}
                  >
                    {person.distance_label ?? 'Meaningful path'}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="relative space-y-4">
            <div className="absolute bottom-3 left-[11px] top-3 w-px bg-gradient-to-b from-white/0 via-white/15 to-white/0 lg:hidden" />

            {orderedPeople.map((person) => {
              const meta = ROLE_META[person.role]
              const isActive = activeRole === person.role

              return (
                <article
                  key={person.person_id}
                  tabIndex={0}
                  onMouseEnter={() => setActiveRole(person.role)}
                  onFocus={() => setActiveRole(person.role)}
                  className={`group relative rounded-[28px] border p-5 pl-8 transition duration-300 lg:pl-5 ${
                    isActive
                      ? 'border-white/20 bg-white/[0.1] shadow-[0_22px_60px_rgba(15,23,42,0.35)]'
                      : 'border-white/10 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                  } focus:outline-none focus:ring-2 focus:ring-white/20`}
                >
                  <span
                    className={`absolute left-[6px] top-10 h-3 w-3 rounded-full lg:hidden ${meta.dot}`}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-xs uppercase tracking-[0.25em] ${meta.pill}`}>
                        {meta.title}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">{meta.eyebrow}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${meta.badge}`}>
                      {person.distance_label ?? 'Meaningful path'}
                    </span>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-2xl font-semibold tracking-tight text-white">
                      {person.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{person.bio}</p>
                    <p className="mt-4 text-sm leading-7 text-slate-100">
                      {summarizeReasoning(person.reasoning)}
                    </p>
                  </div>

                  <div className="mt-5">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Proof</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {person.evidence.slice(0, 2).map((item) => (
                        <span
                          key={item}
                          className={`rounded-full border px-3 py-2 text-xs leading-5 ${meta.chip}`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                      Ask first
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6 text-white">
                      {person.first_question ?? 'What would you ask them first?'}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        {actionPlan.length > 0 && (
          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Your next move this week
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Turn the map into motion.
                </h3>
              </div>

              <div className="grid flex-1 gap-3 md:grid-cols-3">
                {actionPlan.slice(0, 3).map((item, index) => {
                  const targetPerson = item.target_person_id
                    ? peopleById[item.target_person_id]
                    : undefined

                  return (
                    <div
                      key={`${item.title}-${index}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-950">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {targetPerson?.name ?? item.title}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                            {targetPerson ? ROLE_META[targetPerson.role].title : 'Action'}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{item.title}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

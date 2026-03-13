import { PersonMatchView } from '@/lib/discovery-types'

const ROLE_ORDER: PersonMatchView['role'][] = ['future_self', 'comrade', 'guide']

const ROLE_META = {
  future_self: {
    title: 'Future Self',
    eyebrow: 'Best outcome',
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    text: 'text-emerald-700',
  },
  comrade: {
    title: 'Comrade',
    eyebrow: 'Peer calibration',
    accent: 'border-sky-200 bg-sky-50 text-sky-700',
    text: 'text-sky-700',
  },
  guide: {
    title: 'Guide',
    eyebrow: 'Unlock path',
    accent: 'border-amber-200 bg-amber-50 text-amber-700',
    text: 'text-amber-700',
  },
}

function summarizeReasoning(reasoning: string) {
  const sentence = reasoning.match(/.+?[.!?](?:\s|$)/)?.[0]?.trim() ?? reasoning.trim()
  return sentence.length > 135 ? `${sentence.slice(0, 132).trimEnd()}...` : sentence
}

export default function DecisionPanel({
  blocker,
  nextStep,
  people,
}: {
  blocker: string
  nextStep: string
  people: PersonMatchView[]
}) {
  const orderedPeople = [...people].sort(
    (left, right) => ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role)
  )

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Decision panel</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Why these three people
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-6 text-slate-500">
          The right side is for judgment, not exploration.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Primary blocker</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{blocker}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Desired next step</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{nextStep}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {orderedPeople.map((person) => {
          const meta = ROLE_META[person.role]

          return (
            <article key={person.person_id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-xs uppercase tracking-[0.22em] ${meta.text}`}>{meta.eyebrow}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{person.name}</h3>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${meta.accent}`}>
                  {meta.title}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                {summarizeReasoning(person.reasoning)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {person.evidence.slice(0, 1).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                  >
                    {item}
                  </span>
                ))}
                <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500">
                  Match {Math.round(person.similarity_score * 100)}%
                </span>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Ask first</p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
                  {person.first_question ?? 'Start with one practical question.'}
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

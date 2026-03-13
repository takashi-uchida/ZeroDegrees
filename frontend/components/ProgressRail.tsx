'use client'

import { DiscoveryProgressStep } from '@/lib/discovery-types'

const STEPS: { id: DiscoveryProgressStep; title: string }[] = [
  { id: 'analyzing', title: 'Analyze your situation' },
  { id: 'searching', title: 'Search relevant people' },
  { id: 'matching', title: 'Match key roles' },
  { id: 'intro_ready', title: 'Prepare your intro' },
]

export default function ProgressRail({
  currentStep,
}: {
  currentStep: DiscoveryProgressStep | null
}) {
  const currentIndex = currentStep ? STEPS.findIndex((step) => step.id === currentStep) : -1

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 overflow-x-auto">
        {STEPS.map((step, index) => {
          const isComplete = currentIndex > index
          const isCurrent = currentIndex === index

          return (
            <div key={step.id} className="flex min-w-[160px] items-center gap-3">
              <div
                className={[
                  'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition',
                  isComplete
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isCurrent
                      ? 'border-sky-600 bg-sky-50 text-sky-700'
                      : 'border-slate-300 bg-slate-50 text-slate-500',
                ].join(' ')}
              >
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Step</p>
                <p className="text-sm font-medium text-slate-800">{step.title}</p>
              </div>
              {index < STEPS.length - 1 && (
                <div className="hidden h-px flex-1 min-w-8 bg-slate-200 md:block" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

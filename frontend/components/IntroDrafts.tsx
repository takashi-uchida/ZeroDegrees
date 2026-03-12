'use client'

import { useState } from 'react'

import { IntroDraftView } from '@/lib/discovery-types'

export default function IntroDrafts({ drafts }: { drafts: IntroDraftView[] }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedKey(key)
    window.setTimeout(() => setCopiedKey(null), 1500)
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Intro ready</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">Copy your first outreach</h2>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {drafts.map((draft) => (
          <article key={draft.person_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">{draft.person_name}</h3>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Direct message</p>
              <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
                {draft.direct_message}
              </p>
              <button
                type="button"
                onClick={() => handleCopy(`dm-${draft.person_id}`, draft.direct_message)}
                className="mt-3 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                {copiedKey === `dm-${draft.person_id}` ? 'Copied' : 'Copy DM'}
              </button>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Intro request</p>
              <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
                {draft.intro_request}
              </p>
              <button
                type="button"
                onClick={() => handleCopy(`intro-${draft.person_id}`, draft.intro_request)}
                className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {copiedKey === `intro-${draft.person_id}` ? 'Copied' : 'Copy intro request'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

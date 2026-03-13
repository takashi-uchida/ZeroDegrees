'use client'

import { useEffect, useState } from 'react'

import { IntroDraftView } from '@/lib/discovery-types'

export default function IntroDrafts({ drafts }: { drafts: IntroDraftView[] }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(drafts[0]?.person_id ?? null)

  useEffect(() => {
    if (!drafts.length) {
      setSelectedPersonId(null)
      return
    }

    setSelectedPersonId((current) => {
      if (current && drafts.some((draft) => draft.person_id === current)) {
        return current
      }

      return drafts[0].person_id
    })
  }, [drafts])

  const handleCopy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedKey(key)
    window.setTimeout(() => setCopiedKey(null), 1500)
  }

  const selectedDraft =
    drafts.find((draft) => draft.person_id === selectedPersonId) ??
    drafts[0]

  if (!selectedDraft) {
    return null
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Intro ready</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Copy your first outreach</h2>
        </div>
        <p className="max-w-xs text-sm leading-6 text-slate-500">
          Keep one draft open at a time so the right message stays obvious.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {drafts.map((draft) => (
          <button
            key={draft.person_id}
            type="button"
            onClick={() => setSelectedPersonId(draft.person_id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              draft.person_id === selectedDraft.person_id
                ? 'border-slate-900 bg-slate-950 text-white'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {draft.person_name}
          </button>
        ))}
      </div>

      <article className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-lg font-semibold text-slate-900">{selectedDraft.person_name}</h3>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Direct message</p>
          <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
            {selectedDraft.direct_message}
          </p>
          <button
            type="button"
            onClick={() => handleCopy(`dm-${selectedDraft.person_id}`, selectedDraft.direct_message)}
            className="mt-3 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {copiedKey === `dm-${selectedDraft.person_id}` ? 'Copied' : 'Copy DM'}
          </button>
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Intro request</p>
          <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
            {selectedDraft.intro_request}
          </p>
          <button
            type="button"
            onClick={() =>
              handleCopy(`intro-${selectedDraft.person_id}`, selectedDraft.intro_request)
            }
            className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {copiedKey === `intro-${selectedDraft.person_id}` ? 'Copied' : 'Copy intro request'}
          </button>
        </div>
      </article>
    </section>
  )
}

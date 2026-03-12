'use client'

import { useState } from 'react'

const DEMO_SCENARIOS = [
  {
    title: "AI SaaS founder",
    query: "I want to start an AI SaaS company but I don't have an engineering co-founder."
  },
  {
    title: "Founder with traction",
    query: "I have early customer demand for an AI workflow tool, but I still have not found the right technical co-founder."
  },
  {
    title: "Cross-border founder",
    query: "I am a founder in Japan with an AI SaaS idea, but I need a technical co-founder who can build with me globally."
  }
]

export default function QueryForm({ onSubmit, isLoading }: { 
  onSubmit: (query: string) => void
  isLoading: boolean 
}) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSubmit(query)
    }
  }

  const handleScenarioClick = (scenarioQuery: string) => {
    setQuery(scenarioQuery)
  }

  return (
    <div className="w-full space-y-4">
      {/* Demo Scenarios */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Demo scenarios</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">Try a founder situation</h3>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {DEMO_SCENARIOS.map((scenario, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleScenarioClick(scenario.query)}
              disabled={isLoading}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {scenario.title}
            </button>
          ))}
        </div>
      </div>

      {/* Query Form */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Describe your situation</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Find the one person you need next</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            ZeroDegrees will map your current blocker, then return your Future Self, Comrade, and Guide,
            plus the first outreach message you can actually send.
          </p>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="I want to start an AI SaaS company but I don't have an engineering co-founder..."
            className="mt-5 h-36 w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 p-4 text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="mt-4 w-full rounded-2xl bg-slate-950 px-6 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Discovering...
              </span>
            ) : 'Find My People'}
          </button>
        </div>
      </form>
    </div>
  )
}

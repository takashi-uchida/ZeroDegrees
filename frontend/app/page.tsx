'use client'

import { useState } from 'react'
import ActionPlan from '@/components/ActionPlan'
import DistanceMap from '@/components/DistanceMap'
import IntroDrafts from '@/components/IntroDrafts'
import ProgressRail from '@/components/ProgressRail'
import QueryForm from '@/components/QueryForm'
import ReasoningLog from '@/components/ReasoningLog'
import {
  DiscoveryEvent,
  DiscoveryProgressStep,
  DiscoveryResultView,
  UserContextView,
} from '@/lib/discovery-types'

export default function Home() {
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [events, setEvents] = useState<DiscoveryEvent[]>([])
  const [context, setContext] = useState<UserContextView | null>(null)
  const [result, setResult] = useState<DiscoveryResultView | null>(null)
  const [progress, setProgress] = useState<DiscoveryProgressStep | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [lastQuery, setLastQuery] = useState('')

  const resolveApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL
    }

    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.hostname}:8000`
    }

    return 'http://localhost:8000'
  }

  const applyEvent = (event: DiscoveryEvent) => {
    if (event.type !== 'result') {
      setEvents((prev) => [...prev, event])
    }

    if (event.type === 'status') {
      setProgress(event.data.step)
      return
    }

    if (event.type === 'context') {
      setContext(event.data)
      return
    }

    if (event.type === 'result') {
      setProgress('intro_ready')
      setResult(event.data)
    }
  }

  const handleDiscover = async (query: string) => {
    setIsDiscovering(true)
    setEvents([])
    setContext(null)
    setResult(null)
    setProgress('analyzing')
    setError(null)
    setShowReasoning(false)
    setLastQuery(query)

    try {
      const response = await fetch(`${resolveApiUrl()}/api/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let sawResult = false

      while (true) {
        const { done, value } = await reader!.read()
        buffer += decoder.decode(value, { stream: !done })
        const messages = buffer.split('\n\n')
        buffer = messages.pop() ?? ''

        for (const message of messages) {
          const line = message
            .split('\n')
            .find((entry) => entry.startsWith('data: '))
          if (!line) continue
          const data = JSON.parse(line.slice(6)) as DiscoveryEvent
          if (data.type === 'result') {
            sawResult = true
          }
          applyEvent(data)
        }

        if (done) {
          break
        }
      }

      if (buffer.trim()) {
        const line = buffer
          .split('\n')
          .find((entry) => entry.startsWith('data: '))
        if (line) {
          const data = JSON.parse(line.slice(6)) as DiscoveryEvent
          if (data.type === 'result') {
            sawResult = true
          }
          applyEvent(data)
        }
      }

      if (!sawResult) {
        throw new Error('The discovery stream ended before a final result was produced.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsDiscovering(false)
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef6ff_45%,#f8fafc_100%)] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-600">Distance-to-action engine</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">ZeroDegrees</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Find your Future Self, Comrade, and Guide before momentum dies. ZeroDegrees maps the
            distance between where you are and who you need next, then prepares the first outreach
            message for you.
          </p>
        </header>

        <QueryForm onSubmit={handleDiscover} isLoading={isDiscovering} />

        {(isDiscovering || progress) && (
          <div className="mt-8">
            <ProgressRail currentStep={progress} />
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-5">
            <p className="font-medium text-rose-700">Error: {error}</p>
            <p className="mt-1 text-sm text-rose-600">
              Please check if the backend is running and the API keys are configured.
            </p>
            {lastQuery && (
              <button
                type="button"
                onClick={() => handleDiscover(lastQuery)}
                className="mt-4 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {result && (
          <div className="mt-8">
            <DistanceMap
              currentState={{
                summary: result.current_state_summary,
                blocker: result.primary_blocker,
                desiredNextStep: result.desired_next_step,
              }}
              people={[result.future_self, result.comrade, result.guide]}
            />
          </div>
        )}

        {result && (
          <div className="mt-8">
            <ActionPlan items={result.action_plan} />
          </div>
        )}

        {result && result.intro_drafts.length > 0 && (
          <div className="mt-8">
            <IntroDrafts drafts={result.intro_drafts} />
          </div>
        )}

        {events.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-900">Want the raw matching trace?</p>
                <p className="text-sm text-slate-500">
                  Open the reasoning log to inspect the internal matching steps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReasoning((prev) => !prev)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {showReasoning ? 'Hide reasoning' : 'Show reasoning'}
              </button>
            </div>
          </div>
        )}

        {showReasoning && events.length > 0 && (
          <div className="mt-6">
            <ReasoningLog events={events} />
          </div>
        )}
      </div>
    </main>
  )
}

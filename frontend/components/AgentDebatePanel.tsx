'use client';

import { useState } from 'react';
import { DebateSession } from '@/types/agent';

export default function AgentDebatePanel({
  session,
}: {
  session: DebateSession | null;
}) {
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  if (!session) {
    return (
      <section className="rounded-[30px] border border-slate-800 bg-slate-950/90 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Route reasoning</p>
        <h2 className="mt-2 text-xl font-semibold text-white">No deliberation yet</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Start a search to watch the agents debate candidate routes in real time.
        </p>
      </section>
    );
  }

  const visibleMessages = showFullTranscript ? session.messages : session.messages.slice(-3);

  return (
    <section className="rounded-[30px] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.25)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Route reasoning</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{session.topic}</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
            session.status === 'concluded'
              ? 'bg-emerald-300/20 text-emerald-200'
              : session.status === 'converging'
                ? 'bg-amber-300/20 text-amber-200'
                : 'bg-sky-300/20 text-sky-200'
          }`}
        >
          {session.status}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {session.agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300"
          >
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
            {agent.name}
          </div>
        ))}
      </div>

      {session.consensus && (
        <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">Consensus</p>
          <p className="mt-2 text-sm font-semibold text-white">
            {Math.round(session.consensus.confidence * 100)}% confidence · {session.consensus.decision}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{session.consensus.reasoning}</p>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {visibleMessages.map((message) => {
          const agent = session.agents.find((item) => item.id === message.agentId);

          return (
            <article key={message.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: agent?.color ?? '#94a3b8' }}
                  />
                  <p className="text-sm font-semibold text-white">{agent?.name ?? 'Agent'}</p>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {message.type}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{message.content}</p>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowFullTranscript((current) => !current)}
        className="mt-5 rounded-full border border-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
      >
        {showFullTranscript ? 'Hide transcript' : 'Show full transcript'}
      </button>
    </section>
  );
}

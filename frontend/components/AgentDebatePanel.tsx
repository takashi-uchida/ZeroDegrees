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
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Multi-Agent Forum</p>
        <h2 className="mt-2 text-xl font-semibold text-white">No evaluation yet</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Start a search to watch agents evaluate candidates from multiple perspectives.
        </p>
      </section>
    );
  }

  const visibleMessages = showFullTranscript ? session.messages : session.messages.slice(-5);
  
  // エージェント別にメッセージをグループ化
  const messagesByAgent = visibleMessages.reduce((acc, msg) => {
    const agentName = session.agents.find(a => a.id === msg.agentId)?.name || 'Unknown';
    if (!acc[agentName]) acc[agentName] = [];
    acc[agentName].push(msg);
    return acc;
  }, {} as Record<string, typeof visibleMessages>);

  return (
    <section className="rounded-[30px] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.25)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Multi-Agent Forum</p>
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
            <span className="ml-2 text-slate-500">({messagesByAgent[agent.name]?.length || 0})</span>
          </div>
        ))}
      </div>

      {session.consensus && (
        <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">Final Decision</p>
          <p className="mt-2 text-sm font-semibold text-white">
            {Math.round(session.consensus.confidence * 100)}% confidence · {session.consensus.decision}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{session.consensus.reasoning}</p>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {visibleMessages.map((message) => {
          const agent = session.agents.find((item) => item.id === message.agentId);
          const isModeratorOrSynthesizer = agent?.name === 'Moderator' || agent?.name === 'Synthesizer';

          return (
            <article 
              key={message.id} 
              className={`rounded-2xl border p-4 ${
                isModeratorOrSynthesizer 
                  ? 'border-amber-300/30 bg-amber-400/5' 
                  : 'border-slate-800 bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: agent?.color ?? '#94a3b8' }}
                  />
                  <p className="text-sm font-semibold text-white">{agent?.name ?? 'Agent'}</p>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Round {message.round ?? 1}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{message.content}</p>
            </article>
          );
        })}
      </div>

      {session.messages.length > 5 && (
        <button
          type="button"
          onClick={() => setShowFullTranscript((current) => !current)}
          className="mt-5 rounded-full border border-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
        >
          {showFullTranscript ? 'Show recent only' : `Show all ${session.messages.length} messages`}
        </button>
      )}
    </section>
  );
}

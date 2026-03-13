'use client';

import { useState, useEffect, useRef } from 'react';
import { DebateSession, MessageType } from '@/types/agent';

export default function AgentDebatePanel({
  session,
}: {
  session: DebateSession | null;
}) {
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [filterAgent, setFilterAgent] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<MessageType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFullTranscript && session?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.messages?.length, showFullTranscript, session]);

  if (!session) {
    return (
      <section 
        className="rounded-[30px] border border-slate-800 bg-slate-950/90 p-6"
        aria-labelledby="debate-heading"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Multi-Agent Forum</p>
        <h2 id="debate-heading" className="mt-2 text-xl font-semibold text-white">No evaluation yet</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Start a search to watch agents evaluate candidates from multiple perspectives.
        </p>
      </section>
    );
  }

  const filteredMessages = session.messages.filter(msg => {
    if (filterAgent && msg.agentId !== filterAgent) return false;
    if (filterType && msg.type !== filterType) return false;
    return true;
  });

  const visibleMessages = showFullTranscript ? filteredMessages : filteredMessages.slice(-5);
  
  const messagesByAgent = session.messages.reduce((acc, msg) => {
    const agentName = session.agents.find(a => a.id === msg.agentId)?.name || 'Unknown';
    if (!acc[agentName]) acc[agentName] = [];
    acc[agentName].push(msg);
    return acc;
  }, {} as Record<string, typeof session.messages>);

  const sentimentIcon = (sentiment: string) => {
    if (sentiment === 'positive') return '✓';
    if (sentiment === 'negative') return '✗';
    return '−';
  };

  const sentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'text-emerald-400';
    if (sentiment === 'negative') return 'text-rose-400';
    return 'text-slate-400';
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section 
      className="rounded-[30px] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.25)]"
      aria-labelledby="debate-active-heading"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Multi-Agent Forum</p>
          <h2 id="debate-active-heading" className="mt-2 text-xl font-semibold text-white">{session.topic}</h2>
        </div>
        <span
          role="status"
          aria-label={`Debate status: ${session.status}`}
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

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Participating agents">
        {session.agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setFilterAgent(filterAgent === agent.id ? null : agent.id)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              filterAgent === agent.id
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/10 text-slate-300 hover:border-white/20'
            }`}
          >
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
            {agent.name}
            <span className="ml-2 text-slate-500">({messagesByAgent[agent.name]?.length || 0})</span>
          </button>
        ))}
      </div>

      {session.consensus && (
        <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">Consensus Reached</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {session.consensus.decision.toUpperCase()}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-950/50">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-1000 ease-out"
                  style={{ width: `${session.consensus.confidence * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-emerald-300">
                {Math.round(session.consensus.confidence * 100)}% confidence
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{session.consensus.reasoning}</p>
          <div className="mt-3 flex gap-4 text-xs">
            <div>
              <span className="text-slate-400">Supporting: </span>
              <span className="text-emerald-300">{session.consensus.supportingAgents.length}</span>
            </div>
            <div>
              <span className="text-slate-400">Opposing: </span>
              <span className="text-rose-300">{session.consensus.opposingAgents.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        {(['opinion', 'evidence', 'question', 'conclusion'] as MessageType[]).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(filterType === type ? null : type)}
            className={`rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-wider transition ${
              filterType === type
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="mt-5 max-h-[500px] space-y-3 overflow-y-auto">
        {visibleMessages.map((message) => {
          const agent = session.agents.find((item) => item.id === message.agentId);
          const isModeratorOrSynthesizer = agent?.role === 'synthesizer';

          return (
            <article 
              key={message.id} 
              className={`rounded-2xl border p-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                isModeratorOrSynthesizer 
                  ? 'border-amber-300/30 bg-amber-400/5' 
                  : 'border-slate-800 bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: agent?.color ?? '#94a3b8', color: '#000' }}
                  >
                    {agent?.name?.charAt(0) ?? 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{agent?.name ?? 'Agent'}</p>
                    <p className="text-[10px] text-slate-500">{formatTime(message.timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${sentimentColor(message.sentiment)}`}>
                    {sentimentIcon(message.sentiment)}
                  </span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-slate-400">
                    {message.type}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{message.content}</p>
            </article>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {session.messages.length > 5 && (
        <button
          type="button"
          onClick={() => setShowFullTranscript((current) => !current)}
          className="mt-5 w-full rounded-full border border-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
        >
          {showFullTranscript ? 'Show recent only' : `Show all ${session.messages.length} messages`}
        </button>
      )}
    </section>
  );
}

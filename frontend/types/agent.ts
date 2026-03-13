/**
 * AI Agent debate types
 */

export type AgentRole = 'researcher' | 'critic' | 'synthesizer';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  avatar: string;
  color: string; // for visual identification
}

export type MessageType = 'opinion' | 'evidence' | 'question' | 'conclusion';
export type MessageSentiment = 'positive' | 'neutral' | 'negative';

export interface DebateMessage {
  id: string;
  agentId: string;
  timestamp: number;
  content: string;
  type: MessageType;
  sentiment: MessageSentiment;
}

export type ConsensusDecision = 'accept' | 'reject' | 'defer';

export interface Consensus {
  decision: ConsensusDecision;
  confidence: number; // 0-1
  reasoning: string;
  supportingAgents: string[];
  opposingAgents: string[];
}

export type DebateStatus = 'deliberating' | 'converging' | 'concluded';

export interface DebateSession {
  id: string;
  topic: string; // e.g., "Evaluating candidate: John Doe"
  agents: Agent[];
  messages: DebateMessage[];
  consensus?: Consensus;
  status: DebateStatus;
}

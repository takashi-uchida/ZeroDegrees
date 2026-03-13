/**
 * Search and query types
 */

import { Node, Path } from './graph';
import { DebateSession } from './agent';

export type TargetType = 'future_self' | 'comrade' | 'guide' | 'any';

export interface SearchQuery {
  intent: string; // user's current challenge or goal
  context?: {
    industry?: string;
    stage?: string;
    interests?: string[];
  };
  targetType: TargetType;
}

export interface SearchResults {
  matches: Node[];
  paths: Path[];
  debateSummaries: DebateSession[];
  exploredNodeCount: number;
  totalSearchTime: number;
}

export type SearchState = 'idle' | 'searching' | 'found';

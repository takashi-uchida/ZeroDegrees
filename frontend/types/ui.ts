/**
 * UI state types
 */

import { SearchQuery, SearchResults, SearchState } from './search';
import { DebateSession } from './agent';

export type VisualizationMode = 'concentric' | 'heatmap' | 'path';

export interface ViewState {
  zoom: number;
  pan: { x: number; y: number };
  focusNodeId?: string;
}

export interface SearchUIState {
  query?: SearchQuery;
  state: SearchState;
  results?: SearchResults;
}

export interface DebateUIState {
  activeSessions: DebateSession[];
  expandedSessionId?: string;
}

export interface VisualizationState {
  mode: VisualizationMode;
  showLabels: boolean;
  showDistanceMetrics: boolean;
}

export interface AccessibilityState {
  reducedMotion: boolean;
  highContrast: boolean;
  keyboardNavigationEnabled: boolean;
}

export interface UIState {
  view: ViewState;
  search: SearchUIState;
  debate: DebateUIState;
  visualization: VisualizationState;
  accessibility: AccessibilityState;
}

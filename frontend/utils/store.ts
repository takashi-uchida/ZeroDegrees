/**
 * Global state management using Zustand
 */

import { create } from 'zustand';
import { UIState, SearchState, VisualizationMode } from '@/types';
import { Node, Edge } from '@/types/graph';
import { DebateSession } from '@/types/agent';

interface AppState extends UIState {
  // Graph data
  nodes: Node[];
  edges: Edge[];
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  
  // View actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setFocusNode: (nodeId: string | undefined) => void;
  
  // Search actions
  setSearchState: (state: SearchState) => void;
  
  // Visualization actions
  setVisualizationMode: (mode: VisualizationMode) => void;
  toggleLabels: () => void;
  toggleDistanceMetrics: () => void;
  
  // Debate actions
  addDebateSession: (session: DebateSession) => void;
  setExpandedSession: (sessionId: string | undefined) => void;
  
  // Accessibility actions
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  nodes: [],
  edges: [],
  
  view: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    focusNodeId: undefined,
  },
  
  search: {
    state: 'idle',
  },
  
  debate: {
    activeSessions: [],
  },
  
  visualization: {
    mode: 'concentric',
    showLabels: true,
    showDistanceMetrics: true,
  },
  
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    keyboardNavigationEnabled: true,
  },
  
  // Actions
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
  
  setZoom: (zoom) => set((state) => ({ view: { ...state.view, zoom } })),
  setPan: (pan) => set((state) => ({ view: { ...state.view, pan } })),
  setFocusNode: (focusNodeId) => set((state) => ({ view: { ...state.view, focusNodeId } })),
  
  setSearchState: (searchState) =>
    set((state) => ({ search: { ...state.search, state: searchState } })),
  
  setVisualizationMode: (mode) =>
    set((state) => ({ visualization: { ...state.visualization, mode } })),
  toggleLabels: () =>
    set((state) => ({
      visualization: { ...state.visualization, showLabels: !state.visualization.showLabels },
    })),
  toggleDistanceMetrics: () =>
    set((state) => ({
      visualization: {
        ...state.visualization,
        showDistanceMetrics: !state.visualization.showDistanceMetrics,
      },
    })),
  
  addDebateSession: (session) =>
    set((state) => ({
      debate: { ...state.debate, activeSessions: [...state.debate.activeSessions, session] },
    })),
  setExpandedSession: (expandedSessionId) =>
    set((state) => ({ debate: { ...state.debate, expandedSessionId } })),
  
  setReducedMotion: (reducedMotion) =>
    set((state) => ({ accessibility: { ...state.accessibility, reducedMotion } })),
  setHighContrast: (highContrast) =>
    set((state) => ({ accessibility: { ...state.accessibility, highContrast } })),
}));

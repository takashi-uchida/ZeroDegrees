/**
 * Core graph data types for the Six Degrees visualization
 */

export type NodeType = 'user' | 'future_self' | 'comrade' | 'guide';

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  distance: number;
  metadata: {
    avatar?: string;
    description: string;
    viewpointShifts: number;
  };
  position?: { x: number; y: number };
}

export type EdgeType = 'direct' | 'indirect' | 'potential';

export interface Edge {
  id: string;
  source: string;
  target: string;
  strength: number; // 0-1, affects visual weight
  type: EdgeType;
  metadata: {
    connectionReason: string;
    intermediaries?: string[];
  };
}

export interface GraphData {
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;
  adjacencyList: Map<string, string[]>;
  userNodeId: string;
}

export interface Path {
  nodes: string[];
  distance: number;
  quality: number; // 0-1, based on connection strength
}

/**
 * Animation and visualization types
 */

export type AnimationEventType =
  | 'node_discovered'
  | 'edge_explored'
  | 'path_found'
  | 'agent_opinion';

export interface AnimationEvent {
  type: AnimationEventType;
  timestamp: number;
  data: any;
}

export type AnimationType = 'node_pulse' | 'edge_flow' | 'path_trace' | 'consensus_converge';

export type EasingFunction = (t: number) => number;

export interface Animation {
  id: string;
  type: AnimationType;
  target: string; // node or edge ID
  duration: number;
  startTime: number;
  easing: EasingFunction;
}

export interface AnimationState {
  activeAnimations: Map<string, Animation>;
  queue: AnimationEvent[];
  isPlaying: boolean;
  speed: number; // 0.5x to 2x
}

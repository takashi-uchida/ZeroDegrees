/**
 * UpdateOrchestrator - Coordinates real-time updates with animation queue and throttling
 * 
 * This class wraps the WebSocket service and adds:
 * - Animation queue to prevent overwhelming UI
 * - Throttling for rapid updates
 * - Animation coordination across components
 * - Event emission to React components via callbacks
 * 
 * Requirements: 2.5, 3.1, 6.2
 */

import { Node, Edge, Path } from '@/types/graph';
import { DebateMessage } from '@/types/agent';
import { SearchResults } from '@/types/search';
import { AnimationEvent, AnimationEventType } from '@/types/animation';
import { websocketService, ConnectionState } from './websocket';

interface ThrottleConfig {
  nodeDiscoveryDelay: number; // ms between node discovery animations
  edgeExplorationDelay: number; // ms between edge exploration animations
  debateMessageDelay: number; // ms between debate message displays
  maxQueueSize: number; // maximum items in animation queue
}

interface OrchestratorCallbacks {
  onNodeDiscovered?: (node: Node) => void;
  onEdgeExplored?: (edge: Edge) => void;
  onPathFound?: (path: Path) => void;
  onDebateUpdate?: (message: DebateMessage) => void;
  onSearchComplete?: (results: SearchResults) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
  onAnimationQueued?: (event: AnimationEvent) => void;
  onQueueProcessed?: () => void;
}

export class UpdateOrchestrator {
  private animationQueue: AnimationEvent[] = [];
  private isProcessingQueue = false;
  private callbacks: OrchestratorCallbacks = {};
  private throttleTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastProcessedTime: Map<string, number> = new Map();
  
  private throttleConfig: ThrottleConfig = {
    nodeDiscoveryDelay: 300, // 300ms between node animations
    edgeExplorationDelay: 200, // 200ms between edge animations
    debateMessageDelay: 500, // 500ms between debate messages
    maxQueueSize: 50, // prevent memory issues with rapid updates
  };

  private pendingNodes: Node[] = [];
  private pendingEdges: Edge[] = [];
  private pendingDebateMessages: DebateMessage[] = [];

  constructor(config?: Partial<ThrottleConfig>) {
    if (config) {
      this.throttleConfig = { ...this.throttleConfig, ...config };
    }
  }

  /**
   * Connect to WebSocket and set up event listeners
   */
  connect(userId: string): void {
    // Set up WebSocket event listeners
    websocketService.onNodeDiscovered((node: Node) => {
      this.handleNodeDiscovered(node);
    });

    websocketService.onEdgeExplored((edge: Edge) => {
      this.handleEdgeExplored(edge);
    });

    websocketService.onPathFound((path: Path) => {
      this.handlePathFound(path);
    });

    websocketService.onDebateUpdate((message: DebateMessage) => {
      this.handleDebateUpdate(message);
    });

    websocketService.onSearchComplete((results: SearchResults) => {
      this.handleSearchComplete(results);
    });

    websocketService.onConnectionStateChange((state: ConnectionState) => {
      this.callbacks.onConnectionStateChange?.(state);
    });

    websocketService.onError((error: Error) => {
      this.callbacks.onError?.(error);
    });

    // Connect to WebSocket
    websocketService.connect(userId);
  }

  /**
   * Disconnect from WebSocket and clean up
   */
  disconnect(): void {
    this.clearAllThrottles();
    this.animationQueue = [];
    this.pendingNodes = [];
    this.pendingEdges = [];
    this.pendingDebateMessages = [];
    this.isProcessingQueue = false;
    websocketService.disconnect();
  }

  /**
   * Register callbacks for various events
   */
  on(callbacks: OrchestratorCallbacks): () => void {
    this.callbacks = { ...this.callbacks, ...callbacks };

    return () => {
      Object.entries(callbacks).forEach(([key, callback]) => {
        if (!callback) {
          return;
        }

        const typedKey = key as keyof OrchestratorCallbacks;
        if (this.callbacks[typedKey] === callback) {
          delete this.callbacks[typedKey];
        }
      });
    };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return websocketService.getConnectionState();
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.animationQueue.length;
  }

  /**
   * Configure throttle settings
   */
  configureThrottle(config: Partial<ThrottleConfig>): void {
    this.throttleConfig = { ...this.throttleConfig, ...config };
  }

  /**
   * Handle node discovered event with throttling
   */
  private handleNodeDiscovered(node: Node): void {
    this.pendingNodes.push(node);
    this.throttle('node_discovered', () => {
      this.processPendingNodes();
    }, this.throttleConfig.nodeDiscoveryDelay);
  }

  /**
   * Handle edge explored event with throttling
   */
  private handleEdgeExplored(edge: Edge): void {
    this.pendingEdges.push(edge);
    this.throttle('edge_explored', () => {
      this.processPendingEdges();
    }, this.throttleConfig.edgeExplorationDelay);
  }

  /**
   * Handle path found event (no throttling - important event)
   */
  private handlePathFound(path: Path): void {
    const event: AnimationEvent = {
      type: 'path_found',
      timestamp: Date.now(),
      data: path,
    };
    
    this.queueAnimation(event);
    this.callbacks.onPathFound?.(path);
  }

  /**
   * Handle debate update event with throttling
   */
  private handleDebateUpdate(message: DebateMessage): void {
    this.pendingDebateMessages.push(message);
    this.throttle('debate_update', () => {
      this.processPendingDebateMessages();
    }, this.throttleConfig.debateMessageDelay);
  }

  /**
   * Handle search complete event (no throttling - important event)
   */
  private handleSearchComplete(results: SearchResults): void {
    // Clear queue and pending items when search completes
    this.animationQueue = [];
    this.pendingNodes = [];
    this.pendingEdges = [];
    this.pendingDebateMessages = [];
    
    this.callbacks.onSearchComplete?.(results);
  }

  /**
   * Process pending nodes in batch
   */
  private processPendingNodes(): void {
    if (this.pendingNodes.length === 0) return;

    const nodesToProcess = [...this.pendingNodes];
    this.pendingNodes = [];

    nodesToProcess.forEach((node) => {
      const event: AnimationEvent = {
        type: 'node_discovered',
        timestamp: Date.now(),
        data: node,
      };
      
      this.queueAnimation(event);
      this.callbacks.onNodeDiscovered?.(node);
    });
  }

  /**
   * Process pending edges in batch
   */
  private processPendingEdges(): void {
    if (this.pendingEdges.length === 0) return;

    const edgesToProcess = [...this.pendingEdges];
    this.pendingEdges = [];

    edgesToProcess.forEach((edge) => {
      const event: AnimationEvent = {
        type: 'edge_explored',
        timestamp: Date.now(),
        data: edge,
      };
      
      this.queueAnimation(event);
      this.callbacks.onEdgeExplored?.(edge);
    });
  }

  /**
   * Process pending debate messages in batch
   */
  private processPendingDebateMessages(): void {
    if (this.pendingDebateMessages.length === 0) return;

    const messagesToProcess = [...this.pendingDebateMessages];
    this.pendingDebateMessages = [];

    messagesToProcess.forEach((message) => {
      const event: AnimationEvent = {
        type: 'agent_opinion',
        timestamp: Date.now(),
        data: message,
      };
      
      this.queueAnimation(event);
      this.callbacks.onDebateUpdate?.(message);
    });
  }

  /**
   * Queue an animation event
   */
  private queueAnimation(event: AnimationEvent): void {
    // Prevent queue from growing too large
    if (this.animationQueue.length >= this.throttleConfig.maxQueueSize) {
      console.warn('Animation queue full, dropping oldest event');
      this.animationQueue.shift();
    }

    this.animationQueue.push(event);
    this.callbacks.onAnimationQueued?.(event);

    // Start processing queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process animation queue sequentially
   */
  private processQueue(): void {
    if (this.isProcessingQueue || this.animationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    this.processNextAnimation();
  }

  /**
   * Process next animation in queue
   */
  private processNextAnimation(): void {
    if (this.animationQueue.length === 0) {
      this.isProcessingQueue = false;
      this.callbacks.onQueueProcessed?.();
      return;
    }

    const event = this.animationQueue.shift();
    if (!event) {
      this.isProcessingQueue = false;
      return;
    }

    // Wait for animation to complete based on event type
    const duration = this.getAnimationDuration(event.type);
    setTimeout(() => {
      this.processNextAnimation();
    }, duration);
  }

  /**
   * Get animation duration for event type
   */
  private getAnimationDuration(type: AnimationEventType): number {
    switch (type) {
      case 'node_discovered':
        return 400; // 400ms for node pulse animation
      case 'edge_explored':
        return 300; // 300ms for edge flow animation
      case 'path_found':
        return 800; // 800ms for path trace animation
      case 'agent_opinion':
        return 200; // 200ms for agent opinion display
      default:
        return 300;
    }
  }

  /**
   * Throttle function execution
   */
  private throttle(key: string, fn: () => void, delay: number): void {
    // Clear existing timer for this key
    const existingTimer = this.throttleTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Always schedule execution after delay to batch updates
    const timer = setTimeout(() => {
      this.lastProcessedTime.set(key, Date.now());
      this.throttleTimers.delete(key);
      fn();
    }, delay);
    
    this.throttleTimers.set(key, timer);
  }

  /**
   * Clear all throttle timers
   */
  private clearAllThrottles(): void {
    this.throttleTimers.forEach((timer) => clearTimeout(timer));
    this.throttleTimers.clear();
    this.lastProcessedTime.clear();
  }

  /**
   * Clear animation queue (useful for canceling search)
   */
  clearQueue(): void {
    this.animationQueue = [];
    this.pendingNodes = [];
    this.pendingEdges = [];
    this.pendingDebateMessages = [];
    this.isProcessingQueue = false;
  }

  /**
   * Pause queue processing
   */
  pauseQueue(): void {
    this.isProcessingQueue = false;
  }

  /**
   * Resume queue processing
   */
  resumeQueue(): void {
    if (!this.isProcessingQueue && this.animationQueue.length > 0) {
      this.processQueue();
    }
  }
}

// Export singleton instance
export const updateOrchestrator = new UpdateOrchestrator();

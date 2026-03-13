/**
 * WebSocket service for real-time updates
 * Implements reconnection logic with exponential backoff and connection state management
 */

import { io, Socket } from 'socket.io-client';
import { Node, Edge, Path } from '@/types/graph';
import { DebateMessage } from '@/types/agent';
import { SearchResults } from '@/types/search';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface UpdateOrchestrator {
  connect(userId: string): void;
  disconnect(): void;
  onNodeDiscovered(callback: (node: Node) => void): void;
  onEdgeExplored(callback: (edge: Edge) => void): void;
  onPathFound(callback: (path: Path) => void): void;
  onDebateUpdate(callback: (message: DebateMessage) => void): void;
  onSearchComplete(callback: (results: SearchResults) => void): void;
  onConnectionStateChange(callback: (state: ConnectionState) => void): void;
  onError(callback: (error: Error) => void): void;
  getConnectionState(): ConnectionState;
}

interface ReconnectionConfig {
  initialDelay: number;
  maxDelay: number;
  maxAttempts: number;
  backoffMultiplier: number;
}

class WebSocketService implements UpdateOrchestrator {
  private socket: Socket | null = null;
  private callbacks: Map<string, Function[]> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private reconnectionAttempts = 0;
  private reconnectionConfig: ReconnectionConfig = {
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    maxAttempts: 10,
    backoffMultiplier: 2,
  };
  private reconnectionTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;

  connect(userId: string): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;
    this.setConnectionState('connecting');
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';
    
    this.socket = io(wsUrl, {
      query: { userId },
      transports: ['websocket', 'polling'],
      reconnection: false, // We handle reconnection manually
      timeout: 10000, // 10 second connection timeout
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    this.clearReconnectionTimer();
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.callbacks.clear();
    this.reconnectionAttempts = 0;
    this.userId = null;
    this.setConnectionState('disconnected');
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  onNodeDiscovered(callback: (node: Node) => void): void {
    this.on('node_discovered', callback);
  }

  onEdgeExplored(callback: (edge: Edge) => void): void {
    this.on('edge_explored', callback);
  }

  onPathFound(callback: (path: Path) => void): void {
    this.on('path_found', callback);
  }

  onDebateUpdate(callback: (message: DebateMessage) => void): void {
    this.on('debate_update', callback);
  }

  onSearchComplete(callback: (results: SearchResults) => void): void {
    this.on('search_complete', callback);
  }

  onConnectionStateChange(callback: (state: ConnectionState) => void): void {
    this.on('connection_state_change', callback);
  }

  onError(callback: (error: Error) => void): void {
    this.on('error', callback);
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectionAttempts = 0;
      this.setConnectionState('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      
      // Handle different disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        this.setConnectionState('disconnected');
        this.emitError(new Error('Server disconnected the connection'));
      } else {
        // Client-side disconnect or network issue, attempt reconnection
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.setConnectionState('error');
      this.emitError(error);
      this.handleReconnection();
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emitError(error);
    });

    // Data events
    this.socket.on('node_discovered', (node: Node) => {
      this.emit('node_discovered', node);
    });

    this.socket.on('edge_explored', (edge: Edge) => {
      this.emit('edge_explored', edge);
    });

    this.socket.on('path_found', (path: Path) => {
      this.emit('path_found', path);
    });

    this.socket.on('debate_update', (message: DebateMessage) => {
      this.emit('debate_update', message);
    });

    this.socket.on('search_complete', (results: SearchResults) => {
      this.emit('search_complete', results);
    });
  }

  private handleReconnection(): void {
    if (this.reconnectionAttempts >= this.reconnectionConfig.maxAttempts) {
      console.error('Max reconnection attempts reached');
      this.setConnectionState('error');
      this.emitError(new Error('Failed to reconnect after maximum attempts'));
      return;
    }

    this.setConnectionState('reconnecting');
    this.reconnectionAttempts++;

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectionConfig.initialDelay * 
        Math.pow(this.reconnectionConfig.backoffMultiplier, this.reconnectionAttempts - 1),
      this.reconnectionConfig.maxDelay
    );

    console.log(
      `Reconnection attempt ${this.reconnectionAttempts}/${this.reconnectionConfig.maxAttempts} in ${delay}ms`
    );

    this.clearReconnectionTimer();
    this.reconnectionTimer = setTimeout(() => {
      if (this.userId) {
        this.reconnect();
      }
    }, delay);
  }

  private reconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    if (this.userId) {
      this.connect(this.userId);
    }
  }

  private clearReconnectionTimer(): void {
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.emit('connection_state_change', state);
    }
  }

  private emitError(error: Error): void {
    this.emit('error', error);
  }

  private on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // Method to remove specific callback
  off(event: string, callback: Function): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Method to configure reconnection behavior
  configureReconnection(config: Partial<ReconnectionConfig>): void {
    this.reconnectionConfig = {
      ...this.reconnectionConfig,
      ...config,
    };
  }
}

export const websocketService = new WebSocketService();

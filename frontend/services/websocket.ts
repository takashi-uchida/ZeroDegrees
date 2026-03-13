/**
 * WebSocket service for real-time updates
 */

import { io, Socket } from 'socket.io-client';
import { Node, Edge, Path } from '@/types/graph';
import { DebateMessage } from '@/types/agent';
import { SearchResults } from '@/types/search';

export interface UpdateOrchestrator {
  connect(userId: string): void;
  disconnect(): void;
  onNodeDiscovered(callback: (node: Node) => void): void;
  onEdgeExplored(callback: (edge: Edge) => void): void;
  onPathFound(callback: (path: Path) => void): void;
  onDebateUpdate(callback: (message: DebateMessage) => void): void;
  onSearchComplete(callback: (results: SearchResults) => void): void;
}

class WebSocketService implements UpdateOrchestrator {
  private socket: Socket | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  connect(userId: string): void {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';
    
    this.socket = io(wsUrl, {
      query: { userId },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Set up event listeners
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

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.callbacks.clear();
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
}

export const websocketService = new WebSocketService();

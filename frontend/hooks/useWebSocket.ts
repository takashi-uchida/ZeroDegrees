/**
 * Custom hook for WebSocket connection
 * Provides connection state management and error handling
 */

import { useEffect, useState } from 'react';
import { websocketService, ConnectionState } from '@/services/websocket';
import { useStore } from '@/utils/store';

export function useWebSocket(userId: string) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  
  const addNode = useStore((state) => state.addNode);
  const addEdge = useStore((state) => state.addEdge);
  const addDebateSession = useStore((state) => state.addDebateSession);
  const setSearchState = useStore((state) => state.setSearchState);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect(userId);

    // Set up connection state listener
    websocketService.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    // Set up error listener
    websocketService.onError((err) => {
      setError(err);
      console.error('WebSocket error:', err);
    });

    // Set up event listeners
    websocketService.onNodeDiscovered((node) => {
      addNode(node);
    });

    websocketService.onEdgeExplored((edge) => {
      addEdge(edge);
    });

    websocketService.onPathFound((path) => {
      console.log('Path found:', path);
    });

    websocketService.onDebateUpdate((message) => {
      console.log('Debate update:', message);
    });

    websocketService.onSearchComplete((results) => {
      console.log('Search complete:', results);
      setSearchState('found');
    });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, [userId, addNode, addEdge, addDebateSession, setSearchState]);

  return {
    connectionState,
    error,
    isConnected: connectionState === 'connected',
    isReconnecting: connectionState === 'reconnecting',
  };
}

/**
 * Custom hook for WebSocket connection
 */

import { useEffect } from 'react';
import { websocketService } from '@/services/websocket';
import { useStore } from '@/utils/store';

export function useWebSocket(userId: string) {
  const addNode = useStore((state) => state.addNode);
  const addEdge = useStore((state) => state.addEdge);
  const addDebateSession = useStore((state) => state.addDebateSession);
  const setSearchState = useStore((state) => state.setSearchState);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect(userId);

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
}

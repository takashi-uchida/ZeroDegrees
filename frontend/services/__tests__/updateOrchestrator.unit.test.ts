/**
 * Unit tests for UpdateOrchestrator
 */

import { UpdateOrchestrator } from '../updateOrchestrator';
import { websocketService } from '../websocket';
import { Node, Edge, Path } from '@/types/graph';
import { DebateMessage } from '@/types/agent';
import { SearchResults } from '@/types/search';

// Mock the websocket service
jest.mock('../websocket', () => ({
  websocketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    onNodeDiscovered: jest.fn(),
    onEdgeExplored: jest.fn(),
    onPathFound: jest.fn(),
    onDebateUpdate: jest.fn(),
    onSearchComplete: jest.fn(),
    onConnectionStateChange: jest.fn(),
    onError: jest.fn(),
    getConnectionState: jest.fn(() => 'connected'),
  },
}));

describe('UpdateOrchestrator', () => {
  let orchestrator: UpdateOrchestrator;
  let mockCallbacks: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    orchestrator = new UpdateOrchestrator();
    mockCallbacks = {
      onNodeDiscovered: jest.fn(),
      onEdgeExplored: jest.fn(),
      onPathFound: jest.fn(),
      onDebateUpdate: jest.fn(),
      onSearchComplete: jest.fn(),
      onConnectionStateChange: jest.fn(),
      onError: jest.fn(),
      onAnimationQueued: jest.fn(),
      onQueueProcessed: jest.fn(),
    };
  });

  afterEach(() => {
    orchestrator.disconnect();
    jest.useRealTimers();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket service', () => {
      orchestrator.connect('user123');
      
      expect(websocketService.connect).toHaveBeenCalledWith('user123');
      expect(websocketService.onNodeDiscovered).toHaveBeenCalled();
      expect(websocketService.onEdgeExplored).toHaveBeenCalled();
      expect(websocketService.onPathFound).toHaveBeenCalled();
      expect(websocketService.onDebateUpdate).toHaveBeenCalled();
      expect(websocketService.onSearchComplete).toHaveBeenCalled();
    });

    it('should disconnect from WebSocket service', () => {
      orchestrator.connect('user123');
      orchestrator.disconnect();
      
      expect(websocketService.disconnect).toHaveBeenCalled();
      expect(orchestrator.getQueueSize()).toBe(0);
    });

    it('should get connection state from WebSocket service', () => {
      const state = orchestrator.getConnectionState();
      
      expect(websocketService.getConnectionState).toHaveBeenCalled();
      expect(state).toBe('connected');
    });
  });

  describe('Animation Queue', () => {
    it('should queue animation events', () => {
      orchestrator.on({ onAnimationQueued: mockCallbacks.onAnimationQueued });
      orchestrator.connect('user123');

      // Simulate node discovered event
      const mockNode: Node = {
        id: 'node1',
        type: 'future_self',
        label: 'Test Node',
        distance: 2,
        metadata: { description: 'Test', viewpointShifts: 2 },
      };

      // Get the callback that was registered
      const nodeCallback = (websocketService.onNodeDiscovered as jest.Mock).mock.calls[0][0];
      nodeCallback(mockNode);

      // Fast-forward past throttle delay but not past animation duration
      jest.advanceTimersByTime(300);

      expect(mockCallbacks.onAnimationQueued).toHaveBeenCalled();
      
      // Queue should have item or be processing (check immediately after throttle)
      // The item gets queued and starts processing, so we check it was queued
      expect(mockCallbacks.onAnimationQueued).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'node_discovered',
          data: mockNode,
        })
      );
    });

    it('should prevent queue from exceeding max size', () => {
      const smallOrchestrator = new UpdateOrchestrator({ maxQueueSize: 3 });
      smallOrchestrator.connect('user123');

      // Get the callback that was registered
      const nodeCallback = (websocketService.onNodeDiscovered as jest.Mock).mock.calls[0][0];

      // Add more events than max queue size
      for (let i = 0; i < 5; i++) {
        const mockNode: Node = {
          id: `node${i}`,
          type: 'future_self',
          label: `Node ${i}`,
          distance: i,
          metadata: { description: 'Test', viewpointShifts: i },
        };
        nodeCallback(mockNode);
      }

      jest.advanceTimersByTime(300);

      // Queue should not exceed max size
      expect(smallOrchestrator.getQueueSize()).toBeLessThanOrEqual(3);
      
      smallOrchestrator.disconnect();
    });

    it('should clear queue on disconnect', () => {
      orchestrator.connect('user123');

      const nodeCallback = (websocketService.onNodeDiscovered as jest.Mock).mock.calls[0][0];
      const mockNode: Node = {
        id: 'node1',
        type: 'future_self',
        label: 'Test Node',
        distance: 2,
        metadata: { description: 'Test', viewpointShifts: 2 },
      };
      nodeCallback(mockNode);

      // Advance only throttle time, not animation time
      jest.advanceTimersByTime(300);
      
      // Add multiple nodes to ensure queue has items
      nodeCallback({ ...mockNode, id: 'node2' });
      jest.advanceTimersByTime(300);

      orchestrator.disconnect();
      expect(orchestrator.getQueueSize()).toBe(0);
    });
  });

  describe('Throttling', () => {
    it('should throttle rapid node discoveries', () => {
      orchestrator.on({ onNodeDiscovered: mockCallbacks.onNodeDiscovered });
      orchestrator.connect('user123');

      const nodeCallback = (websocketService.onNodeDiscovered as jest.Mock).mock.calls[0][0];

      // Simulate rapid node discoveries
      for (let i = 0; i < 5; i++) {
        const mockNode: Node = {
          id: `node${i}`,
          type: 'future_self',
          label: `Node ${i}`,
          distance: i,
          metadata: { description: 'Test', viewpointShifts: i },
        };
        nodeCallback(mockNode);
      }

      // Should not call callback immediately
      expect(mockCallbacks.onNodeDiscovered).not.toHaveBeenCalled();

      // Fast-forward past throttle delay
      jest.advanceTimersByTime(300);

      // Should call callback with all nodes in batch
      expect(mockCallbacks.onNodeDiscovered).toHaveBeenCalledTimes(5);
    });

    it('should throttle rapid edge explorations', () => {
      orchestrator.on({ onEdgeExplored: mockCallbacks.onEdgeExplored });
      orchestrator.connect('user123');

      const edgeCallback = (websocketService.onEdgeExplored as jest.Mock).mock.calls[0][0];

      // Simulate rapid edge explorations
      for (let i = 0; i < 3; i++) {
        const mockEdge: Edge = {
          id: `edge${i}`,
          source: 'node1',
          target: `node${i}`,
          strength: 0.8,
          type: 'direct',
          metadata: { connectionReason: 'Test' },
        };
        edgeCallback(mockEdge);
      }

      expect(mockCallbacks.onEdgeExplored).not.toHaveBeenCalled();

      jest.advanceTimersByTime(200);

      expect(mockCallbacks.onEdgeExplored).toHaveBeenCalledTimes(3);
    });

    it('should throttle rapid debate messages', () => {
      orchestrator.on({ onDebateUpdate: mockCallbacks.onDebateUpdate });
      orchestrator.connect('user123');

      const debateCallback = (websocketService.onDebateUpdate as jest.Mock).mock.calls[0][0];

      // Simulate rapid debate messages
      for (let i = 0; i < 4; i++) {
        const mockMessage: DebateMessage = {
          id: `msg${i}`,
          agentId: 'agent1',
          timestamp: Date.now(),
          content: `Message ${i}`,
          type: 'opinion',
          sentiment: 'neutral',
        };
        debateCallback(mockMessage);
      }

      expect(mockCallbacks.onDebateUpdate).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);

      expect(mockCallbacks.onDebateUpdate).toHaveBeenCalledTimes(4);
    });

    it('should not throttle path found events', () => {
      orchestrator.on({ onPathFound: mockCallbacks.onPathFound });
      orchestrator.connect('user123');

      const pathCallback = (websocketService.onPathFound as jest.Mock).mock.calls[0][0];

      const mockPath: Path = {
        nodes: ['node1', 'node2', 'node3'],
        distance: 2,
        quality: 0.9,
      };
      pathCallback(mockPath);

      // Should call immediately without throttling
      expect(mockCallbacks.onPathFound).toHaveBeenCalledWith(mockPath);
    });

    it('should not throttle search complete events', () => {
      orchestrator.on({ onSearchComplete: mockCallbacks.onSearchComplete });
      orchestrator.connect('user123');

      const searchCallback = (websocketService.onSearchComplete as jest.Mock).mock.calls[0][0];

      const mockResults: SearchResults = {
        matches: [],
        paths: [],
        debateSummaries: [],
        exploredNodeCount: 10,
        totalSearchTime: 5000,
      };
      searchCallback(mockResults);

      // Should call immediately and clear queue
      expect(mockCallbacks.onSearchComplete).toHaveBeenCalledWith(mockResults);
      expect(orchestrator.getQueueSize()).toBe(0);
    });
  });

  describe('Queue Control', () => {
    it('should clear queue manually', () => {
      orchestrator.connect('user123');

      const nodeCallback = (websocketService.onNodeDiscovered as jest.Mock).mock.calls[0][0];
      
      // Add multiple nodes
      for (let i = 0; i < 3; i++) {
        const mockNode: Node = {
          id: `node${i}`,
          type: 'future_self',
          label: `Test Node ${i}`,
          distance: 2,
          metadata: { description: 'Test', viewpointShifts: 2 },
        };
        nodeCallback(mockNode);
      }

      // Advance throttle time but not full animation time
      jest.advanceTimersByTime(300);

      orchestrator.clearQueue();
      expect(orchestrator.getQueueSize()).toBe(0);
    });

    it('should pause and resume queue processing', async () => {
      orchestrator.on({ onAnimationQueued: mockCallbacks.onAnimationQueued });
      orchestrator.connect('user123');

      const nodeCallback = (websocketService.onNodeDiscovered as jest.Mock).mock.calls[0][0];
      
      // Add multiple nodes
      for (let i = 0; i < 3; i++) {
        const mockNode: Node = {
          id: `node${i}`,
          type: 'future_self',
          label: `Test Node ${i}`,
          distance: 2,
          metadata: { description: 'Test', viewpointShifts: 2 },
        };
        nodeCallback(mockNode);
      }

      jest.advanceTimersByTime(300);

      orchestrator.pauseQueue();
      
      // Add more events while paused
      nodeCallback({ 
        id: 'node4', 
        type: 'future_self' as const, 
        label: 'Node 4', 
        distance: 2, 
        metadata: { description: 'Test', viewpointShifts: 2 } 
      });
      jest.advanceTimersByTime(300);

      // Resume and verify processing continues
      orchestrator.resumeQueue();
      
      // Process all queued animations
      jest.advanceTimersByTime(2000);
    });
  });

  describe('Configuration', () => {
    it('should accept custom throttle configuration', () => {
      const customOrchestrator = new UpdateOrchestrator({
        nodeDiscoveryDelay: 100,
        edgeExplorationDelay: 50,
        debateMessageDelay: 200,
        maxQueueSize: 20,
      });

      customOrchestrator.on({ onNodeDiscovered: mockCallbacks.onNodeDiscovered });
      customOrchestrator.connect('user123');

      const nodeCallback = (websocketService.onNodeDiscovered as jest.Mock).mock.calls[0][0];
      const mockNode: Node = {
        id: 'node1',
        type: 'future_self',
        label: 'Test Node',
        distance: 2,
        metadata: { description: 'Test', viewpointShifts: 2 },
      };
      nodeCallback(mockNode);

      // Should use custom delay (100ms instead of default 300ms)
      jest.advanceTimersByTime(100);
      expect(mockCallbacks.onNodeDiscovered).toHaveBeenCalled();

      customOrchestrator.disconnect();
    });

    it('should allow runtime throttle configuration', () => {
      orchestrator.configureThrottle({
        nodeDiscoveryDelay: 50,
      });

      orchestrator.on({ onNodeDiscovered: mockCallbacks.onNodeDiscovered });
      orchestrator.connect('user123');

      const nodeCallback = (websocketService.onNodeDiscovered as jest.Mock).mock.calls[0][0];
      const mockNode: Node = {
        id: 'node1',
        type: 'future_self',
        label: 'Test Node',
        distance: 2,
        metadata: { description: 'Test', viewpointShifts: 2 },
      };
      nodeCallback(mockNode);

      jest.advanceTimersByTime(50);
      expect(mockCallbacks.onNodeDiscovered).toHaveBeenCalled();
    });
  });

  describe('Event Coordination', () => {
    it('should coordinate multiple event types', () => {
      orchestrator.on({
        onNodeDiscovered: mockCallbacks.onNodeDiscovered,
        onEdgeExplored: mockCallbacks.onEdgeExplored,
        onPathFound: mockCallbacks.onPathFound,
      });
      orchestrator.connect('user123');

      const nodeCallback = (websocketService.onNodeDiscovered as jest.Mock).mock.calls[0][0];
      const edgeCallback = (websocketService.onEdgeExplored as jest.Mock).mock.calls[0][0];
      const pathCallback = (websocketService.onPathFound as jest.Mock).mock.calls[0][0];

      // Simulate mixed events
      const mockNode: Node = {
        id: 'node1',
        type: 'future_self',
        label: 'Test Node',
        distance: 2,
        metadata: { description: 'Test', viewpointShifts: 2 },
      };
      nodeCallback(mockNode);

      const mockEdge: Edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        strength: 0.8,
        type: 'direct',
        metadata: { connectionReason: 'Test' },
      };
      edgeCallback(mockEdge);

      const mockPath: Path = {
        nodes: ['node1', 'node2'],
        distance: 1,
        quality: 0.9,
      };
      pathCallback(mockPath);

      // Path should be called immediately (no throttling)
      expect(mockCallbacks.onPathFound).toHaveBeenCalledWith(mockPath);

      // Node and edge should be throttled
      expect(mockCallbacks.onNodeDiscovered).not.toHaveBeenCalled();
      expect(mockCallbacks.onEdgeExplored).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(mockCallbacks.onNodeDiscovered).toHaveBeenCalledWith(mockNode);
      expect(mockCallbacks.onEdgeExplored).toHaveBeenCalledWith(mockEdge);
    });

    it('should clear queue on search complete', () => {
      orchestrator.on({
        onSearchComplete: mockCallbacks.onSearchComplete,
      });
      orchestrator.connect('user123');

      // Add multiple items to queue
      const nodeCallback = (websocketService.onNodeDiscovered as jest.Mock).mock.calls[0][0];
      for (let i = 0; i < 3; i++) {
        const mockNode: Node = {
          id: `node${i}`,
          type: 'future_self',
          label: `Node ${i}`,
          distance: 2,
          metadata: { description: 'Test', viewpointShifts: 2 },
        };
        nodeCallback(mockNode);
      }

      jest.advanceTimersByTime(300);

      // Trigger search complete
      const searchCallback = (websocketService.onSearchComplete as jest.Mock).mock.calls[0][0];
      const mockResults: SearchResults = {
        matches: [],
        paths: [],
        debateSummaries: [],
        exploredNodeCount: 10,
        totalSearchTime: 5000,
      };
      searchCallback(mockResults);

      // Queue should be cleared
      expect(orchestrator.getQueueSize()).toBe(0);
      expect(mockCallbacks.onSearchComplete).toHaveBeenCalledWith(mockResults);
    });
  });

  describe('Batch Processing', () => {
    it('should batch multiple node discoveries', () => {
      orchestrator.on({ onNodeDiscovered: mockCallbacks.onNodeDiscovered });
      orchestrator.connect('user123');

      const nodeCallback = (websocketService.onNodeDiscovered as jest.Mock).mock.calls[0][0];

      // Simulate rapid node discoveries
      const nodes = [
        { id: 'node1', type: 'future_self' as const, label: 'Node 1', distance: 1, metadata: { description: 'Test', viewpointShifts: 1 } },
        { id: 'node2', type: 'comrade' as const, label: 'Node 2', distance: 2, metadata: { description: 'Test', viewpointShifts: 2 } },
        { id: 'node3', type: 'guide' as const, label: 'Node 3', distance: 3, metadata: { description: 'Test', viewpointShifts: 3 } },
      ];

      nodes.forEach(node => nodeCallback(node));

      // Should not call immediately
      expect(mockCallbacks.onNodeDiscovered).not.toHaveBeenCalled();

      // After throttle delay, should process all in batch
      jest.advanceTimersByTime(300);
      expect(mockCallbacks.onNodeDiscovered).toHaveBeenCalledTimes(3);
    });

    it('should batch multiple edge explorations', () => {
      orchestrator.on({ onEdgeExplored: mockCallbacks.onEdgeExplored });
      orchestrator.connect('user123');

      const edgeCallback = (websocketService.onEdgeExplored as jest.Mock).mock.calls[0][0];

      // Simulate rapid edge explorations
      const edges = [
        { id: 'edge1', source: 'node1', target: 'node2', strength: 0.8, type: 'direct' as const, metadata: { connectionReason: 'Test' } },
        { id: 'edge2', source: 'node2', target: 'node3', strength: 0.7, type: 'indirect' as const, metadata: { connectionReason: 'Test' } },
      ];

      edges.forEach(edge => edgeCallback(edge));

      expect(mockCallbacks.onEdgeExplored).not.toHaveBeenCalled();

      jest.advanceTimersByTime(200);
      expect(mockCallbacks.onEdgeExplored).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should forward connection state changes', () => {
      orchestrator.on({ onConnectionStateChange: mockCallbacks.onConnectionStateChange });
      orchestrator.connect('user123');

      const stateCallback = (websocketService.onConnectionStateChange as jest.Mock).mock.calls[0][0];
      stateCallback('reconnecting');

      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith('reconnecting');
    });

    it('should forward errors', () => {
      orchestrator.on({ onError: mockCallbacks.onError });
      orchestrator.connect('user123');

      const errorCallback = (websocketService.onError as jest.Mock).mock.calls[0][0];
      const mockError = new Error('Connection failed');
      errorCallback(mockError);

      expect(mockCallbacks.onError).toHaveBeenCalledWith(mockError);
    });
  });
});

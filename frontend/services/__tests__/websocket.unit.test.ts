/**
 * Unit tests for WebSocket service
 */

import { websocketService, ConnectionState } from '../websocket';
import { io, Socket } from 'socket.io-client';
import { Node, Edge, Path } from '@/types/graph';
import { DebateMessage } from '@/types/agent';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('WebSocketService', () => {
  let mockSocket: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Create mock socket
    mockSocket = {
      connected: false,
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      removeAllListeners: jest.fn(),
    };
    
    (io as jest.Mock).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.useRealTimers();
    websocketService.disconnect();
  });

  describe('connect', () => {
    it('should establish connection with correct configuration', () => {
      websocketService.connect('user123');

      expect(io).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          query: { userId: 'user123' },
          transports: ['websocket', 'polling'],
          reconnection: false,
          timeout: 10000,
        })
      );
    });

    it('should set connection state to connecting', () => {
      const stateCallback = jest.fn();
      websocketService.onConnectionStateChange(stateCallback);
      
      websocketService.connect('user123');
      
      expect(stateCallback).toHaveBeenCalledWith('connecting');
    });

    it('should not reconnect if already connected', () => {
      mockSocket.connected = true;
      websocketService.connect('user123');
      
      const callCount = (io as jest.Mock).mock.calls.length;
      websocketService.connect('user123');
      
      expect((io as jest.Mock).mock.calls.length).toBe(callCount);
    });
  });

  describe('disconnect', () => {
    it('should disconnect socket and clear callbacks', () => {
      websocketService.connect('user123');
      const callback = jest.fn();
      websocketService.onNodeDiscovered(callback);
      
      websocketService.disconnect();
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(websocketService.getConnectionState()).toBe('disconnected');
    });
  });

  describe('event listeners', () => {
    beforeEach(() => {
      websocketService.connect('user123');
    });

    it('should register node_discovered listener', () => {
      const callback = jest.fn();
      websocketService.onNodeDiscovered(callback);
      
      // Simulate socket event
      const nodeDiscoveredHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'node_discovered'
      )?.[1];
      
      const testNode: Node = {
        id: 'node1',
        type: 'future_self',
        label: 'Test Node',
        distance: 2,
        metadata: {
          description: 'Test description',
          viewpointShifts: 2,
        },
      };
      
      nodeDiscoveredHandler?.(testNode);
      expect(callback).toHaveBeenCalledWith(testNode);
    });

    it('should register edge_explored listener', () => {
      const callback = jest.fn();
      websocketService.onEdgeExplored(callback);
      
      const edgeExploredHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'edge_explored'
      )?.[1];
      
      const testEdge: Edge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        strength: 0.8,
        type: 'direct',
        metadata: {
          connectionReason: 'Test connection',
        },
      };
      
      edgeExploredHandler?.(testEdge);
      expect(callback).toHaveBeenCalledWith(testEdge);
    });

    it('should register path_found listener', () => {
      const callback = jest.fn();
      websocketService.onPathFound(callback);
      
      const pathFoundHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'path_found'
      )?.[1];
      
      const testPath: Path = {
        nodes: ['node1', 'node2', 'node3'],
        distance: 2,
        quality: 0.9,
      };
      
      pathFoundHandler?.(testPath);
      expect(callback).toHaveBeenCalledWith(testPath);
    });

    it('should register debate_update listener', () => {
      const callback = jest.fn();
      websocketService.onDebateUpdate(callback);
      
      const debateUpdateHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'debate_update'
      )?.[1];
      
      const testMessage: DebateMessage = {
        id: 'msg1',
        agentId: 'agent1',
        timestamp: Date.now(),
        content: 'Test message',
        type: 'opinion',
        sentiment: 'positive',
      };
      
      debateUpdateHandler?.(testMessage);
      expect(callback).toHaveBeenCalledWith(testMessage);
    });
  });

  describe('connection state management', () => {
    it('should transition from connecting to connected', () => {
      const stateCallback = jest.fn();
      websocketService.onConnectionStateChange(stateCallback);
      
      websocketService.connect('user123');
      
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )?.[1];
      connectHandler?.();
      
      expect(stateCallback).toHaveBeenCalledWith('connecting');
      expect(stateCallback).toHaveBeenCalledWith('connected');
    });

    it('should set state to error on connection error', () => {
      const stateCallback = jest.fn();
      websocketService.onConnectionStateChange(stateCallback);
      
      websocketService.connect('user123');
      
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect_error'
      )?.[1];
      errorHandler?.(new Error('Connection failed'));
      
      expect(stateCallback).toHaveBeenCalledWith('error');
    });
  });

  describe('reconnection logic', () => {
    it('should attempt reconnection with exponential backoff', () => {
      websocketService.connect('user123');
      
      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'disconnect'
      )?.[1];
      disconnectHandler?.('transport close');
      
      expect(websocketService.getConnectionState()).toBe('reconnecting');
      
      // Fast-forward first reconnection attempt (1 second)
      jest.advanceTimersByTime(1000);
      expect(io).toHaveBeenCalledTimes(2);
      
      // Simulate another disconnect
      disconnectHandler?.('transport close');
      
      // Fast-forward second reconnection attempt (2 seconds)
      jest.advanceTimersByTime(2000);
      expect(io).toHaveBeenCalledTimes(3);
    });

    it('should stop reconnecting after max attempts', () => {
      const errorCallback = jest.fn();
      websocketService.onError(errorCallback);
      
      websocketService.connect('user123');
      
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'disconnect'
      )?.[1];
      
      // Simulate 10 failed reconnection attempts
      for (let i = 0; i < 10; i++) {
        disconnectHandler?.('transport close');
        jest.runAllTimers();
      }
      
      // 11th attempt should not happen
      disconnectHandler?.('transport close');
      const callCountBefore = (io as jest.Mock).mock.calls.length;
      jest.runAllTimers();
      const callCountAfter = (io as jest.Mock).mock.calls.length;
      
      expect(callCountAfter).toBe(callCountBefore);
      expect(websocketService.getConnectionState()).toBe('error');
      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('maximum attempts'),
        })
      );
    });

    it('should reset reconnection attempts on successful connection', () => {
      websocketService.connect('user123');
      
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'disconnect'
      )?.[1];
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )?.[1];
      
      // Simulate disconnect and reconnect
      disconnectHandler?.('transport close');
      jest.runAllTimers();
      connectHandler?.();
      
      // Verify state is connected
      expect(websocketService.getConnectionState()).toBe('connected');
      
      // Simulate another disconnect - should start from attempt 1 again
      disconnectHandler?.('transport close');
      jest.advanceTimersByTime(1000); // Should use initial delay
      
      expect(io).toHaveBeenCalled();
    });

    it('should not reconnect on server-initiated disconnect', () => {
      websocketService.connect('user123');
      
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'disconnect'
      )?.[1];
      
      const callCountBefore = (io as jest.Mock).mock.calls.length;
      disconnectHandler?.('io server disconnect');
      jest.runAllTimers();
      const callCountAfter = (io as jest.Mock).mock.calls.length;
      
      expect(callCountAfter).toBe(callCountBefore);
      expect(websocketService.getConnectionState()).toBe('disconnected');
    });
  });

  describe('error handling', () => {
    it('should emit errors to registered callbacks', () => {
      const errorCallback = jest.fn();
      websocketService.onError(errorCallback);
      
      websocketService.connect('user123');
      
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'error'
      )?.[1];
      
      const testError = new Error('Test error');
      errorHandler?.(testError);
      
      expect(errorCallback).toHaveBeenCalledWith(testError);
    });

    it('should handle connection errors', () => {
      const errorCallback = jest.fn();
      websocketService.onError(errorCallback);
      
      websocketService.connect('user123');
      
      const connectErrorHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect_error'
      )?.[1];
      
      const testError = new Error('Connection failed');
      connectErrorHandler?.(testError);
      
      expect(errorCallback).toHaveBeenCalledWith(testError);
      // State transitions to 'error' then 'reconnecting' as reconnection is attempted
      expect(websocketService.getConnectionState()).toBe('reconnecting');
    });
  });

  describe('callback management', () => {
    it('should allow removing specific callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      websocketService.onNodeDiscovered(callback1);
      websocketService.onNodeDiscovered(callback2);
      
      websocketService.off('node_discovered', callback1);
      
      websocketService.connect('user123');
      const nodeDiscoveredHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'node_discovered'
      )?.[1];
      
      const testNode: Node = {
        id: 'node1',
        type: 'future_self',
        label: 'Test',
        distance: 1,
        metadata: { description: 'Test', viewpointShifts: 1 },
      };
      
      nodeDiscoveredHandler?.(testNode);
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith(testNode);
    });
  });

  describe('reconnection configuration', () => {
    it('should allow custom reconnection configuration', () => {
      websocketService.configureReconnection({
        initialDelay: 500,
        maxDelay: 10000,
        maxAttempts: 5,
      });
      
      websocketService.connect('user123');
      
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'disconnect'
      )?.[1];
      
      disconnectHandler?.('transport close');
      
      // Should use custom initial delay
      jest.advanceTimersByTime(500);
      expect(io).toHaveBeenCalledTimes(2);
    });
  });
});

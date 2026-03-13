/**
 * Integration tests for real-time GraphCanvas updates driven by mock WebSocket events.
 */

import { act, render, waitFor } from '@testing-library/react';
import GraphCanvas from '../GraphCanvas';
import { updateOrchestrator } from '@/services/updateOrchestrator';
import { websocketService } from '@/services/websocket';
import { Edge, Node } from '@/types/graph';

jest.mock('@/services/websocket', () => ({
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

function getRegisteredCallback(mockFn: jest.Mock) {
  const registeredCallback = mockFn.mock.calls[0]?.[0];
  if (!registeredCallback) {
    throw new Error('Expected a WebSocket callback to be registered');
  }

  return registeredCallback;
}

function getRenderedNodes() {
  return document.querySelectorAll('circle[data-graph-role="node"]');
}

function getRenderedEdges() {
  return document.querySelectorAll('line[data-graph-role="edge"]');
}

describe('GraphCanvas Real-time Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    updateOrchestrator.disconnect();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders nodes discovered from mock WebSocket data and settles their animation state', async () => {
    const initialNodes: Node[] = [
      {
        id: 'user-1',
        type: 'user',
        label: 'You',
        distance: 0,
        metadata: { description: 'User', viewpointShifts: 0 },
      },
    ];

    render(<GraphCanvas nodes={initialNodes} edges={[]} width={800} height={600} />);
    updateOrchestrator.connect('user-1');

    const onNodeDiscovered = getRegisteredCallback(
      websocketService.onNodeDiscovered as jest.Mock
    ) as (node: Node) => void;

    act(() => {
      onNodeDiscovered({
        id: 'node-1',
        type: 'comrade',
        label: 'Alice',
        distance: 1,
        metadata: { description: 'Alice', viewpointShifts: 1 },
      });
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getRenderedNodes()).toHaveLength(2);
    });

    expect(document.querySelector('circle[data-node-id="node-1"]')).toHaveAttribute('r', '0');

    act(() => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(document.querySelector('circle[data-node-id="node-1"]')).toHaveAttribute('r', '10');
    });
  });

  it('renders edges discovered from mock WebSocket data and settles their animation state', async () => {
    const initialNodes: Node[] = [
      {
        id: 'user-1',
        type: 'user',
        label: 'You',
        distance: 0,
        metadata: { description: 'User', viewpointShifts: 0 },
      },
      {
        id: 'node-1',
        type: 'comrade',
        label: 'Alice',
        distance: 1,
        metadata: { description: 'Alice', viewpointShifts: 1 },
      },
    ];

    render(<GraphCanvas nodes={initialNodes} edges={[]} width={800} height={600} />);
    updateOrchestrator.connect('user-1');

    const onEdgeExplored = getRegisteredCallback(
      websocketService.onEdgeExplored as jest.Mock
    ) as (edge: Edge) => void;

    act(() => {
      onEdgeExplored({
        id: 'edge-1',
        source: 'user-1',
        target: 'node-1',
        strength: 0.8,
        type: 'direct',
        metadata: { connectionReason: 'Known collaborator' },
      });
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(getRenderedEdges()).toHaveLength(1);
    });

    expect(document.querySelector('line[data-edge-id="edge-1"]')).toHaveAttribute(
      'stroke-opacity',
      '0'
    );

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(document.querySelector('line[data-edge-id="edge-1"]')).toHaveAttribute(
        'stroke-opacity',
        '0.55'
      );
    });
  });

  it('keeps edge rendering coordinated until referenced nodes arrive', async () => {
    const initialNodes: Node[] = [
      {
        id: 'user-1',
        type: 'user',
        label: 'You',
        distance: 0,
        metadata: { description: 'User', viewpointShifts: 0 },
      },
    ];

    render(<GraphCanvas nodes={initialNodes} edges={[]} width={800} height={600} />);
    updateOrchestrator.connect('user-1');

    const onNodeDiscovered = getRegisteredCallback(
      websocketService.onNodeDiscovered as jest.Mock
    ) as (node: Node) => void;
    const onEdgeExplored = getRegisteredCallback(
      websocketService.onEdgeExplored as jest.Mock
    ) as (edge: Edge) => void;

    act(() => {
      onEdgeExplored({
        id: 'edge-1',
        source: 'user-1',
        target: 'node-1',
        strength: 0.8,
        type: 'direct',
        metadata: { connectionReason: 'Warm intro' },
      });
      onNodeDiscovered({
        id: 'node-1',
        type: 'guide',
        label: 'Mentor',
        distance: 1,
        metadata: { description: 'Mentor', viewpointShifts: 2 },
      });
      jest.advanceTimersByTime(200);
    });

    expect(getRenderedEdges()).toHaveLength(0);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(getRenderedNodes()).toHaveLength(2);
      expect(getRenderedEdges()).toHaveLength(1);
    });
  });

  it('deduplicates repeated mock WebSocket updates during batched delivery', async () => {
    const initialNodes: Node[] = [
      {
        id: 'user-1',
        type: 'user',
        label: 'You',
        distance: 0,
        metadata: { description: 'User', viewpointShifts: 0 },
      },
    ];

    render(<GraphCanvas nodes={initialNodes} edges={[]} width={800} height={600} />);
    updateOrchestrator.connect('user-1');

    const onNodeDiscovered = getRegisteredCallback(
      websocketService.onNodeDiscovered as jest.Mock
    ) as (node: Node) => void;
    const onEdgeExplored = getRegisteredCallback(
      websocketService.onEdgeExplored as jest.Mock
    ) as (edge: Edge) => void;

    const repeatedNode: Node = {
      id: 'node-1',
      type: 'comrade',
      label: 'Alice',
      distance: 1,
      metadata: { description: 'Alice', viewpointShifts: 1 },
    };

    act(() => {
      onNodeDiscovered(repeatedNode);
      onNodeDiscovered(repeatedNode);
      onNodeDiscovered(repeatedNode);
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getRenderedNodes()).toHaveLength(2);
    });

    const repeatedEdge: Edge = {
      id: 'edge-1',
      source: 'user-1',
      target: 'node-1',
      strength: 0.8,
      type: 'direct',
      metadata: { connectionReason: 'Repeated event' },
    };

    act(() => {
      onEdgeExplored(repeatedEdge);
      onEdgeExplored(repeatedEdge);
      onEdgeExplored(repeatedEdge);
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(getRenderedEdges()).toHaveLength(1);
    });
  });
});

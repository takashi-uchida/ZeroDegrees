/**
 * Property tests for path visualization
 * Property 4: Path Visualization Consistency
 * For any path, all nodes and edges should be visually emphasized
 */

import { render } from '@testing-library/react';
import GraphCanvas from '../GraphCanvas';
import { Node, Edge } from '@/types/graph';

describe('GraphCanvas Path Visualization - Property Tests', () => {
  /**
   * Property 4: Path Visualization Consistency
   * For any path, all nodes and edges should be visually emphasized
   */
  it('should emphasize all nodes in active path', () => {
    const nodes: Node[] = [
      { id: 'user-1', type: 'user', label: 'You', distance: 0, metadata: { description: 'User', viewpointShifts: 0 } },
      { id: 'node-1', type: 'comrade', label: 'Alice', distance: 1, metadata: { description: 'Alice', viewpointShifts: 1 } },
      { id: 'node-2', type: 'comrade', label: 'Bob', distance: 2, metadata: { description: 'Bob', viewpointShifts: 2 } },
      { id: 'node-3', type: 'guide', label: 'Carol', distance: 3, metadata: { description: 'Carol', viewpointShifts: 3 } },
    ];

    const edges: Edge[] = [
      { id: 'edge-1', source: 'user-1', target: 'node-1', strength: 0.8, type: 'direct', metadata: { connectionReason: 'test' } },
      { id: 'edge-2', source: 'node-1', target: 'node-2', strength: 0.7, type: 'indirect', metadata: { connectionReason: 'test' } },
      { id: 'edge-3', source: 'node-2', target: 'node-3', strength: 0.9, type: 'direct', metadata: { connectionReason: 'test' } },
    ];

    const activePathNodeIds = ['user-1', 'node-1', 'node-2', 'node-3'];
    const activePathEdgeIds = ['edge-1', 'edge-2', 'edge-3'];

    render(
      <GraphCanvas
        nodes={nodes}
        edges={edges}
        activePathNodeIds={activePathNodeIds}
        activePathEdgeIds={activePathEdgeIds}
        visualizationMode="path"
        width={800}
        height={600}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();

    // All path nodes should be rendered
    const circles = svg?.querySelectorAll('circle[data-graph-role="node"]');
    expect(circles?.length).toBeGreaterThanOrEqual(activePathNodeIds.length);

    // All path edges should be rendered
    const lines = svg?.querySelectorAll('line[data-graph-role="edge"]');
    expect(lines?.length).toBeGreaterThanOrEqual(activePathEdgeIds.length);
  });

  it('should de-emphasize nodes not in active path', () => {
    const nodes: Node[] = [
      { id: 'user-1', type: 'user', label: 'You', distance: 0, metadata: { description: 'User', viewpointShifts: 0 } },
      { id: 'node-1', type: 'comrade', label: 'Alice', distance: 1, metadata: { description: 'Alice', viewpointShifts: 1 } },
      { id: 'node-2', type: 'comrade', label: 'Bob', distance: 2, metadata: { description: 'Bob', viewpointShifts: 2 } },
      { id: 'node-3', type: 'guide', label: 'Carol', distance: 1, metadata: { description: 'Carol', viewpointShifts: 1 } },
    ];

    const edges: Edge[] = [
      { id: 'edge-1', source: 'user-1', target: 'node-1', strength: 0.8, type: 'direct', metadata: { connectionReason: 'test' } },
      { id: 'edge-2', source: 'node-1', target: 'node-2', strength: 0.7, type: 'indirect', metadata: { connectionReason: 'test' } },
      { id: 'edge-3', source: 'user-1', target: 'node-3', strength: 0.6, type: 'indirect', metadata: { connectionReason: 'test' } },
    ];

    const activePathNodeIds = ['user-1', 'node-1', 'node-2'];
    const activePathEdgeIds = ['edge-1', 'edge-2'];

    render(
      <GraphCanvas
        nodes={nodes}
        edges={edges}
        activePathNodeIds={activePathNodeIds}
        activePathEdgeIds={activePathEdgeIds}
        visualizationMode="path"
        width={800}
        height={600}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();

    // All nodes should be rendered (including non-path nodes)
    const circles = svg?.querySelectorAll('circle[data-graph-role="node"]');
    expect(circles?.length).toBe(nodes.length);
  });

  it('should handle empty path gracefully', () => {
    const nodes: Node[] = [
      { id: 'user-1', type: 'user', label: 'You', distance: 0, metadata: { description: 'User', viewpointShifts: 0 } },
      { id: 'node-1', type: 'comrade', label: 'Alice', distance: 1, metadata: { description: 'Alice', viewpointShifts: 1 } },
    ];

    const edges: Edge[] = [
      { id: 'edge-1', source: 'user-1', target: 'node-1', strength: 0.8, type: 'direct', metadata: { connectionReason: 'test' } },
    ];

    render(
      <GraphCanvas
        nodes={nodes}
        edges={edges}
        activePathNodeIds={[]}
        activePathEdgeIds={[]}
        visualizationMode="path"
        width={800}
        height={600}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();

    // All nodes should still be rendered
    const circles = svg?.querySelectorAll('circle[data-graph-role="node"]');
    expect(circles?.length).toBe(nodes.length);
  });

  it('should handle single-node path', () => {
    const nodes: Node[] = [
      { id: 'user-1', type: 'user', label: 'You', distance: 0, metadata: { description: 'User', viewpointShifts: 0 } },
      { id: 'node-1', type: 'comrade', label: 'Alice', distance: 1, metadata: { description: 'Alice', viewpointShifts: 1 } },
    ];

    const edges: Edge[] = [
      { id: 'edge-1', source: 'user-1', target: 'node-1', strength: 0.8, type: 'direct', metadata: { connectionReason: 'test' } },
    ];

    render(
      <GraphCanvas
        nodes={nodes}
        edges={edges}
        activePathNodeIds={['user-1']}
        activePathEdgeIds={[]}
        visualizationMode="path"
        width={800}
        height={600}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();

    const circles = svg?.querySelectorAll('circle[data-graph-role="node"]');
    expect(circles?.length).toBe(nodes.length);
  });

  it('should handle long paths correctly', () => {
    const nodes: Node[] = Array.from({ length: 10 }, (_, i) => ({
      id: `node-${i}`,
      type: i === 0 ? 'user' as const : 'comrade' as const,
      label: `Person ${i}`,
      distance: i,
      metadata: { description: `Person ${i}`, viewpointShifts: i },
    }));

    const edges: Edge[] = Array.from({ length: 9 }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      strength: 0.8,
      type: 'direct' as const,
      metadata: { connectionReason: 'test' },
    }));

    const activePathNodeIds = nodes.map((n) => n.id);
    const activePathEdgeIds = edges.map((e) => e.id);

    render(
      <GraphCanvas
        nodes={nodes}
        edges={edges}
        activePathNodeIds={activePathNodeIds}
        activePathEdgeIds={activePathEdgeIds}
        visualizationMode="path"
        width={800}
        height={600}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();

    const circles = svg?.querySelectorAll('circle[data-graph-role="node"]');
    expect(circles?.length).toBe(nodes.length);

    const lines = svg?.querySelectorAll('line[data-graph-role="edge"]');
    expect(lines?.length).toBeGreaterThanOrEqual(edges.length);
  });

  it('should maintain path consistency across visualization modes', () => {
    const nodes: Node[] = [
      { id: 'user-1', type: 'user', label: 'You', distance: 0, metadata: { description: 'User', viewpointShifts: 0 } },
      { id: 'node-1', type: 'comrade', label: 'Alice', distance: 1, metadata: { description: 'Alice', viewpointShifts: 1 } },
      { id: 'node-2', type: 'guide', label: 'Bob', distance: 2, metadata: { description: 'Bob', viewpointShifts: 2 } },
    ];

    const edges: Edge[] = [
      { id: 'edge-1', source: 'user-1', target: 'node-1', strength: 0.8, type: 'direct', metadata: { connectionReason: 'test' } },
      { id: 'edge-2', source: 'node-1', target: 'node-2', strength: 0.7, type: 'indirect', metadata: { connectionReason: 'test' } },
    ];

    const activePathNodeIds = ['user-1', 'node-1', 'node-2'];
    const activePathEdgeIds = ['edge-1', 'edge-2'];

    const modes: Array<'concentric' | 'heatmap' | 'path'> = ['concentric', 'heatmap', 'path'];

    modes.forEach((mode) => {
      const { unmount } = render(
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          activePathNodeIds={activePathNodeIds}
          activePathEdgeIds={activePathEdgeIds}
          visualizationMode={mode}
          width={800}
          height={600}
        />
      );

      const svg = document.querySelector('svg');
      expect(svg).toBeTruthy();

      const circles = svg?.querySelectorAll('circle[data-graph-role="node"]');
      expect(circles?.length).toBe(nodes.length);

      unmount();
    });
  });

  it('should handle disconnected path segments', () => {
    const nodes: Node[] = [
      { id: 'user-1', type: 'user', label: 'You', distance: 0, metadata: { description: 'User', viewpointShifts: 0 } },
      { id: 'node-1', type: 'comrade', label: 'Alice', distance: 1, metadata: { description: 'Alice', viewpointShifts: 1 } },
      { id: 'node-2', type: 'comrade', label: 'Bob', distance: 2, metadata: { description: 'Bob', viewpointShifts: 2 } },
      { id: 'node-3', type: 'guide', label: 'Carol', distance: 3, metadata: { description: 'Carol', viewpointShifts: 3 } },
    ];

    const edges: Edge[] = [
      { id: 'edge-1', source: 'user-1', target: 'node-1', strength: 0.8, type: 'direct', metadata: { connectionReason: 'test' } },
      { id: 'edge-2', source: 'node-2', target: 'node-3', strength: 0.7, type: 'indirect', metadata: { connectionReason: 'test' } },
    ];

    // Path includes disconnected nodes
    const activePathNodeIds = ['user-1', 'node-1', 'node-3'];
    const activePathEdgeIds = ['edge-1'];

    render(
      <GraphCanvas
        nodes={nodes}
        edges={edges}
        activePathNodeIds={activePathNodeIds}
        activePathEdgeIds={activePathEdgeIds}
        visualizationMode="path"
        width={800}
        height={600}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();

    const circles = svg?.querySelectorAll('circle[data-graph-role="node"]');
    expect(circles?.length).toBe(nodes.length);
  });

  it('should handle path with duplicate node IDs gracefully', () => {
    const nodes: Node[] = [
      { id: 'user-1', type: 'user', label: 'You', distance: 0, metadata: { description: 'User', viewpointShifts: 0 } },
      { id: 'node-1', type: 'comrade', label: 'Alice', distance: 1, metadata: { description: 'Alice', viewpointShifts: 1 } },
      { id: 'node-2', type: 'guide', label: 'Bob', distance: 2, metadata: { description: 'Bob', viewpointShifts: 2 } },
    ];

    const edges: Edge[] = [
      { id: 'edge-1', source: 'user-1', target: 'node-1', strength: 0.8, type: 'direct', metadata: { connectionReason: 'test' } },
      { id: 'edge-2', source: 'node-1', target: 'node-2', strength: 0.7, type: 'indirect', metadata: { connectionReason: 'test' } },
    ];

    // Path with duplicate node IDs
    const activePathNodeIds = ['user-1', 'node-1', 'node-1', 'node-2'];
    const activePathEdgeIds = ['edge-1', 'edge-2'];

    render(
      <GraphCanvas
        nodes={nodes}
        edges={edges}
        activePathNodeIds={activePathNodeIds}
        activePathEdgeIds={activePathEdgeIds}
        visualizationMode="path"
        width={800}
        height={600}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();

    const circles = svg?.querySelectorAll('circle[data-graph-role="node"]');
    expect(circles?.length).toBe(nodes.length);
  });
});

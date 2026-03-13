/**
 * Unit tests for GraphManager graph algorithms
 * 
 * Tests shortest path calculation with various graph structures
 * and edge cases including disconnected graphs, single node, and cycles.
 * 
 * Validates: Requirements 1.3, 2.1
 */

import { GraphManager } from '../graphManager';
import { Node, Edge } from '@/types/graph';

describe('GraphManager Unit Tests', () => {
  // Helper function to create a test node
  const createNode = (id: string, type: Node['type'] = 'user'): Node => ({
    id,
    type,
    label: `Node ${id}`,
    distance: 0,
    metadata: {
      description: `Description for ${id}`,
      viewpointShifts: 0,
    },
  });

  // Helper function to create a test edge
  const createEdge = (
    id: string,
    source: string,
    target: string,
    strength: number = 1.0
  ): Edge => ({
    id,
    source,
    target,
    strength,
    type: 'direct',
    metadata: {
      connectionReason: 'Test connection',
    },
  });

  describe('Shortest Path Calculation', () => {
    test('should find shortest path in a simple linear graph', () => {
      // A -> B -> C
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'C'));

      const path = manager.findShortestPath('A', 'C');
      expect(path).toEqual(['A', 'B', 'C']);
    });

    test('should find shortest path when multiple paths exist', () => {
      // A -> B -> D
      // A -> C -> D
      // Shortest: A -> B -> D (if equal strength)
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addNode(createNode('D'));
      manager.addEdge(createEdge('e1', 'A', 'B', 1.0));
      manager.addEdge(createEdge('e2', 'B', 'D', 1.0));
      manager.addEdge(createEdge('e3', 'A', 'C', 1.0));
      manager.addEdge(createEdge('e4', 'C', 'D', 1.0));

      const path = manager.findShortestPath('A', 'D');
      expect(path.length).toBe(3);
      expect(path[0]).toBe('A');
      expect(path[2]).toBe('D');
    });

    test('should prefer stronger connections (lower cost)', () => {
      // A -> B (strength 0.5) -> D
      // A -> C (strength 1.0) -> D
      // Should prefer A -> C -> D due to higher strength
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addNode(createNode('D'));
      manager.addEdge(createEdge('e1', 'A', 'B', 0.5));
      manager.addEdge(createEdge('e2', 'B', 'D', 0.5));
      manager.addEdge(createEdge('e3', 'A', 'C', 1.0));
      manager.addEdge(createEdge('e4', 'C', 'D', 1.0));

      const path = manager.findShortestPath('A', 'D');
      expect(path).toEqual(['A', 'C', 'D']);
    });

    test('should handle complex graph with multiple paths', () => {
      // A -> B -> C -> E
      //  \-> D ----/
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addNode(createNode('D'));
      manager.addNode(createNode('E'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'C'));
      manager.addEdge(createEdge('e3', 'C', 'E'));
      manager.addEdge(createEdge('e4', 'A', 'D'));
      manager.addEdge(createEdge('e5', 'D', 'E'));

      const path = manager.findShortestPath('A', 'E');
      expect(path.length).toBe(3);
      expect(path[0]).toBe('A');
      expect(path[2]).toBe('E');
    });

    test('should find path in a fully connected graph', () => {
      // Complete graph with 4 nodes
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addNode(createNode('D'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'A', 'C'));
      manager.addEdge(createEdge('e3', 'A', 'D'));
      manager.addEdge(createEdge('e4', 'B', 'C'));
      manager.addEdge(createEdge('e5', 'B', 'D'));
      manager.addEdge(createEdge('e6', 'C', 'D'));

      const path = manager.findShortestPath('A', 'D');
      expect(path).toEqual(['A', 'D']);
    });
  });

  describe('Edge Cases: Disconnected Graphs', () => {
    test('should return empty array for disconnected nodes', () => {
      // A    B (no connection)
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));

      const path = manager.findShortestPath('A', 'B');
      expect(path).toEqual([]);
    });

    test('should return empty array when target is in disconnected component', () => {
      // A -> B    C -> D (two separate components)
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addNode(createNode('D'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'C', 'D'));

      const path = manager.findShortestPath('A', 'D');
      expect(path).toEqual([]);
    });

    test('should calculate distance as -1 for disconnected nodes', () => {
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));

      const distance = manager.calculateDistance('A', 'B');
      expect(distance).toBe(-1);
    });
  });

  describe('Edge Cases: Single Node', () => {
    test('should return path with single node when source equals target', () => {
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));

      const path = manager.findShortestPath('A', 'A');
      expect(path).toEqual(['A']);
    });

    test('should calculate distance as 0 when source equals target', () => {
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));

      const distance = manager.calculateDistance('A', 'A');
      expect(distance).toBe(0);
    });

    test('should handle graph with only one node', () => {
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));

      expect(manager.getAllNodes()).toHaveLength(1);
      expect(manager.getNeighbors('A')).toEqual([]);
      expect(manager.findShortestPath('A', 'A')).toEqual(['A']);
    });
  });

  describe('Edge Cases: Cycles', () => {
    test('should handle simple cycle correctly', () => {
      // A -> B -> C -> A (cycle)
      // Since edges are bidirectional, shortest path from A to C is direct
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'C'));
      manager.addEdge(createEdge('e3', 'C', 'A'));

      const path = manager.findShortestPath('A', 'C');
      // Should take the direct edge A-C (length 2)
      expect(path).toEqual(['A', 'C']);
      expect(path.length).toBe(2);
    });

    test('should find shortest path in graph with multiple cycles', () => {
      // A -> B -> C -> D
      //  \-> E -> F -/
      //  \---------/
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addNode(createNode('D'));
      manager.addNode(createNode('E'));
      manager.addNode(createNode('F'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'C'));
      manager.addEdge(createEdge('e3', 'C', 'D'));
      manager.addEdge(createEdge('e4', 'A', 'E'));
      manager.addEdge(createEdge('e5', 'E', 'F'));
      manager.addEdge(createEdge('e6', 'F', 'D'));
      manager.addEdge(createEdge('e7', 'A', 'D')); // Direct path

      const path = manager.findShortestPath('A', 'D');
      expect(path).toEqual(['A', 'D']);
    });

    test('should handle self-loop edges', () => {
      // A -> B, B -> B (self-loop)
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'B')); // Self-loop

      const path = manager.findShortestPath('A', 'B');
      expect(path).toEqual(['A', 'B']);
    });

    test('should not get stuck in cycles during path finding', () => {
      // Triangle: A -> B -> C -> A
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'C'));
      manager.addEdge(createEdge('e3', 'C', 'A'));

      // Should find direct path without infinite loop
      const path = manager.findShortestPath('A', 'B');
      expect(path).toEqual(['A', 'B']);
    });
  });

  describe('Distance Calculation', () => {
    test('should calculate correct distance for connected nodes', () => {
      // A -> B -> C -> D
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addNode(createNode('D'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'C'));
      manager.addEdge(createEdge('e3', 'C', 'D'));

      expect(manager.calculateDistance('A', 'B')).toBe(1);
      expect(manager.calculateDistance('A', 'C')).toBe(2);
      expect(manager.calculateDistance('A', 'D')).toBe(3);
    });

    test('should return 0 for same node distance', () => {
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));

      expect(manager.calculateDistance('A', 'A')).toBe(0);
    });

    test('should return -1 for disconnected nodes', () => {
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));

      expect(manager.calculateDistance('A', 'B')).toBe(-1);
    });
  });

  describe('Neighbor Retrieval', () => {
    test('should return all neighbors of a node', () => {
      // A connected to B, C, D
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addNode(createNode('D'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'A', 'C'));
      manager.addEdge(createEdge('e3', 'A', 'D'));

      const neighbors = manager.getNeighbors('A');
      expect(neighbors).toHaveLength(3);
      expect(neighbors.map(n => n.id).sort()).toEqual(['B', 'C', 'D']);
    });

    test('should return empty array for node with no neighbors', () => {
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));

      const neighbors = manager.getNeighbors('A');
      expect(neighbors).toEqual([]);
    });

    test('should return empty array for non-existent node', () => {
      const manager = new GraphManager('A');
      
      const neighbors = manager.getNeighbors('NonExistent');
      expect(neighbors).toEqual([]);
    });
  });

  describe('Subgraph Extraction', () => {
    test('should extract subgraph within radius', () => {
      // A -> B -> C -> D -> E
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addNode(createNode('D'));
      manager.addNode(createNode('E'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'C'));
      manager.addEdge(createEdge('e3', 'C', 'D'));
      manager.addEdge(createEdge('e4', 'D', 'E'));

      const subgraph = manager.getSubgraph('A', 2);
      
      // Should include A, B, C (within radius 2)
      expect(subgraph.nodes.size).toBe(3);
      expect(subgraph.nodes.has('A')).toBe(true);
      expect(subgraph.nodes.has('B')).toBe(true);
      expect(subgraph.nodes.has('C')).toBe(true);
      expect(subgraph.nodes.has('D')).toBe(false);
      expect(subgraph.nodes.has('E')).toBe(false);
    });

    test('should include only edges between nodes in subgraph', () => {
      // A -> B -> C
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'C'));

      const subgraph = manager.getSubgraph('A', 1);
      
      // Should include A, B but not C
      expect(subgraph.nodes.size).toBe(2);
      // Should include only edge A-B
      expect(subgraph.edges.size).toBe(1);
      expect(subgraph.edges.has('e1')).toBe(true);
      expect(subgraph.edges.has('e2')).toBe(false);
    });

    test('should handle radius 0 (only center node)', () => {
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addEdge(createEdge('e1', 'A', 'B'));

      const subgraph = manager.getSubgraph('A', 0);
      
      expect(subgraph.nodes.size).toBe(1);
      expect(subgraph.nodes.has('A')).toBe(true);
      expect(subgraph.edges.size).toBe(0);
    });
  });

  describe('Edge Cases: Empty and Invalid Inputs', () => {
    test('should handle empty graph', () => {
      const manager = new GraphManager('A');

      expect(manager.getAllNodes()).toEqual([]);
      expect(manager.getAllEdges()).toEqual([]);
      expect(manager.findShortestPath('A', 'B')).toEqual([]);
    });

    test('should handle non-existent source node', () => {
      const manager = new GraphManager('A');
      manager.addNode(createNode('B'));

      const path = manager.findShortestPath('NonExistent', 'B');
      expect(path).toEqual([]);
    });

    test('should handle non-existent target node', () => {
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));

      const path = manager.findShortestPath('A', 'NonExistent');
      expect(path).toEqual([]);
    });

    test('should handle edges with very low strength', () => {
      // Test that algorithm doesn't divide by zero
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addEdge(createEdge('e1', 'A', 'B', 0.001));

      const path = manager.findShortestPath('A', 'B');
      expect(path).toEqual(['A', 'B']);
    });
  });

  describe('Graph Modifications', () => {
    test('should update paths after adding new edge', () => {
      // Initially: A -> B -> C
      // Add: A -> C (shortcut)
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'C'));

      let path = manager.findShortestPath('A', 'C');
      expect(path).toEqual(['A', 'B', 'C']);

      // Add shortcut
      manager.addEdge(createEdge('e3', 'A', 'C'));
      path = manager.findShortestPath('A', 'C');
      expect(path).toEqual(['A', 'C']);
    });

    test('should update paths after removing edge', () => {
      // A -> B -> C
      // A -> C
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'C'));
      manager.addEdge(createEdge('e3', 'A', 'C'));

      let path = manager.findShortestPath('A', 'C');
      expect(path).toEqual(['A', 'C']);

      // Remove shortcut
      manager.removeEdge('e3');
      path = manager.findShortestPath('A', 'C');
      expect(path).toEqual(['A', 'B', 'C']);
    });

    test('should handle path finding after node removal', () => {
      // A -> B -> C -> D
      // Remove B
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addNode(createNode('D'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'C'));
      manager.addEdge(createEdge('e3', 'C', 'D'));

      manager.removeNode('B');

      const path = manager.findShortestPath('A', 'D');
      expect(path).toEqual([]); // No path after removing B
    });
  });

  describe('Bidirectional Edges', () => {
    test('should handle bidirectional traversal', () => {
      // A <-> B <-> C
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'B', 'C'));

      // Forward path
      const forwardPath = manager.findShortestPath('A', 'C');
      expect(forwardPath).toEqual(['A', 'B', 'C']);

      // Reverse path
      const reversePath = manager.findShortestPath('C', 'A');
      expect(reversePath).toEqual(['C', 'B', 'A']);
    });
  });

  describe('Large Graph Structures', () => {
    test('should handle graph with many nodes', () => {
      // Create a chain of 50 nodes
      const manager = new GraphManager('node-0');
      
      for (let i = 0; i < 50; i++) {
        manager.addNode(createNode(`node-${i}`));
      }
      
      for (let i = 0; i < 49; i++) {
        manager.addEdge(createEdge(`edge-${i}`, `node-${i}`, `node-${i + 1}`));
      }

      const path = manager.findShortestPath('node-0', 'node-49');
      expect(path.length).toBe(50);
      expect(path[0]).toBe('node-0');
      expect(path[49]).toBe('node-49');
    });

    test('should handle dense graph efficiently', () => {
      // Create a graph with 10 nodes, each connected to 5 others
      const manager = new GraphManager('node-0');
      
      for (let i = 0; i < 10; i++) {
        manager.addNode(createNode(`node-${i}`));
      }
      
      let edgeCount = 0;
      for (let i = 0; i < 10; i++) {
        for (let j = i + 1; j < Math.min(i + 6, 10); j++) {
          manager.addEdge(createEdge(`edge-${edgeCount++}`, `node-${i}`, `node-${j}`));
        }
      }

      const path = manager.findShortestPath('node-0', 'node-9');
      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toBe('node-0');
      expect(path[path.length - 1]).toBe('node-9');
    });
  });

  describe('Special Graph Topologies', () => {
    test('should handle star topology', () => {
      // Center node connected to all others
      //   B
      //   |
      // C-A-D
      //   |
      //   E
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addNode(createNode('D'));
      manager.addNode(createNode('E'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'A', 'C'));
      manager.addEdge(createEdge('e3', 'A', 'D'));
      manager.addEdge(createEdge('e4', 'A', 'E'));

      // All paths from A should be length 2
      expect(manager.findShortestPath('A', 'B')).toEqual(['A', 'B']);
      expect(manager.findShortestPath('A', 'E')).toEqual(['A', 'E']);
      
      // Paths between non-center nodes should go through A
      const path = manager.findShortestPath('B', 'E');
      expect(path).toEqual(['B', 'A', 'E']);
    });

    test('should handle tree structure', () => {
      //       A
      //      / \
      //     B   C
      //    / \
      //   D   E
      const manager = new GraphManager('A');
      manager.addNode(createNode('A'));
      manager.addNode(createNode('B'));
      manager.addNode(createNode('C'));
      manager.addNode(createNode('D'));
      manager.addNode(createNode('E'));
      manager.addEdge(createEdge('e1', 'A', 'B'));
      manager.addEdge(createEdge('e2', 'A', 'C'));
      manager.addEdge(createEdge('e3', 'B', 'D'));
      manager.addEdge(createEdge('e4', 'B', 'E'));

      expect(manager.findShortestPath('A', 'D')).toEqual(['A', 'B', 'D']);
      expect(manager.findShortestPath('D', 'E')).toEqual(['D', 'B', 'E']);
      expect(manager.findShortestPath('D', 'C')).toEqual(['D', 'B', 'A', 'C']);
    });
  });
});

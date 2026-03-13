/**
 * Property-based tests for GraphManager
 * 
 * **Validates: Requirements 2.1, 2.3**
 */

import * as fc from 'fast-check';
import { GraphManager } from '../graphManager';
import { Node, Edge, NodeType, EdgeType } from '@/types/graph';

// Arbitraries (generators) for property-based testing

const nodeTypeArbitrary = fc.constantFrom<NodeType>(
  'user',
  'future_self',
  'comrade',
  'guide'
);

const edgeTypeArbitrary = fc.constantFrom<EdgeType>(
  'direct',
  'indirect',
  'potential'
);

const nodeArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  type: nodeTypeArbitrary,
  label: fc.string({ minLength: 1, maxLength: 50 }),
  distance: fc.nat(10),
  metadata: fc.record({
    avatar: fc.option(fc.webUrl(), { nil: undefined }),
    description: fc.string({ maxLength: 200 }),
    viewpointShifts: fc.nat(10),
  }),
  position: fc.option(
    fc.record({
      x: fc.double({ min: -1000, max: 1000 }),
      y: fc.double({ min: -1000, max: 1000 }),
    }),
    { nil: undefined }
  ),
}) as fc.Arbitrary<Node>;

const edgeArbitrary = (nodeIds: string[]) => {
  if (nodeIds.length < 2) {
    // If we don't have at least 2 nodes, return a dummy edge that won't be used
    return fc.constant({
      id: 'dummy',
      source: 'dummy',
      target: 'dummy',
      strength: 0.5,
      type: 'direct' as EdgeType,
      metadata: {
        connectionReason: 'dummy',
      },
    });
  }
  
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
    source: fc.constantFrom(...nodeIds),
    target: fc.constantFrom(...nodeIds),
    strength: fc.double({ min: 0.01, max: 1.0 }),
    type: edgeTypeArbitrary,
    metadata: fc.record({
      connectionReason: fc.string({ maxLength: 100 }),
      intermediaries: fc.option(fc.array(fc.string(), { maxLength: 5 }), { nil: undefined }),
    }),
  }).filter(edge => edge.source !== edge.target) as fc.Arbitrary<Edge>;
};

describe('GraphManager Property Tests', () => {
  describe('Property 2: Graph Structure Integrity', () => {
    /**
     * **Property 2: Graph Structure Integrity**
     * For any set of nodes and edges, graph structure should accurately represent data
     * **Validates: Requirements 2.1, 2.3**
     */
    
    test('Property 2.1: All added nodes should be retrievable', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(nodeArbitrary, { minLength: 0, maxLength: 50 }),
          (userNodeId, nodes) => {
            const manager = new GraphManager(userNodeId);
            
            // Add all nodes
            nodes.forEach(node => manager.addNode(node));
            
            // Verify all nodes are retrievable
            nodes.forEach(node => {
              const retrieved = manager.getNode(node.id);
              expect(retrieved).toBeDefined();
              expect(retrieved?.id).toBe(node.id);
              expect(retrieved?.type).toBe(node.type);
              expect(retrieved?.label).toBe(node.label);
            });
            
            // Verify node count matches
            const allNodes = manager.getAllNodes();
            expect(allNodes.length).toBe(nodes.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 2.2: All added edges should be retrievable and maintain source-target relationships', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(nodeArbitrary, { minLength: 2, maxLength: 20 }),
          (userNodeId, nodes) => {
            const manager = new GraphManager(userNodeId);
            
            // Add all nodes
            nodes.forEach(node => manager.addNode(node));
            
            const nodeIds = nodes.map(n => n.id);
            
            // Generate and add edges
            return fc.assert(
              fc.property(
                fc.array(edgeArbitrary(nodeIds), { minLength: 0, maxLength: 30 }),
                (edges) => {
                  edges.forEach(edge => manager.addEdge(edge));
                  
                  // Verify all edges are retrievable
                  edges.forEach(edge => {
                    const retrieved = manager.getEdge(edge.id);
                    expect(retrieved).toBeDefined();
                    expect(retrieved?.source).toBe(edge.source);
                    expect(retrieved?.target).toBe(edge.target);
                    expect(retrieved?.strength).toBe(edge.strength);
                  });
                  
                  // Verify edge count matches
                  const allEdges = manager.getAllEdges();
                  expect(allEdges.length).toBe(edges.length);
                }
              ),
              { numRuns: 10 }
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    test('Property 2.3: Adjacency list should accurately reflect edge connections', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(nodeArbitrary, { minLength: 2, maxLength: 15 }),
          (userNodeId, nodes) => {
            const manager = new GraphManager(userNodeId);
            
            // Add all nodes
            nodes.forEach(node => manager.addNode(node));
            
            const nodeIds = nodes.map(n => n.id);
            
            return fc.assert(
              fc.property(
                fc.array(edgeArbitrary(nodeIds), { minLength: 1, maxLength: 20 }),
                (edges) => {
                  edges.forEach(edge => manager.addEdge(edge));
                  
                  // For each edge, verify adjacency list contains the connection
                  edges.forEach(edge => {
                    const sourceNeighbors = manager.getNeighbors(edge.source);
                    const targetNeighbors = manager.getNeighbors(edge.target);
                    
                    // Source should have target as neighbor
                    const sourceHasTarget = sourceNeighbors.some(n => n.id === edge.target);
                    expect(sourceHasTarget).toBe(true);
                    
                    // Target should have source as neighbor (undirected graph)
                    const targetHasSource = targetNeighbors.some(n => n.id === edge.source);
                    expect(targetHasSource).toBe(true);
                  });
                }
              ),
              { numRuns: 10 }
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    test('Property 2.4: Node removal should remove all associated edges', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(nodeArbitrary, { minLength: 3, maxLength: 15 }),
          (userNodeId, nodes) => {
            const manager = new GraphManager(userNodeId);
            
            // Add all nodes
            nodes.forEach(node => manager.addNode(node));
            
            const nodeIds = nodes.map(n => n.id);
            
            return fc.assert(
              fc.property(
                fc.array(edgeArbitrary(nodeIds), { minLength: 1, maxLength: 20 }),
                fc.integer({ min: 0, max: nodes.length - 1 }),
                (edges, nodeIndexToRemove) => {
                  edges.forEach(edge => manager.addEdge(edge));
                  
                  const nodeToRemove = nodes[nodeIndexToRemove];
                  const edgesBeforeRemoval = manager.getAllEdges().length;
                  
                  // Count edges connected to this node
                  const connectedEdges = edges.filter(
                    e => e.source === nodeToRemove.id || e.target === nodeToRemove.id
                  );
                  
                  // Remove the node
                  manager.removeNode(nodeToRemove.id);
                  
                  // Verify node is removed
                  expect(manager.getNode(nodeToRemove.id)).toBeUndefined();
                  
                  // Verify edges connected to this node are removed
                  const edgesAfterRemoval = manager.getAllEdges().length;
                  expect(edgesAfterRemoval).toBe(edgesBeforeRemoval - connectedEdges.length);
                  
                  // Verify no edges reference the removed node
                  const remainingEdges = manager.getAllEdges();
                  remainingEdges.forEach(edge => {
                    expect(edge.source).not.toBe(nodeToRemove.id);
                    expect(edge.target).not.toBe(nodeToRemove.id);
                  });
                  
                  // Verify adjacency list doesn't contain the removed node
                  const allNodes = manager.getAllNodes();
                  allNodes.forEach(node => {
                    const neighbors = manager.getNeighbors(node.id);
                    neighbors.forEach(neighbor => {
                      expect(neighbor.id).not.toBe(nodeToRemove.id);
                    });
                  });
                }
              ),
              { numRuns: 10 }
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    test('Property 2.5: Edge removal should update adjacency list correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(nodeArbitrary, { minLength: 2, maxLength: 15 }),
          (userNodeId, nodes) => {
            const manager = new GraphManager(userNodeId);
            
            // Add all nodes
            nodes.forEach(node => manager.addNode(node));
            
            const nodeIds = nodes.map(n => n.id);
            
            return fc.assert(
              fc.property(
                fc.array(edgeArbitrary(nodeIds), { minLength: 1, maxLength: 20 }),
                fc.integer({ min: 0, max: 19 }),
                (edges, edgeIndexToRemove) => {
                  edges.forEach(edge => manager.addEdge(edge));
                  
                  if (edgeIndexToRemove >= edges.length) return;
                  
                  const edgeToRemove = edges[edgeIndexToRemove];
                  const edgesBeforeRemoval = manager.getAllEdges().length;
                  
                  // Remove the edge
                  manager.removeEdge(edgeToRemove.id);
                  
                  // Verify edge is removed
                  expect(manager.getEdge(edgeToRemove.id)).toBeUndefined();
                  
                  // Verify edge count decreased by 1
                  const edgesAfterRemoval = manager.getAllEdges().length;
                  expect(edgesAfterRemoval).toBe(edgesBeforeRemoval - 1);
                  
                  // Verify adjacency list is updated
                  const sourceNeighbors = manager.getNeighbors(edgeToRemove.source);
                  const targetNeighbors = manager.getNeighbors(edgeToRemove.target);
                  
                  // Check if there are other edges between source and target
                  const otherEdgesBetween = edges.filter(
                    (e, idx) => 
                      idx !== edgeIndexToRemove &&
                      ((e.source === edgeToRemove.source && e.target === edgeToRemove.target) ||
                       (e.source === edgeToRemove.target && e.target === edgeToRemove.source))
                  );
                  
                  if (otherEdgesBetween.length === 0) {
                    // If no other edges exist, nodes should not be neighbors
                    const sourceHasTarget = sourceNeighbors.some(n => n.id === edgeToRemove.target);
                    const targetHasSource = targetNeighbors.some(n => n.id === edgeToRemove.source);
                    
                    expect(sourceHasTarget).toBe(false);
                    expect(targetHasSource).toBe(false);
                  }
                }
              ),
              { numRuns: 10 }
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    test('Property 2.6: Graph data structure should remain consistent after multiple operations', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(nodeArbitrary, { minLength: 5, maxLength: 20 }),
          (userNodeId, nodes) => {
            const manager = new GraphManager(userNodeId);
            
            // Add all nodes
            nodes.forEach(node => manager.addNode(node));
            
            const nodeIds = nodes.map(n => n.id);
            
            return fc.assert(
              fc.property(
                fc.array(edgeArbitrary(nodeIds), { minLength: 3, maxLength: 25 }),
                (edges) => {
                  // Add edges
                  edges.forEach(edge => manager.addEdge(edge));
                  
                  // Perform various operations
                  const initialNodeCount = manager.getAllNodes().length;
                  const initialEdgeCount = manager.getAllEdges().length;
                  
                  // Remove and re-add a node
                  if (nodes.length > 2) {
                    const nodeToToggle = nodes[1];
                    manager.removeNode(nodeToToggle.id);
                    manager.addNode(nodeToToggle);
                  }
                  
                  // Remove and re-add an edge
                  if (edges.length > 0) {
                    const edgeToToggle = edges[0];
                    manager.removeEdge(edgeToToggle.id);
                    manager.addEdge(edgeToToggle);
                  }
                  
                  // Verify consistency: all nodes in edges exist in node map
                  const allEdges = manager.getAllEdges();
                  allEdges.forEach(edge => {
                    expect(manager.getNode(edge.source)).toBeDefined();
                    expect(manager.getNode(edge.target)).toBeDefined();
                  });
                  
                  // Verify consistency: all neighbors in adjacency list exist as nodes
                  const allNodes = manager.getAllNodes();
                  allNodes.forEach(node => {
                    const neighbors = manager.getNeighbors(node.id);
                    neighbors.forEach(neighbor => {
                      expect(manager.getNode(neighbor.id)).toBeDefined();
                    });
                  });
                  
                  // Verify consistency: for each edge, both nodes should list each other as neighbors
                  allEdges.forEach(edge => {
                    const sourceNeighbors = manager.getNeighbors(edge.source);
                    const targetNeighbors = manager.getNeighbors(edge.target);
                    
                    const sourceHasTarget = sourceNeighbors.some(n => n.id === edge.target);
                    const targetHasSource = targetNeighbors.some(n => n.id === edge.source);
                    
                    expect(sourceHasTarget).toBe(true);
                    expect(targetHasSource).toBe(true);
                  });
                }
              ),
              { numRuns: 10 }
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    test('Property 2.7: Subgraph should contain only nodes within specified radius', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(nodeArbitrary, { minLength: 5, maxLength: 15 }),
          fc.integer({ min: 1, max: 3 }),
          (userNodeId, nodes, radius) => {
            const manager = new GraphManager(userNodeId);
            
            // Add all nodes
            nodes.forEach(node => manager.addNode(node));
            
            const nodeIds = nodes.map(n => n.id);
            
            return fc.assert(
              fc.property(
                fc.array(edgeArbitrary(nodeIds), { minLength: 4, maxLength: 20 }),
                fc.integer({ min: 0, max: nodes.length - 1 }),
                (edges, centerNodeIndex) => {
                  edges.forEach(edge => manager.addEdge(edge));
                  
                  const centerNode = nodes[centerNodeIndex];
                  const subgraph = manager.getSubgraph(centerNode.id, radius);
                  
                  // Verify center node is in subgraph
                  expect(subgraph.nodes.has(centerNode.id)).toBe(true);
                  
                  // Verify all nodes in subgraph are within radius
                  subgraph.nodes.forEach((node, nodeId) => {
                    const distance = manager.calculateDistance(centerNode.id, nodeId);
                    // Distance of -1 means no path, which shouldn't happen in subgraph
                    if (distance !== -1) {
                      expect(distance).toBeLessThanOrEqual(radius);
                    }
                  });
                  
                  // Verify all edges in subgraph connect nodes that are both in subgraph
                  subgraph.edges.forEach(edge => {
                    expect(subgraph.nodes.has(edge.source)).toBe(true);
                    expect(subgraph.nodes.has(edge.target)).toBe(true);
                  });
                }
              ),
              { numRuns: 10 }
            );
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

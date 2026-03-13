/**
 * Property-based tests for GraphManager
 *
 * Validates: Requirements 2.1, 2.3
 */

import * as fc from 'fast-check';
import { GraphManager } from '../graphManager';
import { Edge, EdgeType, Node, NodeType } from '@/types/graph';

const NUM_RUNS = 10;

const nodeTypeArbitrary = fc.constantFrom<NodeType>('user', 'future_self', 'comrade', 'guide');
const edgeTypeArbitrary = fc.constantFrom<EdgeType>('direct', 'indirect', 'potential');
const idArbitrary = fc.string({ minLength: 1, maxLength: 20 }).filter((value) => value.trim().length > 0);

const nodeArbitrary: fc.Arbitrary<Node> = fc.record({
  id: idArbitrary,
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
      x: fc.double({ min: -1000, max: 1000, noNaN: true }),
      y: fc.double({ min: -1000, max: 1000, noNaN: true }),
    }),
    { nil: undefined }
  ),
});

function uniqueNodesArbitrary(minLength: number, maxLength: number) {
  return fc.uniqueArray(nodeArbitrary, {
    selector: (node) => node.id,
    minLength,
    maxLength,
  });
}

function maxUniqueEdges(nodeCount: number) {
  return Math.max(0, (nodeCount * (nodeCount - 1)) / 2);
}

function normalizePair(source: string, target: string) {
  return [source, target].sort().join('::');
}

function edgesForNodeIdsArbitrary(nodeIds: string[], minLength: number, maxLength: number) {
  const cappedMaxLength = Math.min(maxLength, maxUniqueEdges(nodeIds.length));
  const cappedMinLength = Math.min(minLength, cappedMaxLength);

  if (nodeIds.length < 2) {
    return fc.constant([] as Edge[]);
  }

  return fc
    .uniqueArray(
      fc.record({
        endpoints: fc
          .tuple(fc.constantFrom(...nodeIds), fc.constantFrom(...nodeIds))
          .filter(([source, target]) => source !== target),
        strength: fc.double({ min: 0.01, max: 1.0, noNaN: true }),
        type: edgeTypeArbitrary,
        metadata: fc.record({
          connectionReason: fc.string({ minLength: 1, maxLength: 100 }),
          intermediaries: fc.option(fc.array(fc.string(), { maxLength: 5 }), {
            nil: undefined,
          }),
        }),
      }),
      {
        selector: (edge) => normalizePair(edge.endpoints[0], edge.endpoints[1]),
        minLength: cappedMinLength,
        maxLength: cappedMaxLength,
      }
    )
    .map((edges) =>
      edges.map((edge, index) => ({
        id: `edge-${index}-${normalizePair(edge.endpoints[0], edge.endpoints[1])}`,
        source: edge.endpoints[0],
        target: edge.endpoints[1],
        strength: edge.strength,
        type: edge.type,
        metadata: edge.metadata,
      }))
    );
}

function graphScenarioArbitrary(
  minNodes: number,
  maxNodes: number,
  minEdges: number,
  maxEdges: number
) {
  return uniqueNodesArbitrary(minNodes, maxNodes).chain((nodes) =>
    fc.record({
      userNodeId: idArbitrary,
      nodes: fc.constant(nodes),
      edges: edgesForNodeIdsArbitrary(
        nodes.map((node) => node.id),
        minEdges,
        maxEdges
      ),
    })
  );
}

function buildManager(userNodeId: string, nodes: Node[], edges: Edge[]) {
  const manager = new GraphManager(userNodeId);
  nodes.forEach((node) => manager.addNode(node));
  edges.forEach((edge) => manager.addEdge(edge));
  return manager;
}

function calculateHopDistance(edges: Edge[], sourceId: string, targetId: string) {
  if (sourceId === targetId) {
    return 0;
  }

  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    const sourceNeighbors = adjacency.get(edge.source) ?? [];
    sourceNeighbors.push(edge.target);
    adjacency.set(edge.source, sourceNeighbors);

    const targetNeighbors = adjacency.get(edge.target) ?? [];
    targetNeighbors.push(edge.source);
    adjacency.set(edge.target, targetNeighbors);
  });

  const queue: Array<{ nodeId: string; distance: number }> = [{ nodeId: sourceId, distance: 0 }];
  const visited = new Set<string>([sourceId]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    const neighbors = adjacency.get(current.nodeId) ?? [];
    for (const neighborId of neighbors) {
      if (visited.has(neighborId)) {
        continue;
      }
      if (neighborId === targetId) {
        return current.distance + 1;
      }
      visited.add(neighborId);
      queue.push({ nodeId: neighborId, distance: current.distance + 1 });
    }
  }

  return -1;
}

describe('GraphManager Property Tests', () => {
  describe('Property 2: Graph Structure Integrity', () => {
    test('Property 2.1: All added nodes should be retrievable', () => {
      fc.assert(
        fc.property(idArbitrary, uniqueNodesArbitrary(0, 50), (userNodeId, nodes) => {
          const manager = buildManager(userNodeId, nodes, []);

          nodes.forEach((node) => {
            const retrieved = manager.getNode(node.id);
            expect(retrieved).toEqual(node);
          });

          expect(manager.getAllNodes()).toHaveLength(nodes.length);
        }),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 2.2: All added edges should be retrievable and maintain source-target relationships', () => {
      fc.assert(
        fc.property(graphScenarioArbitrary(2, 20, 0, 30), ({ userNodeId, nodes, edges }) => {
          const manager = buildManager(userNodeId, nodes, edges);

          edges.forEach((edge) => {
            const retrieved = manager.getEdge(edge.id);
            expect(retrieved).toEqual(edge);
          });

          expect(manager.getAllEdges()).toHaveLength(edges.length);
        }),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 2.3: Adjacency list should accurately reflect edge connections', () => {
      fc.assert(
        fc.property(graphScenarioArbitrary(2, 15, 1, 20), ({ userNodeId, nodes, edges }) => {
          const manager = buildManager(userNodeId, nodes, edges);

          edges.forEach((edge) => {
            expect(manager.getNeighbors(edge.source).some((node) => node.id === edge.target)).toBe(
              true
            );
            expect(manager.getNeighbors(edge.target).some((node) => node.id === edge.source)).toBe(
              true
            );
          });
        }),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 2.4: Node removal should remove all associated edges', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(3, 15, 1, 20).chain((scenario) =>
            fc.record({
              scenario: fc.constant(scenario),
              nodeIndexToRemove: fc.integer({ min: 0, max: scenario.nodes.length - 1 }),
            })
          ),
          ({ scenario, nodeIndexToRemove }) => {
            const { userNodeId, nodes, edges } = scenario;
            const manager = buildManager(userNodeId, nodes, edges);
            const nodeToRemove = nodes[nodeIndexToRemove];
            const connectedEdges = edges.filter(
              (edge) => edge.source === nodeToRemove.id || edge.target === nodeToRemove.id
            );

            manager.removeNode(nodeToRemove.id);

            expect(manager.getNode(nodeToRemove.id)).toBeUndefined();
            expect(manager.getAllEdges()).toHaveLength(edges.length - connectedEdges.length);

            manager.getAllEdges().forEach((edge) => {
              expect(edge.source).not.toBe(nodeToRemove.id);
              expect(edge.target).not.toBe(nodeToRemove.id);
            });

            manager.getAllNodes().forEach((node) => {
              manager.getNeighbors(node.id).forEach((neighbor) => {
                expect(neighbor.id).not.toBe(nodeToRemove.id);
              });
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 2.5: Edge removal should update adjacency list correctly', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(2, 15, 1, 20).chain((scenario) =>
            fc.record({
              scenario: fc.constant(scenario),
              edgeIndexToRemove: fc.integer({ min: 0, max: scenario.edges.length - 1 }),
            })
          ),
          ({ scenario, edgeIndexToRemove }) => {
            const { userNodeId, nodes, edges } = scenario;
            const manager = buildManager(userNodeId, nodes, edges);
            const edgeToRemove = edges[edgeIndexToRemove];

            manager.removeEdge(edgeToRemove.id);

            expect(manager.getEdge(edgeToRemove.id)).toBeUndefined();
            expect(manager.getAllEdges()).toHaveLength(edges.length - 1);
            expect(
              manager.getNeighbors(edgeToRemove.source).some((node) => node.id === edgeToRemove.target)
            ).toBe(false);
            expect(
              manager.getNeighbors(edgeToRemove.target).some((node) => node.id === edgeToRemove.source)
            ).toBe(false);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 2.6: Graph data structure should remain consistent after multiple operations', () => {
      fc.assert(
        fc.property(graphScenarioArbitrary(5, 20, 3, 25), ({ userNodeId, nodes, edges }) => {
          const manager = buildManager(userNodeId, nodes, edges);

          if (nodes.length > 2) {
            const nodeToToggle = nodes[1];
            manager.removeNode(nodeToToggle.id);
            manager.addNode(nodeToToggle);
          }

          if (edges.length > 0) {
            const edgeToToggle = edges[0];
            manager.removeEdge(edgeToToggle.id);
            manager.addEdge(edgeToToggle);
          }

          manager.getAllEdges().forEach((edge) => {
            expect(manager.getNode(edge.source)).toBeDefined();
            expect(manager.getNode(edge.target)).toBeDefined();
            expect(manager.getNeighbors(edge.source).some((node) => node.id === edge.target)).toBe(
              true
            );
            expect(manager.getNeighbors(edge.target).some((node) => node.id === edge.source)).toBe(
              true
            );
          });

          manager.getAllNodes().forEach((node) => {
            manager.getNeighbors(node.id).forEach((neighbor) => {
              expect(manager.getNode(neighbor.id)).toBeDefined();
            });
          });
        }),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 2.7: Subgraph should contain only nodes within specified radius', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(5, 15, 4, 20).chain((scenario) =>
            fc.record({
              scenario: fc.constant(scenario),
              radius: fc.integer({ min: 1, max: 3 }),
              centerNodeIndex: fc.integer({ min: 0, max: scenario.nodes.length - 1 }),
            })
          ),
          ({ scenario, radius, centerNodeIndex }) => {
            const { userNodeId, nodes, edges } = scenario;
            const manager = buildManager(userNodeId, nodes, edges);
            const centerNode = nodes[centerNodeIndex];
            const subgraph = manager.getSubgraph(centerNode.id, radius);

            expect(subgraph.nodes.has(centerNode.id)).toBe(true);

            subgraph.nodes.forEach((_node, nodeId) => {
              const distance = calculateHopDistance(edges, centerNode.id, nodeId);
              if (distance !== -1) {
                expect(distance).toBeLessThanOrEqual(radius);
              }
            });

            subgraph.edges.forEach((edge) => {
              expect(subgraph.nodes.has(edge.source)).toBe(true);
              expect(subgraph.nodes.has(edge.target)).toBe(true);
            });
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});

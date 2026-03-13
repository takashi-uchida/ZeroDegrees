/**
 * Property-based tests for GraphCanvas interactions
 *
 * **Validates: Requirements 2.2, 7.1, 7.4, 10.2**
 */

import * as fc from 'fast-check';
import { render, fireEvent, waitFor } from '@testing-library/react';
import GraphCanvas from '../GraphCanvas';
import { Edge, Node, NodeType, EdgeType } from '@/types/graph';
import { SearchState } from '@/types/search';
import { VisualizationMode } from '@/types/ui';

const NUM_RUNS = 10;
const LATENCY_THRESHOLD_MS = 100;

// Arbitraries for generating test data
const nodeTypeArbitrary = fc.constantFrom<NodeType>('user', 'future_self', 'comrade', 'guide');
const edgeTypeArbitrary = fc.constantFrom<EdgeType>('direct', 'indirect', 'potential');
const idArbitrary = fc.string({ minLength: 1, maxLength: 20 }).filter((value) => value.trim().length > 0);
const searchStateArbitrary = fc.constantFrom<SearchState>('idle', 'searching', 'found');
const visualizationModeArbitrary = fc.constantFrom<VisualizationMode>('concentric', 'heatmap', 'path');

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
      x: fc.double({ min: 0, max: 960, noNaN: true }),
      y: fc.double({ min: 0, max: 720, noNaN: true }),
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

function edgesForNodeIdsArbitrary(nodeIds: string[], minLength: number, maxLength: number) {
  if (nodeIds.length < 2) {
    return fc.constant([] as Edge[]);
  }

  const maxPossibleEdges = Math.max(0, (nodeIds.length * (nodeIds.length - 1)) / 2);
  const cappedMaxLength = Math.min(maxLength, maxPossibleEdges);
  const cappedMinLength = Math.min(minLength, cappedMaxLength);

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
        selector: (edge) => [edge.endpoints[0], edge.endpoints[1]].sort().join('::'),
        minLength: cappedMinLength,
        maxLength: cappedMaxLength,
      }
    )
    .map((edges) =>
      edges.map((edge, index) => ({
        id: `edge-${index}`,
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
      nodes: fc.constant(nodes),
      edges: edgesForNodeIdsArbitrary(
        nodes.map((node) => node.id),
        minEdges,
        maxEdges
      ),
    })
  );
}

describe('GraphCanvas Property Tests', () => {
  describe('Property 3: Interactive Element Responsiveness', () => {
    test('Property 3.1: Node click interactions should respond within latency threshold', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(1, 50, 0, 30).chain((scenario) =>
            fc.record({
              scenario: fc.constant(scenario),
              nodeIndexToClick: fc.integer({ min: 0, max: scenario.nodes.length - 1 }),
            })
          ),
          ({ scenario, nodeIndexToClick }) => {
            const { nodes, edges } = scenario;
            const nodeToClick = nodes[nodeIndexToClick];
            const onNodeClick = jest.fn();

            const { container } = render(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                onNodeClick={onNodeClick}
                width={960}
                height={720}
              />
            );

            // Wait for D3 simulation to initialize
            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();

            // Measure click response time
            const startTime = performance.now();

            // Find the node element - D3 creates g elements for nodes
            const nodeElements = container.querySelectorAll('circle[data-graph-role="node"]');
            if (nodeElements.length > 0) {
              const nodeElement = nodeElements[nodeIndexToClick];
              fireEvent.click(nodeElement);

              const endTime = performance.now();
              const responseTime = endTime - startTime;

              // Verify response within threshold
              expect(responseTime).toBeLessThan(LATENCY_THRESHOLD_MS);

              // Verify callback was invoked
              expect(onNodeClick).toHaveBeenCalled();
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 3.2: Edge hover interactions should respond within latency threshold', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(2, 30, 1, 20).chain((scenario) =>
            fc.record({
              scenario: fc.constant(scenario),
              edgeIndexToHover: fc.integer({ min: 0, max: scenario.edges.length - 1 }),
            })
          ),
          ({ scenario, edgeIndexToHover }) => {
            const { nodes, edges } = scenario;
            const onEdgeHover = jest.fn();

            const { container } = render(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                onEdgeHover={onEdgeHover}
                width={960}
                height={720}
              />
            );

            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();

            // Measure hover response time
            const startTime = performance.now();

            // Find edge elements - D3 creates line elements for edges
            const edgeElements = container.querySelectorAll('line[data-graph-role="edge"]');
            if (edgeElements.length > 0 && edgeIndexToHover < edgeElements.length) {
              const edgeElement = edgeElements[edgeIndexToHover];
              fireEvent.mouseEnter(edgeElement);

              const endTime = performance.now();
              const responseTime = endTime - startTime;

              // Verify response within threshold
              expect(responseTime).toBeLessThan(LATENCY_THRESHOLD_MS);

              // Verify callback was invoked
              expect(onEdgeHover).toHaveBeenCalled();
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 3.3: Zoom interactions should respond within latency threshold', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(5, 40, 3, 25).chain((scenario) =>
            fc.record({
              scenario: fc.constant(scenario),
              zoomScale: fc.double({ min: 0.5, max: 3.0, noNaN: true }),
            })
          ),
          ({ scenario, zoomScale }) => {
            const { nodes, edges } = scenario;

            const { container } = render(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                width={960}
                height={720}
              />
            );

            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();

            // Measure zoom response time
            const startTime = performance.now();

            // Simulate zoom by triggering wheel event
            if (svg) {
              fireEvent.wheel(svg, { deltaY: zoomScale > 1 ? -100 : 100 });

              const endTime = performance.now();
              const responseTime = endTime - startTime;

              // Verify response within threshold
              expect(responseTime).toBeLessThan(LATENCY_THRESHOLD_MS);
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 3.4: Pan interactions should respond within latency threshold', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(5, 40, 3, 25).chain((scenario) =>
            fc.record({
              scenario: fc.constant(scenario),
              panDelta: fc.record({
                x: fc.integer({ min: -200, max: 200 }),
                y: fc.integer({ min: -200, max: 200 }),
              }),
            })
          ),
          ({ scenario, panDelta }) => {
            const { nodes, edges } = scenario;

            const { container } = render(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                width={960}
                height={720}
              />
            );

            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();

            // Measure pan response time
            const startTime = performance.now();

            // Simulate pan by triggering mouse events
            if (svg) {
              fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 });
              fireEvent.mouseMove(svg, { clientX: 100 + panDelta.x, clientY: 100 + panDelta.y });
              fireEvent.mouseUp(svg);

              const endTime = performance.now();
              const responseTime = endTime - startTime;

              // Verify response within threshold
              expect(responseTime).toBeLessThan(LATENCY_THRESHOLD_MS);
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 3.5: Node selection should update visual state within latency threshold', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(3, 30, 2, 20).chain((scenario) =>
            fc.record({
              scenario: fc.constant(scenario),
              selectedNodeIndex: fc.integer({ min: 0, max: scenario.nodes.length - 1 }),
            })
          ),
          ({ scenario, selectedNodeIndex }) => {
            const { nodes, edges } = scenario;
            const selectedNodeId = nodes[selectedNodeIndex].id;

            const startTime = performance.now();

            const { container, rerender } = render(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                width={960}
                height={720}
              />
            );

            // Update with selected node
            rerender(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                selectedNodeId={selectedNodeId}
                width={960}
                height={720}
              />
            );

            const endTime = performance.now();
            const responseTime = endTime - startTime;

            // Verify response within threshold
            expect(responseTime).toBeLessThan(LATENCY_THRESHOLD_MS);

            // Verify the component rendered
            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 3.6: Visualization mode changes should respond within latency threshold', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(5, 35, 3, 22).chain((scenario) =>
            fc.record({
              scenario: fc.constant(scenario),
              initialMode: visualizationModeArbitrary,
              newMode: visualizationModeArbitrary,
            })
          ),
          ({ scenario, initialMode, newMode }) => {
            const { nodes, edges } = scenario;

            const { container, rerender } = render(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                visualizationMode={initialMode}
                width={960}
                height={720}
              />
            );

            // Measure mode change response time
            const startTime = performance.now();

            rerender(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                visualizationMode={newMode}
                width={960}
                height={720}
              />
            );

            const endTime = performance.now();
            const responseTime = endTime - startTime;

            // Verify response within threshold
            expect(responseTime).toBeLessThan(LATENCY_THRESHOLD_MS);

            // Verify the component rendered
            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 3.7: Search state changes should respond within latency threshold', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(5, 30, 3, 20).chain((scenario) =>
            fc.record({
              scenario: fc.constant(scenario),
              initialState: searchStateArbitrary,
              newState: searchStateArbitrary,
            })
          ),
          ({ scenario, initialState, newState }) => {
            const { nodes, edges } = scenario;

            const { container, rerender } = render(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                searchState={initialState}
                width={960}
                height={720}
              />
            );

            // Measure state change response time
            const startTime = performance.now();

            rerender(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                searchState={newState}
                width={960}
                height={720}
              />
            );

            const endTime = performance.now();
            const responseTime = endTime - startTime;

            // Verify response within threshold
            expect(responseTime).toBeLessThan(LATENCY_THRESHOLD_MS);

            // Verify the component rendered
            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();

            // Verify search state UI appears when searching
            if (newState === 'searching') {
              const searchingIndicator = container.querySelector('.animate-ping');
              expect(searchingIndicator).toBeInTheDocument();
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 3.8: Path highlighting should respond within latency threshold', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(5, 30, 4, 20).chain((scenario) =>
            fc.record({
              scenario: fc.constant(scenario),
              pathNodeCount: fc.integer({ min: 2, max: Math.min(5, scenario.nodes.length) }),
            })
          ),
          ({ scenario, pathNodeCount }) => {
            const { nodes, edges } = scenario;
            const activePathNodeIds = nodes.slice(0, pathNodeCount).map((node) => node.id);
            const activePathEdgeIds = edges.slice(0, Math.min(pathNodeCount - 1, edges.length)).map((edge) => edge.id);

            const { container, rerender } = render(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                width={960}
                height={720}
              />
            );

            // Measure path highlighting response time
            const startTime = performance.now();

            rerender(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                activePathNodeIds={activePathNodeIds}
                activePathEdgeIds={activePathEdgeIds}
                width={960}
                height={720}
              />
            );

            const endTime = performance.now();
            const responseTime = endTime - startTime;

            // Verify response within threshold
            expect(responseTime).toBeLessThan(LATENCY_THRESHOLD_MS);

            // Verify the component rendered
            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 3.9: Distance metrics toggle should respond within latency threshold', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(5, 30, 3, 20),
          (scenario) => {
            const { nodes, edges } = scenario;

            const { container, rerender } = render(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                showDistanceMetrics={false}
                width={960}
                height={720}
              />
            );

            // Measure toggle response time
            const startTime = performance.now();

            rerender(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                showDistanceMetrics={true}
                width={960}
                height={720}
              />
            );

            const endTime = performance.now();
            const responseTime = endTime - startTime;

            // Verify response within threshold
            expect(responseTime).toBeLessThan(LATENCY_THRESHOLD_MS);

            // Verify the component rendered
            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 3.10: Focus node changes should respond within latency threshold', () => {
      fc.assert(
        fc.property(
          graphScenarioArbitrary(3, 30, 2, 20).chain((scenario) =>
            fc.record({
              scenario: fc.constant(scenario),
              focusNodeIndex: fc.integer({ min: 0, max: scenario.nodes.length - 1 }),
            })
          ),
          ({ scenario, focusNodeIndex }) => {
            const { nodes, edges } = scenario;
            const focusNodeId = nodes[focusNodeIndex].id;

            const { container, rerender } = render(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                width={960}
                height={720}
              />
            );

            // Measure focus change response time
            const startTime = performance.now();

            rerender(
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                focusNodeId={focusNodeId}
                width={960}
                height={720}
              />
            );

            const endTime = performance.now();
            const responseTime = endTime - startTime;

            // Verify response within threshold
            expect(responseTime).toBeLessThan(LATENCY_THRESHOLD_MS);

            // Verify the component rendered
            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});

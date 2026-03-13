/**
 * Property-based tests for DistanceVisualizationLayer
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import DistanceVisualizationLayer from '../DistanceVisualizationLayer';
import { Node, NodeType } from '@/types/graph';
import { VisualizationMode } from '@/types/ui';

const NUM_RUNS = 10;

// Arbitraries for generating test data
const nodeTypeArbitrary = fc.constantFrom<NodeType>('user', 'future_self', 'comrade', 'guide');
const visualizationModeArbitrary = fc.constantFrom<VisualizationMode>('concentric', 'heatmap', 'path');
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

describe('DistanceVisualizationLayer Property Tests', () => {
  describe('Property 1: Distance Information Completeness', () => {
    test('Property 1.1: For any search result, distance information should include measurable metric', () => {
      fc.assert(
        fc.property(
          fc.record({
            nodes: uniqueNodesArbitrary(1, 50),
            mode: visualizationModeArbitrary,
            showDistanceMetrics: fc.boolean(),
            activeRouteLength: fc.nat(10),
          }),
          ({ nodes, mode, showDistanceMetrics, activeRouteLength }) => {
            const { container } = render(
              <DistanceVisualizationLayer
                mode={mode}
                onModeChange={jest.fn()}
                showDistanceMetrics={showDistanceMetrics}
                onToggleDistanceMetrics={jest.fn()}
                nodes={nodes}
                activeRouteLength={activeRouteLength}
              />
            );

            // Verify max distance metric is displayed
            const maxDistance = Math.max(...nodes.map((node) => node.distance), 1);
            const maxDistanceElements = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === `${maxDistance} shifts`
            );
            expect(maxDistanceElements.length).toBeGreaterThan(0);

            // Verify active route metric is displayed
            if (activeRouteLength > 0) {
              const routeElements = Array.from(container.querySelectorAll('p')).filter(
                (el) => el.textContent === `${activeRouteLength} hops`
              );
              expect(routeElements.length).toBeGreaterThan(0);
            } else {
              const routeElements = Array.from(container.querySelectorAll('p')).filter(
                (el) => el.textContent === 'Select a node'
              );
              expect(routeElements.length).toBeGreaterThan(0);
            }

            // Verify distance explanation is present
            const whatDistanceMeansLabels = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === 'What distance means'
            );
            expect(whatDistanceMeansLabels.length).toBeGreaterThan(0);
            
            const explanations = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent?.includes('Distance is not geography')
            );
            expect(explanations.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 1.2: For any search result, distance information should include visual indicators', () => {
      fc.assert(
        fc.property(
          fc.record({
            nodes: uniqueNodesArbitrary(1, 50),
            mode: visualizationModeArbitrary,
            showDistanceMetrics: fc.boolean(),
            activeRouteLength: fc.nat(10),
          }),
          ({ nodes, mode, showDistanceMetrics, activeRouteLength }) => {
            const { container } = render(
              <DistanceVisualizationLayer
                mode={mode}
                onModeChange={jest.fn()}
                showDistanceMetrics={showDistanceMetrics}
                onToggleDistanceMetrics={jest.fn()}
                nodes={nodes}
                activeRouteLength={activeRouteLength}
              />
            );

            // Verify mode-specific visual indicators are present
            if (mode === 'heatmap') {
              const maxDistance = Math.max(...nodes.map((node) => node.distance), 1);
              if (maxDistance > 0) {
                // Heatmap should display distance scale
                const scaleElements = Array.from(container.querySelectorAll('p')).filter(
                  (el) => el.textContent === 'Distance scale'
                );
                expect(scaleElements.length).toBeGreaterThan(0);

                // Verify color gradient elements exist
                const gradientElements = container.querySelectorAll('[title*="shifts"]');
                expect(gradientElements.length).toBeGreaterThan(0);
              }
            }

            if (mode === 'concentric') {
              const maxDistance = Math.max(...nodes.map((node) => node.distance), 1);
              if (maxDistance > 0) {
                // Concentric should display ring distances
                const ringElements = Array.from(container.querySelectorAll('p')).filter(
                  (el) => el.textContent === 'Ring distances'
                );
                expect(ringElements.length).toBeGreaterThan(0);

                // Verify ring indicators exist
                const ringIndicators = container.querySelectorAll('.rounded-full.border.border-slate-700');
                expect(ringIndicators.length).toBeGreaterThan(0);
              }
            }

            // Verify legend with color indicators is present for all modes
            const legendItems = container.querySelectorAll('.inline-block.h-2\\.5.w-2\\.5.rounded-full');
            expect(legendItems.length).toBe(4); // You, Future Self, Comrade, Guide
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 1.3: For any search result, distance information should show degree/shift count', () => {
      fc.assert(
        fc.property(
          fc.record({
            nodes: uniqueNodesArbitrary(1, 50),
            mode: visualizationModeArbitrary,
            showDistanceMetrics: fc.boolean(),
            activeRouteLength: fc.nat(10),
          }),
          ({ nodes, mode, showDistanceMetrics, activeRouteLength }) => {
            const { container } = render(
              <DistanceVisualizationLayer
                mode={mode}
                onModeChange={jest.fn()}
                showDistanceMetrics={showDistanceMetrics}
                onToggleDistanceMetrics={jest.fn()}
                nodes={nodes}
                activeRouteLength={activeRouteLength}
              />
            );

            // Verify max distance shows shift count
            const maxDistance = Math.max(...nodes.map((node) => node.distance), 1);
            const maxDistanceElements = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === `${maxDistance} shifts`
            );
            expect(maxDistanceElements.length).toBeGreaterThan(0);
            expect(maxDistanceElements[0].textContent).toMatch(/\d+ shifts/);

            // Verify active route shows hop count (degrees)
            if (activeRouteLength > 0) {
              const routeElements = Array.from(container.querySelectorAll('p')).filter(
                (el) => el.textContent === `${activeRouteLength} hops`
              );
              expect(routeElements.length).toBeGreaterThan(0);
              expect(routeElements[0].textContent).toMatch(/\d+ hops/);
            }

            // Verify mode-specific degree indicators
            if (mode === 'concentric') {
              const maxDistance = Math.max(...nodes.map((node) => node.distance), 1);
              if (maxDistance > 0) {
                // Ring distances should show numbered rings (degrees)
                const ringElements = Array.from(container.querySelectorAll('p')).filter(
                  (el) => el.textContent === 'Ring distances'
                );
                expect(ringElements.length).toBeGreaterThan(0);
              }
            }

            if (mode === 'heatmap') {
              const maxDistance = Math.max(...nodes.map((node) => node.distance), 1);
              if (maxDistance > 0) {
                // Distance scale should show shift counts
                const scaleStartElements = Array.from(container.querySelectorAll('span')).filter(
                  (el) => el.textContent === '0 shifts'
                );
                const scaleEndElements = Array.from(container.querySelectorAll('span')).filter(
                  (el) => el.textContent === `${maxDistance} shifts`
                );
                expect(scaleStartElements.length).toBeGreaterThan(0);
                expect(scaleEndElements.length).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 1.4: For any search result with nodes, all three distance information components should be present', () => {
      fc.assert(
        fc.property(
          fc.record({
            nodes: uniqueNodesArbitrary(1, 50),
            mode: visualizationModeArbitrary,
            showDistanceMetrics: fc.boolean(),
            activeRouteLength: fc.nat(10),
          }),
          ({ nodes, mode, showDistanceMetrics, activeRouteLength }) => {
            const { container } = render(
              <DistanceVisualizationLayer
                mode={mode}
                onModeChange={jest.fn()}
                showDistanceMetrics={showDistanceMetrics}
                onToggleDistanceMetrics={jest.fn()}
                nodes={nodes}
                activeRouteLength={activeRouteLength}
              />
            );

            // Component 1: Measurable metric (max distance)
            const maxDistance = Math.max(...nodes.map((node) => node.distance), 1);
            const maxDistanceLabels = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === 'Max distance'
            );
            expect(maxDistanceLabels.length).toBeGreaterThan(0);
            
            const maxDistanceValues = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === `${maxDistance} shifts`
            );
            expect(maxDistanceValues.length).toBeGreaterThan(0);

            // Component 2: Visual indicators (legend with colors)
            const legendItems = container.querySelectorAll('.inline-block.h-2\\.5.w-2\\.5.rounded-full');
            expect(legendItems.length).toBe(4);

            // Component 3: Degree/shift count (active route)
            const activeRouteLabels = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === 'Active route'
            );
            expect(activeRouteLabels.length).toBeGreaterThan(0);
            
            if (activeRouteLength > 0) {
              const routeValues = Array.from(container.querySelectorAll('p')).filter(
                (el) => el.textContent === `${activeRouteLength} hops`
              );
              expect(routeValues.length).toBeGreaterThan(0);
            } else {
              const routeValues = Array.from(container.querySelectorAll('p')).filter(
                (el) => el.textContent === 'Select a node'
              );
              expect(routeValues.length).toBeGreaterThan(0);
            }

            // Additional: Distance explanation should always be present
            const explanations = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent?.includes('Distance is not geography')
            );
            expect(explanations.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 1.5: For any visualization mode, distance metrics should remain accessible', () => {
      fc.assert(
        fc.property(
          fc.record({
            nodes: uniqueNodesArbitrary(1, 50),
            mode: visualizationModeArbitrary,
            showDistanceMetrics: fc.boolean(),
            activeRouteLength: fc.nat(10),
          }),
          ({ nodes, mode, showDistanceMetrics, activeRouteLength }) => {
            const { container } = render(
              <DistanceVisualizationLayer
                mode={mode}
                onModeChange={jest.fn()}
                showDistanceMetrics={showDistanceMetrics}
                onToggleDistanceMetrics={jest.fn()}
                nodes={nodes}
                activeRouteLength={activeRouteLength}
              />
            );

            // Regardless of mode, core distance metrics should be present
            const maxDistance = Math.max(...nodes.map((node) => node.distance), 1);
            
            // Max distance should always be displayed
            const maxDistanceLabels = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === 'Max distance'
            );
            expect(maxDistanceLabels.length).toBeGreaterThan(0);
            
            const maxDistanceValues = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === `${maxDistance} shifts`
            );
            expect(maxDistanceValues.length).toBeGreaterThan(0);

            // Active route should always be displayed
            const activeRouteLabels = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === 'Active route'
            );
            expect(activeRouteLabels.length).toBeGreaterThan(0);

            // Distance explanation should always be displayed
            const whatDistanceMeans = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === 'What distance means'
            );
            expect(whatDistanceMeans.length).toBeGreaterThan(0);
            
            const explanations = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent?.includes('Distance is not geography')
            );
            expect(explanations.length).toBeGreaterThan(0);

            // Mode-specific indicators should be present
            const modeTitle = mode.charAt(0).toUpperCase() + mode.slice(1);
            const modeTitles = Array.from(container.querySelectorAll('h2')).filter(
              (el) => el.textContent?.includes(`${modeTitle} mode`)
            );
            expect(modeTitles.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 1.6: For any node set, distance metrics should accurately reflect the data', () => {
      fc.assert(
        fc.property(
          fc.record({
            nodes: uniqueNodesArbitrary(1, 50),
            mode: visualizationModeArbitrary,
            showDistanceMetrics: fc.boolean(),
            activeRouteLength: fc.nat(10),
          }),
          ({ nodes, mode, showDistanceMetrics, activeRouteLength }) => {
            const { container } = render(
              <DistanceVisualizationLayer
                mode={mode}
                onModeChange={jest.fn()}
                showDistanceMetrics={showDistanceMetrics}
                onToggleDistanceMetrics={jest.fn()}
                nodes={nodes}
                activeRouteLength={activeRouteLength}
              />
            );

            // Calculate expected max distance
            const expectedMaxDistance = Math.max(...nodes.map((node) => node.distance), 1);
            
            // Verify displayed max distance matches calculation
            const displayedMaxDistances = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === `${expectedMaxDistance} shifts`
            );
            expect(displayedMaxDistances.length).toBeGreaterThan(0);

            // Verify active route length matches input
            if (activeRouteLength > 0) {
              const displayedRoutes = Array.from(container.querySelectorAll('p')).filter(
                (el) => el.textContent === `${activeRouteLength} hops`
              );
              expect(displayedRoutes.length).toBeGreaterThan(0);
            }

            // For heatmap mode, verify scale endpoints match max distance
            if (mode === 'heatmap' && expectedMaxDistance > 0) {
              const scaleStarts = Array.from(container.querySelectorAll('span')).filter(
                (el) => el.textContent === '0 shifts'
              );
              const scaleEnds = Array.from(container.querySelectorAll('span')).filter(
                (el) => el.textContent === `${expectedMaxDistance} shifts`
              );
              expect(scaleStarts.length).toBeGreaterThan(0);
              expect(scaleEnds.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 1.7: For any empty or single-node result, distance information should still be complete', () => {
      fc.assert(
        fc.property(
          fc.record({
            nodes: fc.oneof(
              fc.constant([] as Node[]),
              uniqueNodesArbitrary(1, 1)
            ),
            mode: visualizationModeArbitrary,
            showDistanceMetrics: fc.boolean(),
            activeRouteLength: fc.nat(10),
          }),
          ({ nodes, mode, showDistanceMetrics, activeRouteLength }) => {
            const { container } = render(
              <DistanceVisualizationLayer
                mode={mode}
                onModeChange={jest.fn()}
                showDistanceMetrics={showDistanceMetrics}
                onToggleDistanceMetrics={jest.fn()}
                nodes={nodes}
                activeRouteLength={activeRouteLength}
              />
            );

            // Even with empty/single node, distance metrics should be present
            const maxDistanceLabels = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === 'Max distance'
            );
            expect(maxDistanceLabels.length).toBeGreaterThan(0);
            
            const activeRouteLabels = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === 'Active route'
            );
            expect(activeRouteLabels.length).toBeGreaterThan(0);
            
            const whatDistanceMeans = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent === 'What distance means'
            );
            expect(whatDistanceMeans.length).toBeGreaterThan(0);

            // Legend should still be present
            const legendItems = container.querySelectorAll('.inline-block.h-2\\.5.w-2\\.5.rounded-full');
            expect(legendItems.length).toBe(4);

            // Distance explanation should be present
            const explanations = Array.from(container.querySelectorAll('p')).filter(
              (el) => el.textContent?.includes('Distance is not geography')
            );
            expect(explanations.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 1.8: For any node set with varying distances, visual indicators should scale appropriately', () => {
      fc.assert(
        fc.property(
          fc.record({
            nodes: uniqueNodesArbitrary(3, 30),
            mode: visualizationModeArbitrary,
            showDistanceMetrics: fc.boolean(),
            activeRouteLength: fc.nat(10),
          }),
          ({ nodes, mode, showDistanceMetrics, activeRouteLength }) => {
            const { container } = render(
              <DistanceVisualizationLayer
                mode={mode}
                onModeChange={jest.fn()}
                showDistanceMetrics={showDistanceMetrics}
                onToggleDistanceMetrics={jest.fn()}
                nodes={nodes}
                activeRouteLength={activeRouteLength}
              />
            );

            const maxDistance = Math.max(...nodes.map((node) => node.distance), 1);

            // For heatmap mode, verify gradient scale elements
            if (mode === 'heatmap' && maxDistance > 0) {
              const scaleLabels = Array.from(container.querySelectorAll('p')).filter(
                (el) => el.textContent === 'Distance scale'
              );
              expect(scaleLabels.length).toBeGreaterThan(0);

              // Verify gradient elements exist
              const gradientBars = container.querySelectorAll('[title*="shifts"]');
              expect(gradientBars.length).toBeGreaterThan(0);
              expect(gradientBars.length).toBeLessThanOrEqual(Math.min(maxDistance + 1, 8));
            }

            // For concentric mode, verify ring indicators
            if (mode === 'concentric' && maxDistance > 0) {
              const ringLabels = Array.from(container.querySelectorAll('p')).filter(
                (el) => el.textContent === 'Ring distances'
              );
              expect(ringLabels.length).toBeGreaterThan(0);

              // Verify ring number indicators exist
              const ringIndicators = container.querySelectorAll('.rounded-full.border.border-slate-700');
              expect(ringIndicators.length).toBeGreaterThan(0);
              expect(ringIndicators.length).toBeLessThanOrEqual(Math.min(maxDistance, 4));
            }

            // For all modes, verify legend color indicators
            const colorIndicators = container.querySelectorAll('.inline-block.h-2\\.5.w-2\\.5.rounded-full');
            expect(colorIndicators.length).toBe(4);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 1.9: For any search result, distance toggle control should be present and functional', () => {
      fc.assert(
        fc.property(
          fc.record({
            nodes: uniqueNodesArbitrary(1, 50),
            mode: visualizationModeArbitrary,
            showDistanceMetrics: fc.boolean(),
            activeRouteLength: fc.nat(10),
          }),
          ({ nodes, mode, showDistanceMetrics, activeRouteLength }) => {
            const onToggle = jest.fn();
            const { container } = render(
              <DistanceVisualizationLayer
                mode={mode}
                onModeChange={jest.fn()}
                showDistanceMetrics={showDistanceMetrics}
                onToggleDistanceMetrics={onToggle}
                nodes={nodes}
                activeRouteLength={activeRouteLength}
              />
            );

            // Verify distance labels toggle button exists
            const toggleButtons = Array.from(container.querySelectorAll('button')).filter(
              (el) => el.textContent === 'Distance labels'
            );
            expect(toggleButtons.length).toBeGreaterThan(0);
            const toggleButton = toggleButtons[0];

            // Verify toggle button reflects current state
            if (showDistanceMetrics) {
              expect(toggleButton.className).toContain('border-emerald-300');
            } else {
              expect(toggleButton.className).toContain('border-white/10');
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    test('Property 1.10: For any search result, all mode buttons should be present and indicate current mode', () => {
      fc.assert(
        fc.property(
          fc.record({
            nodes: uniqueNodesArbitrary(1, 50),
            mode: visualizationModeArbitrary,
            showDistanceMetrics: fc.boolean(),
            activeRouteLength: fc.nat(10),
          }),
          ({ nodes, mode, showDistanceMetrics, activeRouteLength }) => {
            const { container } = render(
              <DistanceVisualizationLayer
                mode={mode}
                onModeChange={jest.fn()}
                showDistanceMetrics={showDistanceMetrics}
                onToggleDistanceMetrics={jest.fn()}
                nodes={nodes}
                activeRouteLength={activeRouteLength}
              />
            );

            // Verify all three mode buttons exist
            const allButtons = Array.from(container.querySelectorAll('button'));
            const concentricButtons = allButtons.filter((el) => el.textContent === 'Concentric');
            const heatmapButtons = allButtons.filter((el) => el.textContent === 'Heatmap');
            const pathButtons = allButtons.filter((el) => el.textContent === 'Path');

            expect(concentricButtons.length).toBeGreaterThan(0);
            expect(heatmapButtons.length).toBeGreaterThan(0);
            expect(pathButtons.length).toBeGreaterThan(0);

            // Verify current mode is highlighted
            const modeTitle = mode.charAt(0).toUpperCase() + mode.slice(1);
            const activeButtons = allButtons.filter((el) => el.textContent === modeTitle);
            expect(activeButtons.length).toBeGreaterThan(0);
            expect(activeButtons[0].className).toContain('border-sky-300');
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});

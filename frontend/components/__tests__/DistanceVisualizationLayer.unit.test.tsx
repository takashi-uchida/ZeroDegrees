/**
 * Unit tests for DistanceVisualizationLayer component
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */

import { render, fireEvent } from '@testing-library/react';
import DistanceVisualizationLayer from '../DistanceVisualizationLayer';
import { Node } from '@/types/graph';
import { VisualizationMode } from '@/types/ui';

describe('DistanceVisualizationLayer', () => {
  const mockNodes: Node[] = [
    {
      id: 'user-1',
      type: 'user',
      label: 'You',
      distance: 0,
      metadata: { description: 'Current user', viewpointShifts: 0 },
    },
    {
      id: 'guide-1',
      type: 'guide',
      label: 'Guide',
      distance: 1,
      metadata: { description: 'A guide', viewpointShifts: 1 },
    },
    {
      id: 'future-1',
      type: 'future_self',
      label: 'Future Self',
      distance: 3,
      metadata: { description: 'Future self', viewpointShifts: 3 },
    },
  ];

  describe('Mode Switcher UI', () => {
    test('should render all three visualization mode buttons', () => {
      const onModeChange = jest.fn();
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={onModeChange}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      expect(getByText('Concentric')).toBeTruthy();
      expect(getByText('Heatmap')).toBeTruthy();
      expect(getByText('Path')).toBeTruthy();
    });

    test('should highlight the active mode button', () => {
      const onModeChange = jest.fn();
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="heatmap"
          onModeChange={onModeChange}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      const heatmapButton = getByText('Heatmap').closest('button');
      expect(heatmapButton?.className).toContain('border-sky-300');
    });

    test('should call onModeChange when a mode button is clicked', () => {
      const onModeChange = jest.fn();
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={onModeChange}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      const pathButton = getByText('Path').closest('button');
      if (pathButton) {
        fireEvent.click(pathButton);
      }

      expect(onModeChange).toHaveBeenCalledWith('path');
    });

    test('should switch between all three modes', () => {
      const onModeChange = jest.fn();
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={onModeChange}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      const modes: VisualizationMode[] = ['concentric', 'heatmap', 'path'];
      modes.forEach((mode) => {
        const button = getByText(mode.charAt(0).toUpperCase() + mode.slice(1)).closest('button');
        if (button) {
          fireEvent.click(button);
        }
      });

      expect(onModeChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Distance Metrics Display', () => {
    test('should display max distance from nodes', () => {
      const onModeChange = jest.fn();
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={onModeChange}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      expect(getByText('3 shifts')).toBeTruthy();
    });

    test('should display active route length', () => {
      const onModeChange = jest.fn();
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={onModeChange}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={2}
        />
      );

      expect(getByText('2 hops')).toBeTruthy();
    });

    test('should show "Select a node" when no active route', () => {
      const onModeChange = jest.fn();
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={onModeChange}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      expect(getByText('Select a node')).toBeTruthy();
    });

    test('should display distance explanation text', () => {
      const onModeChange = jest.fn();
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={onModeChange}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      expect(
        getByText(/Distance is not geography/i)
      ).toBeTruthy();
    });
  });

  describe('Distance Labels Toggle', () => {
    test('should render distance labels toggle button', () => {
      const onToggle = jest.fn();
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={onToggle}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      expect(getByText('Distance labels')).toBeTruthy();
    });

    test('should call onToggleDistanceMetrics when toggle button is clicked', () => {
      const onToggle = jest.fn();
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={onToggle}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      const toggleButton = getByText('Distance labels').closest('button');
      if (toggleButton) {
        fireEvent.click(toggleButton);
      }

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    test('should highlight toggle button when distance metrics are shown', () => {
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      const toggleButton = getByText('Distance labels').closest('button');
      expect(toggleButton?.className).toContain('border-emerald-300');
    });
  });

  describe('Legend Display', () => {
    test('should display legend for all node types', () => {
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      expect(getByText('You')).toBeTruthy();
      expect(getByText('Future Self')).toBeTruthy();
      expect(getByText('Comrade')).toBeTruthy();
      expect(getByText('Guide')).toBeTruthy();
    });
  });

  describe('Mode Descriptions', () => {
    test('should display correct description for concentric mode', () => {
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      expect(getByText(/Distance appears as rings/i)).toBeTruthy();
    });

    test('should display correct description for heatmap mode', () => {
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="heatmap"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      expect(getByText(/Farther viewpoints glow warmer/i)).toBeTruthy();
    });

    test('should display correct description for path mode', () => {
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="path"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      expect(getByText(/The strongest route is emphasized/i)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty nodes array', () => {
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={[]}
          activeRouteLength={0}
        />
      );

      // Should show 1 shift as minimum (Math.max fallback)
      expect(getByText('1 shifts')).toBeTruthy();
    });

    test('should handle single node', () => {
      const singleNode: Node[] = [
        {
          id: 'user-1',
          type: 'user',
          label: 'You',
          distance: 0,
          metadata: { description: 'User', viewpointShifts: 0 },
        },
      ];

      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={singleNode}
          activeRouteLength={0}
        />
      );

      // Should show 1 shift as minimum (Math.max fallback)
      expect(getByText('1 shifts')).toBeTruthy();
    });

    test('should handle large distance values', () => {
      const largeDistanceNodes: Node[] = [
        {
          id: 'node-1',
          type: 'future_self',
          label: 'Far Node',
          distance: 100,
          metadata: { description: 'Very far', viewpointShifts: 100 },
        },
      ];

      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={largeDistanceNodes}
          activeRouteLength={0}
        />
      );

      expect(getByText('100 shifts')).toBeTruthy();
    });
  });

  describe('Distance Scale Visualization', () => {
    test('should display heatmap distance scale in heatmap mode', () => {
      const { getByText, getAllByText } = render(
        <DistanceVisualizationLayer
          mode="heatmap"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      expect(getByText('Distance scale')).toBeTruthy();
      expect(getByText('Close')).toBeTruthy();
      expect(getByText('Far')).toBeTruthy();
      expect(getByText('0 shifts')).toBeTruthy();
      // Use getAllByText since "3 shifts" appears in both max distance and scale
      const shiftsElements = getAllByText('3 shifts');
      expect(shiftsElements.length).toBeGreaterThan(0);
    });

    test('should not display heatmap scale in concentric mode', () => {
      const { queryByText, getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      // Should show ring distances instead
      expect(queryByText('Close')).toBeFalsy();
      expect(getByText('Ring distances')).toBeTruthy();
    });

    test('should display ring distances in concentric mode', () => {
      const { getByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      expect(getByText('Ring distances')).toBeTruthy();
      expect(getByText('Direct connections')).toBeTruthy();
      expect(getByText('Second-degree connections')).toBeTruthy();
      expect(getByText('Third-degree connections')).toBeTruthy();
    });

    test('should only show rings up to max distance', () => {
      const limitedNodes: Node[] = [
        {
          id: 'user-1',
          type: 'user',
          label: 'You',
          distance: 0,
          metadata: { description: 'User', viewpointShifts: 0 },
        },
        {
          id: 'guide-1',
          type: 'guide',
          label: 'Guide',
          distance: 2,
          metadata: { description: 'A guide', viewpointShifts: 2 },
        },
      ];

      const { getByText, queryByText } = render(
        <DistanceVisualizationLayer
          mode="concentric"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={limitedNodes}
          activeRouteLength={0}
        />
      );

      expect(getByText('Direct connections')).toBeTruthy();
      expect(getByText('Second-degree connections')).toBeTruthy();
      expect(queryByText('Third-degree connections')).toBeFalsy();
    });

    test('should not display distance scales in path mode', () => {
      const { queryByText } = render(
        <DistanceVisualizationLayer
          mode="path"
          onModeChange={jest.fn()}
          showDistanceMetrics={true}
          onToggleDistanceMetrics={jest.fn()}
          nodes={mockNodes}
          activeRouteLength={0}
        />
      );

      expect(queryByText('Distance scale')).toBeFalsy();
      expect(queryByText('Ring distances')).toBeFalsy();
    });
  });
});

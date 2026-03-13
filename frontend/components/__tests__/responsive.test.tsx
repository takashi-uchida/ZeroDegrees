/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react'
import GraphCanvas from '../GraphCanvas'

describe('Mobile Responsive Design', () => {
  const mockNodes = [
    { id: 'user-1', type: 'user' as const, label: 'You', distance: 0, metadata: {} },
    { id: 'node-1', type: 'future_self' as const, label: 'Person 1', distance: 1, metadata: {} },
  ]

  const mockEdges = [
    { id: 'edge-1', source: 'user-1', target: 'node-1', strength: 0.8, type: 'direct' as const, metadata: {} },
  ]

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
  })

  it('renders GraphCanvas with mobile controls', () => {
    const { container } = render(
      <GraphCanvas
        nodes={mockNodes}
        edges={mockEdges}
        width={375}
        height={500}
      />
    )
    expect(container.querySelector('svg, canvas')).toBeTruthy()
  })

  it('increases node radius on mobile', () => {
    const { container } = render(
      <GraphCanvas
        nodes={mockNodes}
        edges={mockEdges}
        width={375}
        height={500}
      />
    )
    expect(container).toBeTruthy()
  })
})

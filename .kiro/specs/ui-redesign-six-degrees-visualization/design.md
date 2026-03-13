# Design Document: UI Redesign for Six Degrees Visualization

## Overview

This design document outlines the technical approach for redesigning the ZeroDegrees UI to emphasize the visualization of "six degrees of separation" as a solvable problem through AI. The redesign transforms the interface from a simple recommendation list into an interactive graph-based exploration tool that visualizes distance, pathways, and AI agent deliberation in real-time.

### Core Design Principles

1. **Distance as a First-Class Citizen**: Distance is not metadata—it's the primary visual element
2. **Process Over Results**: Show the journey of discovery, not just the destination
3. **Graph-Native Thinking**: Embrace network visualization as the primary UI paradigm
4. **AI Transparency**: Make the multi-agent deliberation process visible and understandable
5. **Emotional Resonance**: Create a sense of "calculated destiny" rather than algorithmic matching

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Application Shell                     │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Search     │  │   Graph      │  │   Agent      │ │
│  │   Input      │  │   Canvas     │  │   Debate     │ │
│  │  Component   │  │  Component   │  │   Panel      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Distance Visualization Layer            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Real-time Update Orchestrator            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   WebSocket  │    │   Graph      │    │   Animation  │
│   Service    │    │   Engine     │    │   Engine     │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Technology Stack

**Frontend Framework**: React 18+ with TypeScript
- Component-based architecture for modularity
- Hooks for state management and side effects
- TypeScript for type safety

**Graph Visualization**: D3.js or Cytoscape.js
- D3.js: Maximum flexibility, custom animations, force-directed layouts
- Cytoscape.js: Graph-specific features, better performance for large graphs
- Recommendation: Start with D3.js for custom visual language, migrate to Cytoscape.js if performance becomes an issue

**Real-time Communication**: WebSocket (Socket.io)
- Bi-directional communication for AI agent updates
- Event-driven architecture for progressive disclosure
- Fallback to Server-Sent Events (SSE) for one-way updates

**Animation**: Framer Motion or React Spring
- Framer Motion: Declarative animations, gesture support
- React Spring: Physics-based animations, better performance
- Recommendation: Framer Motion for UI transitions, React Spring for graph animations

**State Management**: Zustand or Jotai
- Lightweight alternatives to Redux
- Better TypeScript support
- Simpler mental model for real-time updates

**Styling**: Tailwind CSS + CSS Modules
- Tailwind for rapid prototyping and consistency
- CSS Modules for component-specific complex animations

## Components and Interfaces

### 1. Graph Canvas Component

The central visualization component that renders the network graph.

```typescript
interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  focusNodeId?: string;
  onNodeClick: (nodeId: string) => void;
  onEdgeHover: (edgeId: string) => void;
  searchState: 'idle' | 'searching' | 'found';
  animationQueue: AnimationEvent[];
}

interface Node {
  id: string;
  type: 'user' | 'future_self' | 'comrade' | 'guide';
  label: string;
  distance: number;
  metadata: {
    avatar?: string;
    description: string;
    viewpointShifts: number;
  };
  position?: { x: number; y: number };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  strength: number; // 0-1, affects visual weight
  type: 'direct' | 'indirect' | 'potential';
  metadata: {
    connectionReason: string;
    intermediaries?: string[];
  };
}

interface AnimationEvent {
  type: 'node_discovered' | 'edge_explored' | 'path_found' | 'agent_opinion';
  timestamp: number;
  data: any;
}
```

**Key Responsibilities**:
- Render nodes and edges using force-directed layout
- Handle zoom, pan, and node selection
- Animate path exploration in real-time
- Highlight active paths and nodes
- Adapt layout for mobile screens

**Implementation Notes**:
- Use D3's force simulation for organic node positioning
- Implement quadtree for efficient collision detection
- Use canvas rendering for >100 nodes, SVG for smaller graphs
- Implement level-of-detail (LOD) rendering for performance

### 2. Distance Visualization Layer

Overlays distance metrics on the graph and provides alternative distance representations.

```typescript
interface DistanceVisualizationProps {
  userNodeId: string;
  targetNodeId?: string;
  nodes: Node[];
  edges: Edge[];
  visualizationMode: 'concentric' | 'heatmap' | 'path';
}

interface DistanceMetric {
  nodeId: string;
  distance: number;
  distanceType: 'degrees' | 'viewpoint_shifts' | 'conceptual';
  path?: string[]; // ordered list of node IDs
}
```

**Visualization Modes**:

1. **Concentric Circles**: Nodes arranged in rings based on distance from user
2. **Heatmap**: Color-coded nodes (cool = close, warm = far)
3. **Path Highlighting**: Emphasize the shortest path with animated flow

**Key Responsibilities**:
- Calculate and display distance metrics
- Provide visual encoding of distance (color, size, position)
- Animate distance changes as graph evolves
- Show "degrees of separation" counter

### 3. Agent Debate Panel

Displays the multi-agent deliberation process in an understandable format.

```typescript
interface AgentDebatePanelProps {
  debate: DebateSession;
  isActive: boolean;
  onAgentClick: (agentId: string) => void;
}

interface DebateSession {
  id: string;
  topic: string; // e.g., "Evaluating candidate: John Doe"
  agents: Agent[];
  messages: DebateMessage[];
  consensus?: Consensus;
  status: 'deliberating' | 'converging' | 'concluded';
}

interface Agent {
  id: string;
  name: string;
  role: 'researcher' | 'critic' | 'synthesizer';
  avatar: string;
  color: string; // for visual identification
}

interface DebateMessage {
  id: string;
  agentId: string;
  timestamp: number;
  content: string;
  type: 'opinion' | 'evidence' | 'question' | 'conclusion';
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface Consensus {
  decision: 'accept' | 'reject' | 'defer';
  confidence: number; // 0-1
  reasoning: string;
  supportingAgents: string[];
  opposingAgents: string[];
}
```

**Visual Design**:
- Chat-like interface with agent avatars
- Color-coded messages by agent
- Sentiment indicators (icons or subtle color shifts)
- Consensus visualization (convergence animation)
- Collapsible sections for completed debates

**Key Responsibilities**:
- Stream debate messages in real-time
- Visualize agent agreement/disagreement
- Show consensus formation
- Provide debate summary and transcript

### 4. Search Input Component

Enhanced search interface that sets expectations for the exploration process.

```typescript
interface SearchInputProps {
  onSearch: (query: SearchQuery) => void;
  isSearching: boolean;
  placeholder?: string;
}

interface SearchQuery {
  intent: string; // user's current challenge or goal
  context?: {
    industry?: string;
    stage?: string;
    interests?: string[];
  };
  targetType: 'future_self' | 'comrade' | 'guide' | 'any';
}
```

**Key Features**:
- Multi-step input for richer context
- Visual feedback during search
- Suggested refinements based on initial input
- "Calculating destiny" loading state

### 5. Real-time Update Orchestrator

Manages the flow of updates from the backend and coordinates animations.

```typescript
interface UpdateOrchestrator {
  connect(userId: string): void;
  disconnect(): void;
  onNodeDiscovered(callback: (node: Node) => void): void;
  onEdgeExplored(callback: (edge: Edge) => void): void;
  onPathFound(callback: (path: string[]) => void): void;
  onDebateUpdate(callback: (message: DebateMessage) => void): void;
  onSearchComplete(callback: (results: SearchResults) => void): void;
}

interface SearchResults {
  matches: Node[];
  paths: Path[];
  debateSummaries: DebateSession[];
  exploredNodeCount: number;
  totalSearchTime: number;
}

interface Path {
  nodes: string[];
  distance: number;
  quality: number; // 0-1, based on connection strength
}
```

**Key Responsibilities**:
- Establish WebSocket connection
- Parse and validate incoming messages
- Queue animations to prevent overwhelming the UI
- Handle reconnection and error states
- Throttle updates for performance

## Data Models

### Graph Data Structure

```typescript
interface GraphData {
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;
  adjacencyList: Map<string, string[]>;
  userNodeId: string;
}

class GraphManager {
  private data: GraphData;
  
  addNode(node: Node): void;
  addEdge(edge: Edge): void;
  removeNode(nodeId: string): void;
  removeEdge(edgeId: string): void;
  findShortestPath(sourceId: string, targetId: string): string[];
  getNeighbors(nodeId: string): Node[];
  calculateDistance(sourceId: string, targetId: string): number;
  getSubgraph(centerNodeId: string, radius: number): GraphData;
}
```

### Animation State

```typescript
interface AnimationState {
  activeAnimations: Map<string, Animation>;
  queue: AnimationEvent[];
  isPlaying: boolean;
  speed: number; // 0.5x to 2x
}

interface Animation {
  id: string;
  type: 'node_pulse' | 'edge_flow' | 'path_trace' | 'consensus_converge';
  target: string; // node or edge ID
  duration: number;
  startTime: number;
  easing: EasingFunction;
}

type EasingFunction = (t: number) => number;
```

### UI State

```typescript
interface UIState {
  view: {
    zoom: number;
    pan: { x: number; y: number };
    focusNodeId?: string;
  };
  search: {
    query?: SearchQuery;
    state: 'idle' | 'searching' | 'found';
    results?: SearchResults;
  };
  debate: {
    activeSessions: DebateSession[];
    expandedSessionId?: string;
  };
  visualization: {
    mode: 'concentric' | 'heatmap' | 'path';
    showLabels: boolean;
    showDistanceMetrics: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    keyboardNavigationEnabled: boolean;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Distance Information Completeness

*For any* search result or connection displayed in the UI, the system should provide complete distance information including a measurable metric, visual indicators, and degree/shift count.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Graph Structure Integrity

*For any* set of nodes and edges, when rendered as a graph, all nodes should be visually distinguishable by type, all edges should be visible, and the graph structure should accurately represent the underlying data model.

**Validates: Requirements 2.1, 2.3**

### Property 3: Interactive Element Responsiveness

*For any* user interaction (click, hover, zoom, pan, filter), the system should respond with appropriate visual feedback and state changes within the specified latency threshold.

**Validates: Requirements 2.2, 7.1, 7.2, 7.3, 7.4, 7.5, 10.2**

### Property 4: Path Visualization Consistency

*For any* path from source to target node, when highlighted or animated, all nodes and edges in the path should be visually emphasized, and the path should be traceable from start to end.

**Validates: Requirements 2.4, 3.3**

### Property 5: Real-time Update Propagation

*For any* change in the graph data (new node, new edge, removed element), the visualization should update to reflect the change, and if in search state, should animate the discovery process.

**Validates: Requirements 2.5, 3.1, 3.2, 3.4**

### Property 6: Agent Debate Transparency

*For any* agent debate session, all agent messages should be displayed with agent attribution, and when consensus is reached, the convergence should be visualized.

**Validates: Requirements 4.1, 4.2, 4.3, 4.5**

### Property 7: Progress Communication

*For any* background processing or search operation, the system should display progress indicators, status messages, and incremental updates as processing advances.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 8: Match Contextualization

*For any* match or connection result, the system should provide explanatory text describing why the connection is meaningful in the user's context.

**Validates: Requirements 5.4**

### Property 9: Responsive Layout Adaptation

*For any* viewport size, the system should adapt the layout to maintain usability, and for mobile viewports, should provide touch-friendly controls and simplified visualizations for complex graphs.

**Validates: Requirements 8.1, 8.2, 8.4**

### Property 10: Accessibility Compliance

*For any* visual element or interactive component, the system should provide text alternatives, support keyboard navigation, maintain sufficient contrast, provide screen reader descriptions, and allow animation disabling.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 11: Performance Thresholds

*For any* graph with up to 100 nodes, the system should complete initial rendering within 2 seconds, maintain at least 30 FPS during animations, and respond to interactions within 100 milliseconds.

**Validates: Requirements 10.1, 10.2, 10.3**

## Error Handling

### Network Errors

**WebSocket Connection Failures**:
- Implement exponential backoff for reconnection attempts
- Display user-friendly error message: "Connection lost. Reconnecting..."
- Queue updates locally and sync when connection is restored
- Fallback to HTTP polling if WebSocket is unavailable

**Slow or Timeout Responses**:
- Display timeout warnings after 5 seconds
- Provide option to cancel long-running searches
- Cache partial results to avoid complete data loss

### Data Errors

**Invalid Graph Data**:
- Validate node and edge data structure before rendering
- Log errors to console for debugging
- Display placeholder nodes for missing data
- Gracefully handle circular references in graph

**Missing or Incomplete Metadata**:
- Use default values for missing node/edge properties
- Display "Information unavailable" for missing descriptions
- Ensure UI doesn't break with partial data

### Rendering Errors

**Canvas/SVG Rendering Failures**:
- Catch rendering exceptions and display error boundary
- Provide fallback to simpler visualization mode
- Log rendering errors for debugging

**Animation Performance Issues**:
- Monitor frame rate and automatically reduce animation complexity if FPS drops below 20
- Provide manual control to disable animations
- Use requestAnimationFrame for smooth animations

### User Input Errors

**Invalid Search Queries**:
- Validate input before sending to backend
- Display helpful error messages for invalid input
- Suggest corrections or examples

**Interaction Errors**:
- Prevent double-clicks from triggering multiple actions
- Debounce rapid interactions
- Provide visual feedback for invalid interactions (e.g., clicking disabled elements)

### Accessibility Errors

**Screen Reader Compatibility**:
- Test with multiple screen readers (NVDA, JAWS, VoiceOver)
- Provide fallback text descriptions if dynamic content fails to announce
- Ensure focus management doesn't trap users

**Keyboard Navigation Issues**:
- Ensure all interactive elements are reachable via keyboard
- Provide skip links for complex visualizations
- Display focus indicators clearly

## Testing Strategy

### Unit Testing

**Component Testing**:
- Test individual React components in isolation
- Mock external dependencies (WebSocket, graph engine)
- Verify component renders correctly with various props
- Test component state changes and event handlers

**Utility Function Testing**:
- Test graph algorithms (shortest path, distance calculation)
- Test data transformation functions
- Test animation easing functions
- Test accessibility helpers

**Tools**: Jest, React Testing Library

### Integration Testing

**Component Integration**:
- Test interactions between components (e.g., search input → graph canvas)
- Test data flow through component hierarchy
- Test WebSocket integration with UI updates
- Test animation coordination between components

**Tools**: Jest, React Testing Library, Mock Service Worker (MSW) for API mocking

### Property-Based Testing

Property-based tests will validate universal properties across randomized inputs. Each test should run a minimum of 10 iterations.

**Configuration**:
- Library: fast-check (JavaScript/TypeScript property-based testing)
- Iterations: 10 minimum per property
- Seed: Randomized, but logged for reproducibility

**Property Test Examples**:

```typescript
// Property 1: Distance Information Completeness
test('Feature: ui-redesign-six-degrees-visualization, Property 1: For any search result, distance information should be complete', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        id: fc.string(),
        type: fc.constantFrom('future_self', 'comrade', 'guide'),
        distance: fc.nat(10),
      })),
      (results) => {
        const { container } = render(<SearchResults results={results} />);
        results.forEach(result => {
          const element = container.querySelector(`[data-node-id="${result.id}"]`);
          expect(element).toHaveAttribute('data-distance');
          expect(element.querySelector('.distance-indicator')).toBeInTheDocument();
        });
      }
    ),
    { numRuns: 10 }
  );
});

// Property 3: Interactive Element Responsiveness
test('Feature: ui-redesign-six-degrees-visualization, Property 3: For any user interaction, system should respond within latency threshold', () => {
  fc.assert(
    fc.property(
      fc.record({
        nodes: fc.array(fc.record({ id: fc.string(), type: fc.string() }), { minLength: 1, maxLength: 50 }),
        clickedNodeId: fc.string(),
      }),
      ({ nodes, clickedNodeId }) => {
        const { container } = render(<GraphCanvas nodes={nodes} edges={[]} />);
        const startTime = performance.now();
        
        const node = container.querySelector(`[data-node-id="${clickedNodeId}"]`);
        if (node) {
          fireEvent.click(node);
          const endTime = performance.now();
          expect(endTime - startTime).toBeLessThan(100); // 100ms threshold
        }
      }
    ),
    { numRuns: 10 }
  );
});

// Property 5: Real-time Update Propagation
test('Feature: ui-redesign-six-degrees-visualization, Property 5: For any graph data change, visualization should update', () => {
  fc.assert(
    fc.property(
      fc.record({
        initialNodes: fc.array(fc.record({ id: fc.string(), type: fc.string() })),
        newNode: fc.record({ id: fc.string(), type: fc.string() }),
      }),
      ({ initialNodes, newNode }) => {
        const { container, rerender } = render(<GraphCanvas nodes={initialNodes} edges={[]} />);
        const initialNodeCount = container.querySelectorAll('.graph-node').length;
        
        rerender(<GraphCanvas nodes={[...initialNodes, newNode]} edges={[]} />);
        const updatedNodeCount = container.querySelectorAll('.graph-node').length;
        
        expect(updatedNodeCount).toBe(initialNodeCount + 1);
      }
    ),
    { numRuns: 10 }
  );
});

// Property 9: Responsive Layout Adaptation
test('Feature: ui-redesign-six-degrees-visualization, Property 9: For any viewport size, layout should adapt', () => {
  fc.assert(
    fc.property(
      fc.record({
        width: fc.integer({ min: 320, max: 1920 }),
        height: fc.integer({ min: 568, max: 1080 }),
      }),
      ({ width, height }) => {
        global.innerWidth = width;
        global.innerHeight = height;
        global.dispatchEvent(new Event('resize'));
        
        const { container } = render(<GraphCanvas nodes={[]} edges={[]} />);
        const canvas = container.querySelector('.graph-canvas');
        
        expect(canvas).toHaveStyle({ width: `${width}px` });
        
        if (width < 768) {
          expect(container.querySelector('.mobile-controls')).toBeInTheDocument();
        }
      }
    ),
    { numRuns: 10 }
  );
});

// Property 11: Performance Thresholds
test('Feature: ui-redesign-six-degrees-visualization, Property 11: For graphs up to 100 nodes, rendering should complete within 2 seconds', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({ id: fc.string(), type: fc.string() }),
        { minLength: 1, maxLength: 100 }
      ),
      (nodes) => {
        const startTime = performance.now();
        render(<GraphCanvas nodes={nodes} edges={[]} />);
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(2000); // 2 second threshold
      }
    ),
    { numRuns: 10 }
  );
});
```

### End-to-End Testing

**User Flows**:
- Complete search flow: input → search → results → node selection
- Graph interaction flow: zoom → pan → node click → detail view
- Agent debate flow: search → watch debate → see consensus
- Mobile flow: search on mobile → interact with touch controls

**Tools**: Playwright or Cypress

### Visual Regression Testing

**Screenshot Comparison**:
- Capture screenshots of key UI states
- Compare against baseline images
- Flag visual changes for review

**Tools**: Percy, Chromatic, or Playwright visual comparisons

### Accessibility Testing

**Automated Checks**:
- Run axe-core or similar tool on all pages
- Verify WCAG 2.1 AA compliance
- Check color contrast ratios

**Manual Testing**:
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Test keyboard navigation
- Test with reduced motion preference

**Tools**: axe-core, Pa11y, manual testing

### Performance Testing

**Metrics to Monitor**:
- Initial render time
- Time to interactive (TTI)
- Frame rate during animations
- Memory usage over time
- Network payload size

**Tools**: Lighthouse, Chrome DevTools Performance tab, custom performance marks

### Load Testing

**Stress Testing**:
- Test with graphs of 100, 500, 1000 nodes
- Test with rapid WebSocket message streams
- Test with slow network conditions

**Tools**: Custom scripts, Chrome DevTools network throttling

## Implementation Notes

### Phase 1: Core Graph Visualization (Weeks 1-2)

- Set up React project with TypeScript
- Implement basic graph canvas with D3.js
- Implement node and edge rendering
- Implement zoom and pan controls
- Implement basic distance visualization

### Phase 2: Real-time Updates (Weeks 3-4)

- Implement WebSocket connection
- Implement update orchestrator
- Implement path exploration animations
- Implement search state management

### Phase 3: Agent Debate UI (Week 5)

- Implement agent debate panel
- Implement message streaming
- Implement consensus visualization

### Phase 4: Mobile & Accessibility (Week 6)

- Implement responsive layouts
- Implement touch controls
- Implement keyboard navigation
- Implement screen reader support
- Implement reduced motion support

### Phase 5: Polish & Performance (Week 7)

- Optimize rendering performance
- Implement progressive loading
- Add error handling
- Conduct accessibility audit
- Fix bugs and refine animations

### Phase 6: Testing & Documentation (Week 8)

- Write unit tests
- Write property-based tests
- Write integration tests
- Write end-to-end tests
- Document component APIs
- Create user guide

## Future Enhancements

### Advanced Visualizations

- 3D graph visualization for complex networks
- VR/AR support for immersive exploration
- Time-based graph evolution (show how network changes over time)

### AI Features

- Predictive path suggestions based on user behavior
- Personalized graph layouts based on user preferences
- Natural language queries for graph exploration

### Collaboration

- Multi-user graph exploration
- Shared annotations and notes on nodes
- Real-time collaboration on search queries

### Analytics

- Track user interaction patterns
- Measure engagement metrics
- A/B test different visualization approaches

## References

- Six Degrees of Separation Theory: Milgram, S. (1967). "The Small World Problem"
- Graph Visualization: "Graph Drawing: Algorithms for the Visualization of Graphs" by Di Battista et al.
- D3.js Documentation: https://d3js.org/
- Cytoscape.js Documentation: https://js.cytoscape.org/
- React Documentation: https://react.dev/
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- MiroFish/BettaFish Multi-Agent Architecture: https://github.com/666ghj/MiroFish

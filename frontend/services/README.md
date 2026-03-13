# WebSocket Service

The WebSocket service provides real-time communication between the frontend and backend for the Six Degrees visualization.

## Features

- **Automatic Reconnection**: Implements exponential backoff strategy for reconnection attempts
- **Connection State Management**: Tracks connection state (disconnected, connecting, connected, reconnecting, error)
- **Error Handling**: Comprehensive error handling with error callbacks
- **Event-Driven Architecture**: Subscribe to specific events (node_discovered, edge_explored, path_found, debate_update)
- **Configurable**: Customize reconnection behavior

## Usage

### Basic Usage with React Hook

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function MyComponent() {
  const { connectionState, error, isConnected, isReconnecting } = useWebSocket('user123');
  
  return (
    <div>
      <p>Connection: {connectionState}</p>
      {isReconnecting && <p>Reconnecting...</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Direct Service Usage

```typescript
import { websocketService } from '@/services/websocket';

// Connect
websocketService.connect('user123');

// Listen to events
websocketService.onNodeDiscovered((node) => {
  console.log('New node discovered:', node);
});

websocketService.onEdgeExplored((edge) => {
  console.log('Edge explored:', edge);
});

websocketService.onPathFound((path) => {
  console.log('Path found:', path);
});

websocketService.onDebateUpdate((message) => {
  console.log('Debate update:', message);
});

websocketService.onSearchComplete((results) => {
  console.log('Search complete:', results);
});

// Monitor connection state
websocketService.onConnectionStateChange((state) => {
  console.log('Connection state:', state);
});

// Handle errors
websocketService.onError((error) => {
  console.error('WebSocket error:', error);
});

// Disconnect when done
websocketService.disconnect();
```

### Configuring Reconnection Behavior

```typescript
websocketService.configureReconnection({
  initialDelay: 500,      // Start with 500ms delay
  maxDelay: 10000,        // Cap at 10 seconds
  maxAttempts: 5,         // Try 5 times before giving up
  backoffMultiplier: 2,   // Double the delay each time
});
```

## Connection States

- **disconnected**: Not connected to server
- **connecting**: Initial connection attempt in progress
- **connected**: Successfully connected
- **reconnecting**: Attempting to reconnect after disconnect
- **error**: Connection failed after max attempts

## Reconnection Strategy

The service uses exponential backoff for reconnection:

1. First attempt: 1 second delay
2. Second attempt: 2 seconds delay
3. Third attempt: 4 seconds delay
4. Fourth attempt: 8 seconds delay
5. Fifth attempt: 16 seconds delay
6. Subsequent attempts: 30 seconds delay (capped)

After 10 failed attempts, the service stops trying and sets state to 'error'.

## Events

### node_discovered
Emitted when a new node is discovered during graph exploration.

**Payload**: `Node` object

### edge_explored
Emitted when an edge is explored during pathfinding.

**Payload**: `Edge` object

### path_found
Emitted when a complete path is found between nodes.

**Payload**: `Path` object

### debate_update
Emitted when AI agents post new messages in the debate.

**Payload**: `DebateMessage` object

### search_complete
Emitted when the search process completes.

**Payload**: `SearchResults` object

## Environment Variables

- `NEXT_PUBLIC_WS_URL`: WebSocket server URL (default: `http://localhost:8000`)

## Error Handling

The service handles various error scenarios:

- **Connection errors**: Automatically attempts reconnection
- **Server-initiated disconnect**: Does not reconnect (requires manual reconnection)
- **Network errors**: Attempts reconnection with backoff
- **Max attempts reached**: Stops reconnecting and emits error

## Testing

Unit tests are available in `__tests__/websocket.unit.test.ts` covering:

- Connection establishment
- Event listeners
- Reconnection logic with exponential backoff
- Error handling
- Connection state management
- Callback management


## Update Orchestrator

The Update Orchestrator (`updateOrchestrator.ts`) coordinates real-time updates with animation queue management and throttling. It wraps the WebSocket service and adds intelligent batching and coordination.

### Key Features

1. **Animation Queue**: Prevents overwhelming the UI by queuing animation events and processing them sequentially
2. **Throttling**: Batches rapid updates to reduce UI churn
   - Node discoveries: 300ms delay (batched)
   - Edge explorations: 200ms delay (batched)
   - Debate messages: 500ms delay (batched)
   - Path found and search complete: No throttling (important events)
3. **Coordination**: Manages animations across components with configurable timing
4. **Event Emission**: Provides callbacks for React components to subscribe to updates

### Usage Example

```typescript
import { updateOrchestrator } from '@/services/updateOrchestrator';

// Configure callbacks
updateOrchestrator.on({
  onNodeDiscovered: (node) => {
    console.log('New node discovered:', node);
    // Update UI
  },
  onEdgeExplored: (edge) => {
    console.log('Edge explored:', edge);
    // Animate edge
  },
  onPathFound: (path) => {
    console.log('Path found:', path);
    // Highlight path
  },
  onDebateUpdate: (message) => {
    console.log('Debate update:', message);
    // Show agent message
  },
  onSearchComplete: (results) => {
    console.log('Search complete:', results);
    // Display final results
  },
  onConnectionStateChange: (state) => {
    console.log('Connection state:', state);
    // Update connection indicator
  },
  onError: (error) => {
    console.error('Error:', error);
    // Show error message
  },
  onAnimationQueued: (event) => {
    console.log('Animation queued:', event);
    // Track queue status
  },
  onQueueProcessed: () => {
    console.log('Queue processed');
    // Update UI state
  },
});

// Connect to WebSocket
updateOrchestrator.connect('user123');

// Later, disconnect
updateOrchestrator.disconnect();
```

### Configuration

You can customize throttle settings:

```typescript
// At initialization
const orchestrator = new UpdateOrchestrator({
  nodeDiscoveryDelay: 200,
  edgeExplorationDelay: 150,
  debateMessageDelay: 400,
  maxQueueSize: 100,
});

// Or at runtime
updateOrchestrator.configureThrottle({
  nodeDiscoveryDelay: 200,
});
```

### Queue Control

```typescript
// Clear the animation queue
updateOrchestrator.clearQueue();

// Pause queue processing
updateOrchestrator.pauseQueue();

// Resume queue processing
updateOrchestrator.resumeQueue();

// Check queue size
const size = updateOrchestrator.getQueueSize();

// Check connection state
const state = updateOrchestrator.getConnectionState();
```

### Architecture

The UpdateOrchestrator sits between the WebSocket service and React components:

```
WebSocket Service → UpdateOrchestrator → React Components
                    (throttling, queue)
```

This architecture ensures:
- Smooth animations even with rapid backend updates
- Controlled UI updates that don't overwhelm the browser
- Coordinated animations across multiple components
- Separation of concerns between networking and UI logic

### How It Works

1. **Throttling**: When rapid updates arrive (e.g., 10 nodes discovered in 100ms), the orchestrator batches them and processes after a delay
2. **Animation Queue**: Each update creates an animation event that's queued and processed sequentially
3. **Sequential Processing**: Animations play one after another with appropriate durations to prevent visual chaos
4. **Smart Clearing**: When search completes, the queue is cleared to immediately show final results

### Requirements Satisfied

- **Requirement 2.5**: Real-time graph updates
- **Requirement 3.1**: Animated path exploration
- **Requirement 6.2**: Incremental updates and progress feedback

### Testing

Unit tests are available in `__tests__/updateOrchestrator.unit.test.ts` covering:

- Connection management
- Animation queue behavior
- Throttling logic
- Batch processing
- Queue control (pause, resume, clear)
- Configuration options
- Event coordination
- Error handling

# ZeroDegrees Frontend Project Structure

## Overview

This is a Next.js 14 application with TypeScript, designed to visualize the "six degrees of separation" concept through an interactive graph-based UI.

## Folder Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ActionPlan.tsx
│   ├── DecisionPanel.tsx
│   ├── DistanceMap.tsx
│   ├── ForumStream.tsx
│   ├── IntroDrafts.tsx
│   ├── ProgressRail.tsx
│   ├── QueryForm.tsx
│   ├── ReasoningLog.tsx
│   └── ResultCards.tsx
├── hooks/                 # Custom React hooks
│   └── useWebSocket.ts    # WebSocket connection hook
├── utils/                 # Utility functions
│   ├── graphManager.ts    # Graph data structure manager
│   └── store.ts           # Zustand state management
├── types/                 # TypeScript type definitions
│   ├── graph.ts           # Graph-related types
│   ├── agent.ts           # AI agent types
│   ├── search.ts          # Search-related types
│   ├── animation.ts       # Animation types
│   ├── ui.ts              # UI state types
│   └── index.ts           # Type exports
├── services/              # External service integrations
│   └── websocket.ts       # WebSocket service
├── lib/                   # Library code
│   └── discovery-types.ts # Discovery types (legacy)
└── public/                # Static assets

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: Zustand
- **Graph Visualization**: D3.js
- **Real-time Communication**: Socket.io-client
- **Animation**: Framer Motion
- **Code Quality**: ESLint + Prettier

## Key Dependencies

- `next`: ^14.1.0
- `react`: ^18.2.0
- `typescript`: ^5
- `d3`: Latest
- `socket.io-client`: Latest
- `zustand`: Latest
- `framer-motion`: Latest
- `tailwindcss`: ^3.3.0

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Configuration Files

- `tsconfig.json` - TypeScript configuration (strict mode enabled)
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `next.config.js` - Next.js configuration

## Type System

The application uses a comprehensive type system defined in the `types/` directory:

- **Graph Types**: Node, Edge, GraphData, Path
- **Agent Types**: Agent, DebateMessage, DebateSession, Consensus
- **Search Types**: SearchQuery, SearchResults, SearchState
- **Animation Types**: AnimationEvent, Animation, AnimationState
- **UI Types**: UIState, ViewState, VisualizationState, AccessibilityState

## State Management

Global state is managed using Zustand in `utils/store.ts`:

- Graph data (nodes, edges)
- View state (zoom, pan, focus)
- Search state
- Debate sessions
- Visualization settings
- Accessibility preferences

## Real-time Updates

WebSocket connection is managed through:

- `services/websocket.ts` - WebSocket service implementation
- `hooks/useWebSocket.ts` - React hook for WebSocket integration

## Next Steps

1. Implement core graph visualization components
2. Build search input and results UI
3. Create agent debate panel
4. Add real-time update animations
5. Implement mobile responsive layouts
6. Add accessibility features
7. Write comprehensive tests

## Design Document

For detailed design specifications, see:
`.kiro/specs/ui-redesign-six-degrees-visualization/design.md`

# Requirements Document

## Introduction

ZeroDegreesは「6次の隔たり」理論をAIで実装し、思考の距離を可視化するプロダクトです。現在のUIは単なる人物推薦リストに見えてしまい、プロダクトの本質である「距離の可視化」「経路探索」「AIエージェントの議論プロセス」が十分に表現できていません。

本要件は、UIを再設計し、「6次の隔たりを解決している」という体験を提供することを目的とします。

## Glossary

- **System**: ZeroDegreesのフロントエンドUIシステム
- **User**: ZeroDegreesを使用するエンドユーザー
- **Distance**: 思考の距離。視点が切り替わる回数として定義される
- **Node**: グラフ上の人物または概念を表す点
- **Edge**: ノード間のつながりを表す線
- **Path**: ユーザーから目標人物までの経路
- **AI_Agent**: マルチエージェントシステムの個別エージェント
- **Debate_Process**: AIエージェント間の議論プロセス
- **Future_Self**: ユーザーの課題を既に解決した「未来の自分」に相当する人物
- **Comrade**: 同じ課題に直面している仲間
- **Guide**: ユーザーを導くメンター的存在

## Requirements

### Requirement 1: 距離の可視化

**User Story:** As a user, I want to see the "distance" between myself and potential connections, so that I understand how the "six degrees of separation" is being solved.

#### Acceptance Criteria

1. WHEN the System displays search results, THE System SHALL visualize the distance as a measurable metric
2. WHEN displaying distance, THE System SHALL use visual indicators such as numbers, progress bars, or spatial positioning
3. WHEN a User views a connection, THE System SHALL show how many "degrees" or "viewpoint shifts" separate them
4. THE System SHALL emphasize distance visualization more prominently than in a typical recommendation list

### Requirement 2: グラフ構造の可視化

**User Story:** As a user, I want to see connections between people as a visual graph, so that I can understand the network structure and pathways.

#### Acceptance Criteria

1. WHEN the System displays connections, THE System SHALL render them as a network graph with nodes and edges
2. WHEN a User interacts with the graph, THE System SHALL allow zooming, panning, and node selection
3. WHEN displaying the graph, THE System SHALL visually distinguish between different types of nodes (User, Future_Self, Comrade, Guide)
4. WHEN showing a path, THE System SHALL highlight the edges and nodes that form the connection route
5. THE System SHALL update the graph visualization in real-time as new connections are discovered

### Requirement 3: 経路探索の可視化

**User Story:** As a user, I want to see the pathways being explored, so that I feel like the system is actively searching for connections rather than just showing results.

#### Acceptance Criteria

1. WHEN the System searches for connections, THE System SHALL display an animated visualization of path exploration
2. WHEN exploring paths, THE System SHALL show multiple potential routes being evaluated simultaneously
3. WHEN a path is found, THE System SHALL animate the discovery process from the User to the target Node
4. THE System SHALL provide visual feedback indicating "searching" or "exploring" states
5. WHEN the search completes, THE System SHALL transition smoothly from exploration to final results

### Requirement 4: AIエージェント議論プロセスの可視化

**User Story:** As a user, I want to see the AI agents debating and selecting candidates, so that I understand the decision-making process and trust the recommendations.

#### Acceptance Criteria

1. WHEN AI_Agents analyze candidates, THE System SHALL display the debate process in real-time
2. WHEN displaying the debate, THE System SHALL show individual AI_Agent opinions or arguments
3. WHEN AI_Agents reach consensus, THE System SHALL visualize the convergence of opinions
4. THE System SHALL present the debate in a format that is understandable without technical knowledge
5. WHEN a User requests details, THE System SHALL provide access to the full debate transcript or summary

### Requirement 5: 「運命の出会いを計算している」体験

**User Story:** As a user, I want to feel like the system is calculating a destined encounter, so that the experience feels meaningful and different from typical matching apps.

#### Acceptance Criteria

1. WHEN the System processes a search, THE System SHALL use language and visuals that convey significance and intentionality
2. WHEN displaying results, THE System SHALL frame connections as "calculated destinies" rather than "recommendations"
3. THE System SHALL use visual metaphors such as constellations, compasses, or pathfinding to reinforce the concept
4. WHEN presenting a match, THE System SHALL explain why this connection is meaningful in the context of the User's journey
5. THE System SHALL avoid UI patterns commonly associated with dating apps or LinkedIn-style networking

### Requirement 6: リアルタイムフィードバック

**User Story:** As a user, I want to receive real-time feedback during the search process, so that I stay engaged and understand what is happening.

#### Acceptance Criteria

1. WHEN the System performs background processing, THE System SHALL display progress indicators
2. WHEN AI_Agents complete a step, THE System SHALL provide incremental updates to the User
3. THE System SHALL display status messages that describe the current phase of the search
4. WHEN unexpected delays occur, THE System SHALL communicate the reason and estimated time
5. THE System SHALL maintain User engagement through animations and progressive disclosure of information

### Requirement 7: インタラクティブな探索

**User Story:** As a user, I want to interact with the visualization, so that I can explore connections and understand the network structure more deeply.

#### Acceptance Criteria

1. WHEN a User clicks on a Node, THE System SHALL display detailed information about that person or concept
2. WHEN a User hovers over an Edge, THE System SHALL show the nature of the connection
3. THE System SHALL allow Users to expand or collapse sections of the graph
4. WHEN a User selects a Node, THE System SHALL highlight related Nodes and Edges
5. THE System SHALL provide filtering options to show or hide specific types of connections

### Requirement 8: モバイル対応

**User Story:** As a user, I want to use the visualization on mobile devices, so that I can access the system anywhere.

#### Acceptance Criteria

1. WHEN the System is accessed on a mobile device, THE System SHALL adapt the visualization to the smaller screen
2. WHEN on mobile, THE System SHALL provide touch-friendly controls for zooming, panning, and selecting
3. THE System SHALL maintain core functionality and visual clarity on screens as small as 375px wide
4. WHEN displaying complex graphs on mobile, THE System SHALL simplify or paginate the visualization
5. THE System SHALL optimize performance to ensure smooth animations on mobile devices

### Requirement 9: アクセシビリティ

**User Story:** As a user with accessibility needs, I want to access the core functionality, so that I can use the system regardless of my abilities.

#### Acceptance Criteria

1. THE System SHALL provide text alternatives for all visual elements
2. WHEN a User navigates with a keyboard, THE System SHALL support full keyboard navigation
3. THE System SHALL maintain sufficient color contrast for text and important visual elements
4. WHEN using screen readers, THE System SHALL provide meaningful descriptions of the graph structure and connections
5. THE System SHALL allow Users to disable animations if they cause discomfort

### Requirement 10: パフォーマンス

**User Story:** As a user, I want the visualization to load and respond quickly, so that the experience feels smooth and professional.

#### Acceptance Criteria

1. WHEN the System renders a graph with up to 100 Nodes, THE System SHALL complete initial rendering within 2 seconds
2. WHEN a User interacts with the visualization, THE System SHALL respond to input within 100 milliseconds
3. THE System SHALL maintain a frame rate of at least 30 FPS during animations
4. WHEN loading large datasets, THE System SHALL implement progressive loading or virtualization
5. THE System SHALL optimize memory usage to prevent browser crashes or slowdowns

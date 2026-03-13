'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AgentDebatePanel from '@/components/AgentDebatePanel';
import DistanceVisualizationLayer from '@/components/DistanceVisualizationLayer';
import GraphCanvas from '@/components/GraphCanvas';
import NodeDetailPanel from '@/components/NodeDetailPanel';
import ProgressIndicator, { ProgressPhase } from '@/components/ProgressIndicator';
import SearchInput from '@/components/SearchInput';
import { Agent, Consensus, DebateMessage, DebateSession } from '@/types/agent';
import { Edge, Node } from '@/types/graph';
import { SearchState, TargetType } from '@/types/search';
import { VisualizationMode } from '@/types/ui';
import { GraphManager } from '@/utils/graphManager';

const AGENTS: Agent[] = [
  {
    id: 'pathfinder',
    name: 'Pathfinder',
    role: 'researcher',
    avatar: 'P',
    color: '#7dd3fc',
  },
  {
    id: 'skeptic',
    name: 'Skeptic',
    role: 'critic',
    avatar: 'S',
    color: '#fb7185',
  },
  {
    id: 'synthesizer',
    name: 'Synthesizer',
    role: 'synthesizer',
    avatar: 'Y',
    color: '#6ee7b7',
  },
];

const ALL_NODES: Node[] = [
  {
    id: 'user-1',
    type: 'user',
    label: 'You',
    distance: 0,
    metadata: {
      description:
        'The current self holding the question: how do I find the shortest meaningful route to the right person?',
      viewpointShifts: 0,
    },
  },
  {
    id: 'guide-1',
    type: 'guide',
    label: 'Elena Rossi',
    distance: 1,
    metadata: {
      description:
        'Community architect who repeatedly opens trusted founder rooms and lowers the cost of a first introduction.',
      viewpointShifts: 1,
    },
  },
  {
    id: 'guide-2',
    type: 'guide',
    label: 'Arjun Mehta',
    distance: 1,
    metadata: {
      description:
        'Fractional CTO who helps founders translate a vague opportunity into something technical partners can evaluate.',
      viewpointShifts: 1,
    },
  },
  {
    id: 'comrade-1',
    type: 'comrade',
    label: 'Aisha Bello',
    distance: 2,
    metadata: {
      description:
        'Growth-led founder actively trying to find a technical co-founder while talking to design partners every week.',
      viewpointShifts: 2,
    },
  },
  {
    id: 'comrade-2',
    type: 'comrade',
    label: 'Chloe Wang',
    distance: 2,
    metadata: {
      description:
        'Founder validating a regulated AI wedge and balancing speed with careful partner selection.',
      viewpointShifts: 2,
    },
  },
  {
    id: 'future-1',
    type: 'future_self',
    label: 'Sarah Chen',
    distance: 3,
    metadata: {
      description:
        'A future-self style match: she found the right technical co-founder and turned the search into a repeatable process.',
      viewpointShifts: 3,
    },
  },
  {
    id: 'future-2',
    type: 'future_self',
    label: 'Daniel Lee',
    distance: 3,
    metadata: {
      description:
        'Operator-turned-founder who found his CTO in an open-source AI community and now teaches the interview process.',
      viewpointShifts: 3,
    },
  },
  {
    id: 'guide-3',
    type: 'guide',
    label: 'Maya Tanaka',
    distance: 2,
    metadata: {
      description:
        'Cross-border founder who knows how to bridge trust and communication gaps before an introduction happens.',
      viewpointShifts: 2,
    },
  },
];

const ALL_EDGES: Edge[] = [
  {
    id: 'edge-user-elena',
    source: 'user-1',
    target: 'guide-1',
    strength: 0.95,
    type: 'direct',
    metadata: {
      connectionReason: 'Shared founder community with active office hours and warm introduction norms.',
    },
  },
  {
    id: 'edge-user-arjun',
    source: 'user-1',
    target: 'guide-2',
    strength: 0.88,
    type: 'direct',
    metadata: {
      connectionReason: 'Technical scoping bridge: Arjun translates founder vision into CTO-legible scope.',
    },
  },
  {
    id: 'edge-elena-aisha',
    source: 'guide-1',
    target: 'comrade-1',
    strength: 0.76,
    type: 'indirect',
    metadata: {
      connectionReason: 'Elena introduced Aisha into a trusted founder circle focused on co-founder search.',
    },
  },
  {
    id: 'edge-arjun-chloe',
    source: 'guide-2',
    target: 'comrade-2',
    strength: 0.7,
    type: 'indirect',
    metadata: {
      connectionReason: 'Arjun has advised Chloe on technical scoping and partner-fit conversations.',
    },
  },
  {
    id: 'edge-elena-maya',
    source: 'guide-1',
    target: 'guide-3',
    strength: 0.65,
    type: 'potential',
    metadata: {
      connectionReason: 'A cross-border founder network creates a trusted mutual bridge.',
    },
  },
  {
    id: 'edge-aisha-sarah',
    source: 'comrade-1',
    target: 'future-1',
    strength: 0.9,
    type: 'direct',
    metadata: {
      connectionReason: 'Aisha studies Sarah’s founder outreach playbook and references it in community sessions.',
    },
  },
  {
    id: 'edge-chloe-daniel',
    source: 'comrade-2',
    target: 'future-2',
    strength: 0.84,
    type: 'direct',
    metadata: {
      connectionReason: 'Chloe and Daniel overlap in AI founder circles and technical screening discussions.',
    },
  },
  {
    id: 'edge-arjun-daniel',
    source: 'guide-2',
    target: 'future-2',
    strength: 0.8,
    type: 'potential',
    metadata: {
      connectionReason: 'Arjun and Daniel both mentor first-time AI founders on founder-CTO fit.',
    },
  },
  {
    id: 'edge-maya-sarah',
    source: 'guide-3',
    target: 'future-1',
    strength: 0.72,
    type: 'potential',
    metadata: {
      connectionReason: 'Maya knows Sarah through cross-border founder dinners and trust-based intro sessions.',
    },
  },
];

const TARGET_TO_NODE: Record<TargetType, string> = {
  future_self: 'future-1',
  comrade: 'comrade-1',
  guide: 'guide-1',
  any: 'future-1',
};

const TARGET_TO_TOPIC: Record<TargetType, string> = {
  future_self: 'Selecting the strongest Future Self route',
  comrade: 'Finding the best Comrade for live calibration',
  guide: 'Choosing the Guide who unlocks the next step',
  any: 'Calculating the strongest overall path',
};

function buildConsensus(targetLabel: string, targetType: TargetType): Consensus {
  const decisionLabel =
    targetType === 'guide'
      ? 'accept'
      : targetType === 'comrade'
        ? 'accept'
        : 'accept';

  return {
    decision: decisionLabel,
    confidence: targetType === 'any' ? 0.89 : 0.92,
    reasoning: `${targetLabel} is the shortest trustworthy route because the graph shows both distance and contextual fit, not just profile similarity.`,
    supportingAgents: ['pathfinder', 'synthesizer'],
    opposingAgents: ['skeptic'],
  };
}

function buildDebateMessages(query: string, targetType: TargetType, targetLabel: string): DebateMessage[] {
  return [
    {
      id: `${targetType}-msg-1`,
      agentId: 'pathfinder',
      timestamp: 1,
      type: 'evidence',
      sentiment: 'positive',
      content: `The query "${query}" maps cleanly onto a founder-transition graph. ${targetLabel} sits on a short path with visible trust bridges.`,
    },
    {
      id: `${targetType}-msg-2`,
      agentId: 'skeptic',
      timestamp: 2,
      type: 'question',
      sentiment: 'neutral',
      content: `Shortest is not enough. We also need proof that this route changes the user's viewpoint, not just their contact list.`,
    },
    {
      id: `${targetType}-msg-3`,
      agentId: 'pathfinder',
      timestamp: 3,
      type: 'evidence',
      sentiment: 'positive',
      content: `${targetLabel} has evidence of solving the same founder tension and sits within a route that can be explained in plain language.`,
    },
    {
      id: `${targetType}-msg-4`,
      agentId: 'synthesizer',
      timestamp: 4,
      type: 'opinion',
      sentiment: 'positive',
      content: `This is not just a recommendation. It is a path: from You, through a trust-bearing guide or peer, toward ${targetLabel}.`,
    },
    {
      id: `${targetType}-msg-5`,
      agentId: 'skeptic',
      timestamp: 5,
      type: 'conclusion',
      sentiment: 'positive',
      content: `I accept the route if we surface the exact bridge and show the shortest path visually.`,
    },
  ];
}

function buildPhases(activeIndex: number, searchState: SearchState): ProgressPhase[] {
  const definitions = [
    {
      id: 'context',
      label: 'Context capture',
      description: 'Translate the user’s tension into a graph-readable intent.',
    },
    {
      id: 'graph',
      label: 'Graph traversal',
      description: 'Reveal candidate bridges and trusted rooms in real time.',
    },
    {
      id: 'debate',
      label: 'Agent debate',
      description: 'Compare shortest routes and meaning, not just similarity.',
    },
    {
      id: 'destiny',
      label: 'Distance locked',
      description: 'Commit to the route and make the final path legible.',
    },
  ];

  return definitions.map((phase, index) => ({
    ...phase,
    status:
      searchState === 'found'
        ? 'complete'
        : index < activeIndex
          ? 'complete'
          : index === activeIndex
            ? 'current'
            : 'upcoming',
  }));
}

function buildEdgeIdsFromPath(pathNodeIds: string[]) {
  const edgeIds: string[] = [];

  for (let index = 0; index < pathNodeIds.length - 1; index += 1) {
    const source = pathNodeIds[index];
    const target = pathNodeIds[index + 1];
    const edge = ALL_EDGES.find(
      (candidate) =>
        (candidate.source === source && candidate.target === target) ||
        (candidate.source === target && candidate.target === source)
    );

    if (edge) {
      edgeIds.push(edge.id);
    }
  }

  return edgeIds;
}

function buildGraphManager(nodes: Node[], edges: Edge[]) {
  const manager = new GraphManager('user-1');
  nodes.forEach((node) => manager.addNode(node));
  edges.forEach((edge) => manager.addEdge(edge));
  return manager;
}

function initialFoundState() {
  const targetNodeId = TARGET_TO_NODE.future_self;
  const manager = buildGraphManager(ALL_NODES, ALL_EDGES);
  const pathNodeIds = manager.findShortestPath('user-1', targetNodeId);
  const targetNode = ALL_NODES.find((node) => node.id === targetNodeId)!;

  return {
    targetNodeId,
    pathNodeIds,
    pathEdgeIds: buildEdgeIdsFromPath(pathNodeIds),
    debate: {
      id: `debate-${targetNodeId}`,
      topic: TARGET_TO_TOPIC.future_self,
      agents: AGENTS,
      messages: buildDebateMessages(
        'I want to start an AI SaaS company but I still do not have a technical co-founder.',
        'future_self',
        targetNode.label
      ),
      consensus: buildConsensus(targetNode.label, 'future_self'),
      status: 'concluded',
    } satisfies DebateSession,
  };
}

export default function GraphTestPage() {
  const initial = initialFoundState();

  const [query, setQuery] = useState(
    'I want to start an AI SaaS company but I still do not have a technical co-founder.'
  );
  const [targetType, setTargetType] = useState<TargetType>('future_self');
  const [searchState, setSearchState] = useState<SearchState>('found');
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('concentric');
  const [showDistanceMetrics, setShowDistanceMetrics] = useState(true);
  const [revealedNodeIds, setRevealedNodeIds] = useState<string[]>(ALL_NODES.map((node) => node.id));
  const [revealedEdgeIds, setRevealedEdgeIds] = useState<string[]>(ALL_EDGES.map((edge) => edge.id));
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(initial.targetNodeId);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | undefined>();
  const [phaseIndex, setPhaseIndex] = useState(3);
  const [statusMessage, setStatusMessage] = useState(
    'The graph is idle and ready to recalculate the shortest meaningful route.'
  );
  const [exploredNodes, setExploredNodes] = useState(ALL_NODES.length);
  const [debateSession, setDebateSession] = useState<DebateSession | null>(initial.debate);
  const [graphSize, setGraphSize] = useState({ width: 920, height: 720 });
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const timeoutIdsRef = useRef<number[]>([]);

  const visibleNodes = ALL_NODES.filter((node) => revealedNodeIds.includes(node.id));
  const visibleEdges = ALL_EDGES.filter((edge) => revealedEdgeIds.includes(edge.id));

  const graphManager = useMemo(
    () => buildGraphManager(visibleNodes, visibleEdges),
    [visibleEdges, visibleNodes]
  );

  const selectedNode = selectedNodeId ? graphManager.getNode(selectedNodeId) : undefined;
  const hoveredEdge = hoveredEdgeId ? ALL_EDGES.find((edge) => edge.id === hoveredEdgeId) : undefined;
  const activePathNodeIds =
    selectedNodeId && selectedNodeId !== 'user-1'
      ? graphManager.findShortestPath('user-1', selectedNodeId)
      : [];
  const activePathEdgeIds = buildEdgeIdsFromPath(activePathNodeIds);
  const routeLabels = activePathNodeIds.map((nodeId) => graphManager.getNode(nodeId)?.label ?? nodeId);
  const neighborCount = selectedNode ? graphManager.getNeighbors(selectedNode.id).length : 0;

  useEffect(() => {
    const element = graphContainerRef.current;
    if (!element) return undefined;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 920;
      setGraphSize({
        width: Math.max(320, Math.floor(width)),
        height: width < 700 ? 560 : 720,
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  const runSearch = () => {
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current = [];

    const targetNodeId = TARGET_TO_NODE[targetType];
    const targetNode = ALL_NODES.find((node) => node.id === targetNodeId)!;
    const allMessages = buildDebateMessages(query, targetType, targetNode.label);

    setSearchState('searching');
    setPhaseIndex(0);
    setStatusMessage('Reading the question and translating it into graph-native intent...');
    setExploredNodes(1);
    setRevealedNodeIds(['user-1', 'guide-1', 'guide-2']);
    setRevealedEdgeIds(['edge-user-elena', 'edge-user-arjun']);
    setSelectedNodeId('user-1');
    setHoveredEdgeId(undefined);
    setDebateSession({
      id: `debate-${targetType}`,
      topic: TARGET_TO_TOPIC[targetType],
      agents: AGENTS,
      messages: [allMessages[0]],
      status: 'deliberating',
    });

    timeoutIdsRef.current.push(
      window.setTimeout(() => {
        setPhaseIndex(1);
        setStatusMessage('Exploring live routes through guides, peers, and trust-bearing rooms...');
        setExploredNodes(5);
        setRevealedNodeIds([
          'user-1',
          'guide-1',
          'guide-2',
          'comrade-1',
          'comrade-2',
          'guide-3',
        ]);
        setRevealedEdgeIds([
          'edge-user-elena',
          'edge-user-arjun',
          'edge-elena-aisha',
          'edge-arjun-chloe',
          'edge-elena-maya',
        ]);
        setDebateSession((current) =>
          current
            ? { ...current, messages: allMessages.slice(0, 2), status: 'deliberating' }
            : current
        );
      }, 800)
    );

    timeoutIdsRef.current.push(
      window.setTimeout(() => {
        setPhaseIndex(2);
        setStatusMessage('Agents are debating which route is shortest, strongest, and most meaningful.');
        setExploredNodes(7);
        setRevealedNodeIds(ALL_NODES.map((node) => node.id));
        setRevealedEdgeIds(ALL_EDGES.map((edge) => edge.id));
        setDebateSession((current) =>
          current
            ? { ...current, messages: allMessages.slice(0, 4), status: 'converging' }
            : current
        );
      }, 1700)
    );

    timeoutIdsRef.current.push(
      window.setTimeout(() => {
        setPhaseIndex(3);
        setSearchState('found');
        setSelectedNodeId(targetNodeId);
        setStatusMessage(`Consensus reached. ${targetNode.label} is now the active destination in the graph.`);
        setExploredNodes(ALL_NODES.length);
        setDebateSession({
          id: `debate-${targetType}`,
          topic: TARGET_TO_TOPIC[targetType],
          agents: AGENTS,
          messages: allMessages,
          consensus: buildConsensus(targetNode.label, targetType),
          status: 'concluded',
        });
      }, 2800)
    );
  };

  const phases = buildPhases(phaseIndex, searchState);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a_0%,#020617_55%)] px-4 py-6 text-white md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            Six Degrees Prototype
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
            See the route, not just the recommendation.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            The graph shows who is near, why the route is trusted, and what path connects the
            current self to the person you need next.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_360px]">
          <aside className="space-y-6">
            <SearchInput
              value={query}
              targetType={targetType}
              isSearching={searchState === 'searching'}
              onChange={setQuery}
              onTargetTypeChange={setTargetType}
              onSearch={runSearch}
            />
            <ProgressIndicator
              phases={phases}
              exploredNodes={exploredNodes}
              currentMessage={statusMessage}
            />
          </aside>

          <section className="space-y-6">
            <DistanceVisualizationLayer
              mode={visualizationMode}
              onModeChange={setVisualizationMode}
              showDistanceMetrics={showDistanceMetrics}
              onToggleDistanceMetrics={() => setShowDistanceMetrics((current) => !current)}
              nodes={visibleNodes}
              activeRouteLength={Math.max(0, activePathNodeIds.length - 1)}
            />

            <div
              ref={graphContainerRef}
              className="rounded-[32px] border border-slate-800 bg-slate-950/70 p-4 shadow-[0_30px_120px_rgba(2,6,23,0.45)]"
            >
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Graph canvas
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    The path is part of the answer.
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
                    {visibleNodes.length} visible nodes
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
                    {visibleEdges.length} visible edges
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
                    Mode: {visualizationMode}
                  </span>
                </div>
              </div>

              <GraphCanvas
                nodes={visibleNodes}
                edges={visibleEdges}
                focusNodeId={TARGET_TO_NODE[targetType]}
                selectedNodeId={selectedNodeId}
                activePathNodeIds={activePathNodeIds}
                activePathEdgeIds={activePathEdgeIds}
                hoveredEdgeId={hoveredEdgeId}
                visualizationMode={visualizationMode}
                showDistanceMetrics={showDistanceMetrics}
                searchState={searchState}
                width={graphSize.width - 32}
                height={graphSize.height}
                onNodeClick={setSelectedNodeId}
                onEdgeHover={setHoveredEdgeId}
              />
            </div>
          </section>

          <aside className="space-y-6">
            <AgentDebatePanel session={debateSession} />
            <NodeDetailPanel
              node={selectedNode}
              routeLabels={routeLabels}
              neighborCount={neighborCount}
              hoveredEdge={hoveredEdge}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

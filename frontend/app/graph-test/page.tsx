'use client';

import { useState } from 'react';
import GraphCanvas from '@/components/GraphCanvas';
import { Node, Edge } from '@/types/graph';

export default function GraphTestPage() {
  // Sample data for testing
  const [nodes] = useState<Node[]>([
    {
      id: 'user-1',
      type: 'user',
      label: 'You',
      distance: 0,
      metadata: {
        description: 'Current user',
        viewpointShifts: 0,
      },
    },
    {
      id: 'future-1',
      type: 'future_self',
      label: 'Future Self',
      distance: 3,
      metadata: {
        description: 'Someone who solved your problem',
        viewpointShifts: 3,
      },
    },
    {
      id: 'comrade-1',
      type: 'comrade',
      label: 'Comrade',
      distance: 2,
      metadata: {
        description: 'Someone facing the same challenge',
        viewpointShifts: 2,
      },
    },
    {
      id: 'guide-1',
      type: 'guide',
      label: 'Guide',
      distance: 1,
      metadata: {
        description: 'Someone who can unlock next step',
        viewpointShifts: 1,
      },
    },
  ]);

  const [edges] = useState<Edge[]>([
    {
      id: 'edge-1',
      source: 'user-1',
      target: 'guide-1',
      strength: 0.8,
      type: 'direct',
      metadata: {
        connectionReason: 'Direct connection',
      },
    },
    {
      id: 'edge-2',
      source: 'guide-1',
      target: 'comrade-1',
      strength: 0.6,
      type: 'indirect',
      metadata: {
        connectionReason: 'Indirect connection',
      },
    },
    {
      id: 'edge-3',
      source: 'comrade-1',
      target: 'future-1',
      strength: 0.9,
      type: 'direct',
      metadata: {
        connectionReason: 'Strong connection',
      },
    },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    console.log('Node clicked:', nodeId);
  };

  const handleEdgeHover = (edgeId: string) => {
    console.log('Edge hovered:', edgeId);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-4xl font-bold text-white">
          Graph Canvas Test
        </h1>
        
        <div className="mb-4 rounded-lg bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">
              Selected Node: {selectedNodeId || 'None'}
            </p>
            {selectedNodeId && (
              <button
                onClick={() => setSelectedNodeId(undefined)}
                className="rounded bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        <GraphCanvas
          nodes={nodes}
          edges={edges}
          focusNodeId={selectedNodeId}
          selectedNodeId={selectedNodeId}
          onNodeClick={handleNodeClick}
          onEdgeHover={handleEdgeHover}
          searchState="idle"
          width={1200}
          height={600}
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Nodes</h2>
            <ul className="space-y-2">
              {nodes.map((node) => (
                <li
                  key={node.id}
                  className="flex items-center gap-3 text-sm text-slate-300"
                >
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{
                      backgroundColor:
                        node.type === 'user'
                          ? '#7dd3fc'
                          : node.type === 'future_self'
                            ? '#6ee7b7'
                            : node.type === 'comrade'
                              ? '#7dd3fc'
                              : '#fcd34d',
                    }}
                  />
                  <span>{node.label}</span>
                  <span className="text-slate-500">({node.type})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Edges</h2>
            <ul className="space-y-2">
              {edges.map((edge) => (
                <li key={edge.id} className="text-sm text-slate-300">
                  {edge.source} → {edge.target}
                  <span className="ml-2 text-slate-500">
                    (strength: {edge.strength})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

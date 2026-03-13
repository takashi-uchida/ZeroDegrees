'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Edge, Node } from '@/types/graph';
import { SearchState } from '@/types/search';
import { VisualizationMode } from '@/types/ui';
import ConstellationParticles from './ConstellationParticles';

interface SimulationNode extends d3.SimulationNodeDatum, Node {}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  id: string;
  source: string | SimulationNode;
  target: string | SimulationNode;
  strength: number;
  type: Edge['type'];
  metadata: Edge['metadata'];
}

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  focusNodeId?: string;
  selectedNodeId?: string;
  activePathNodeIds?: string[];
  activePathEdgeIds?: string[];
  hoveredEdgeId?: string;
  visualizationMode?: VisualizationMode;
  showDistanceMetrics?: boolean;
  onNodeClick?: (nodeId: string) => void;
  onEdgeHover?: (edgeId?: string) => void;
  searchState?: SearchState;
  width?: number;
  height?: number;
}

const NODE_COLORS = {
  user: '#7dd3fc',
  future_self: '#6ee7b7',
  comrade: '#38bdf8',
  guide: '#fcd34d',
};

const NODE_RADIUS = 10;
const CANVAS_THRESHOLD = 100;

function getHeatColor(distance: number, maxDistance: number) {
  const scale = d3
    .scaleLinear<string>()
    .domain([0, Math.max(1, maxDistance / 2), Math.max(1, maxDistance)])
    .range(['#7dd3fc', '#818cf8', '#fb7185']);

  return scale(distance);
}

function resolveLinkedNode(
  nodeRef: string | SimulationNode,
  nodes: SimulationNode[]
): SimulationNode | undefined {
  if (typeof nodeRef === 'string') {
    return nodes.find((graphNode) => graphNode.id === nodeRef);
  }

  return nodeRef;
}

function getLinkedNodeId(nodeRef: string | SimulationNode): string {
  return typeof nodeRef === 'string' ? nodeRef : nodeRef.id;
}

export default function GraphCanvas({
  nodes,
  edges,
  focusNodeId,
  selectedNodeId,
  activePathNodeIds = [],
  activePathEdgeIds = [],
  hoveredEdgeId,
  visualizationMode = 'concentric',
  showDistanceMetrics = true,
  onNodeClick,
  onEdgeHover,
  searchState = 'idle',
  width = 960,
  height = 720,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCanvas, setUseCanvas] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isMobile, setIsMobile] = useState(false);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<any, unknown> | null>(null);

  const pathNodeSet = new Set(activePathNodeIds);
  const pathEdgeSet = new Set(activePathEdgeIds);
  const maxDistance = Math.max(...nodes.map((node) => node.distance), 1);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleZoomIn = () => {
    if (!zoomBehaviorRef.current) return;
    const element = useCanvas ? canvasRef.current : svgRef.current;
    if (element) {
      d3.select(element).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (!zoomBehaviorRef.current) return;
    const element = useCanvas ? canvasRef.current : svgRef.current;
    if (element) {
      d3.select(element).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  };

  const handleResetView = () => {
    if (!zoomBehaviorRef.current) return;
    const element = useCanvas ? canvasRef.current : svgRef.current;
    if (element) {
      d3.select(element).transition().duration(500).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  const getNeighborIds = (nodeId: string) => {
    const neighbors = new Set<string>();
    edges.forEach((edge) => {
      if (edge.source === nodeId) {
        neighbors.add(edge.target);
      }
      if (edge.target === nodeId) {
        neighbors.add(edge.source);
      }
    });
    return neighbors;
  };

  const selectedNeighborSet = selectedNodeId ? getNeighborIds(selectedNodeId) : new Set<string>();

  const isNodeHighlighted = (nodeId: string) => {
    if (selectedNodeId) {
      return nodeId === selectedNodeId || selectedNeighborSet.has(nodeId);
    }

    return pathNodeSet.has(nodeId);
  };

  const isEdgeHighlighted = (edge: Pick<SimulationLink, 'id' | 'source' | 'target'>) => {
    if (hoveredEdgeId && edge.id === hoveredEdgeId) {
      return true;
    }

    if (selectedNodeId) {
      const sourceId = getLinkedNodeId(edge.source);
      const targetId = getLinkedNodeId(edge.target);
      const sourceActive =
        sourceId === selectedNodeId && selectedNeighborSet.has(targetId);
      const targetActive =
        targetId === selectedNodeId && selectedNeighborSet.has(sourceId);
      return sourceActive || targetActive;
    }

    return pathEdgeSet.has(edge.id);
  };

  const getNodeFill = (node: Node) => {
    if (visualizationMode === 'heatmap') {
      return getHeatColor(node.distance, maxDistance);
    }

    return NODE_COLORS[node.type];
  };

  useEffect(() => {
    setUseCanvas(nodes.length > CANVAS_THRESHOLD);
  }, [nodes.length]);

  useEffect(() => {
    if (!nodes.length) {
      return;
    }

    if (useCanvas && canvasRef.current) {
      const cleanup = renderCanvas();
      return cleanup;
    }

    if (!useCanvas && svgRef.current) {
      const cleanup = renderSvg();
      return cleanup;
    }
  }, [
    activePathEdgeIds.join(','),
    activePathNodeIds.join(','),
    edges,
    focusNodeId,
    height,
    hoveredEdgeId,
    nodes,
    searchState,
    selectedNodeId,
    showDistanceMetrics,
    useCanvas,
    visualizationMode,
    width,
  ]);

  const renderSvg = () => {
    if (!svgRef.current) return undefined;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodesCopy: SimulationNode[] = nodes.map((node) => ({ ...node }));
    const edgesCopy: SimulationLink[] = edges.map((edge) => ({ ...edge }));

    const layer = svg.append('g');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .translateExtent([
        [-480, -480],
        [width + 480, height + 480],
      ])
      .on('zoom', (event) => {
        layer.attr('transform', event.transform);
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
        });
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    if (transform.k !== 1 || transform.x !== 0 || transform.y !== 0) {
      svg.call(
        zoom.transform,
        d3.zoomIdentity.translate(transform.x, transform.y).scale(transform.k)
      );
    }

    const simulation = d3
      .forceSimulation<SimulationNode>(nodesCopy)
      .force(
        'link',
        d3
          .forceLink<SimulationNode, SimulationLink>(edgesCopy)
          .id((d) => d.id)
          .distance((edge) => {
            if (visualizationMode === 'concentric') {
              return 88 + edge.strength * 30;
            }

            return 84;
          })
          .strength((edge) => edge.strength)
      )
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    const ringLayer = layer.append('g');
    const rings = ringLayer
      .selectAll('circle')
      .data([1, 2, 3, 4])
      .enter()
      .append('circle')
      .attr('fill', 'none')
      .attr('stroke', (d) => d === 1 ? '#7dd3fc' : '#334155')
      .attr('stroke-opacity', (d) => visualizationMode === 'concentric' ? (d === 1 ? 0.6 : 0.45) : 0)
      .attr('stroke-dasharray', (d) => d === 1 ? '4 6' : '6 8')
      .attr('stroke-width', (d) => d === 1 ? 1.5 : 1)
      .attr('r', (distance) => 92 * distance)
      .style('filter', (d) => d === 1 ? 'drop-shadow(0 0 4px rgba(125, 211, 252, 0.3))' : 'none');

    const link = layer
      .append('g')
      .selectAll('line')
      .data(edgesCopy)
      .enter()
      .append('line')
      .attr('stroke', (edge) => {
        if (edge.id === hoveredEdgeId) return '#f8fafc';
        if (isEdgeHighlighted(edge)) return '#7dd3fc';
        return '#334155';
      })
      .attr('stroke-opacity', (edge) => {
        if (visualizationMode === 'path' && pathEdgeSet.size > 0) {
          return pathEdgeSet.has(edge.id) ? 1 : 0.12;
        }
        if (selectedNodeId || pathEdgeSet.size > 0) {
          return isEdgeHighlighted(edge) ? 0.95 : 0.2;
        }
        return 0.55;
      })
      .attr('stroke-width', (edge) => {
        if (isEdgeHighlighted(edge)) return Math.max(2.5, edge.strength * 4.5);
        return Math.max(1, edge.strength * 2.8);
      })
      .attr('stroke-dasharray', (edge) =>
        visualizationMode === 'path' && pathEdgeSet.has(edge.id) ? '0' : '0'
      )
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, edge) => onEdgeHover?.(edge.id))
      .on('mouseleave', () => onEdgeHover?.(undefined));

    const node = layer
      .append('g')
      .selectAll('g')
      .data(nodesCopy)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<any, any>()
          .on('start', (event, draggedNode) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            draggedNode.fx = draggedNode.x;
            draggedNode.fy = draggedNode.y;
          })
          .on('drag', (event, draggedNode) => {
            draggedNode.fx = event.x;
            draggedNode.fy = event.y;
          })
          .on('end', (event, draggedNode) => {
            if (!event.active) simulation.alphaTarget(0);
            draggedNode.fx = null;
            draggedNode.fy = null;
          })
      );

    node
      .append('circle')
      .attr('r', (graphNode) => {
        const baseRadius = isMobile ? NODE_RADIUS * 1.4 : NODE_RADIUS;
        if (graphNode.id === selectedNodeId) return baseRadius * 1.7;
        if (pathNodeSet.has(graphNode.id)) return baseRadius * 1.35;
        return baseRadius;
      })
      .attr('fill', (graphNode) => getNodeFill(graphNode))
      .attr('fill-opacity', (graphNode) => {
        if (selectedNodeId && !isNodeHighlighted(graphNode.id)) return 0.25;
        if (visualizationMode === 'path' && pathNodeSet.size > 0 && !pathNodeSet.has(graphNode.id)) {
          return 0.28;
        }
        return 1;
      })
      .attr('stroke', (graphNode) => {
        if (graphNode.id === selectedNodeId) return '#f8fafc';
        if (graphNode.id === focusNodeId) return '#7dd3fc';
        if (visualizationMode === 'heatmap') return NODE_COLORS[graphNode.type];
        return '#f8fafc';
      })
      .attr('stroke-width', (graphNode) => {
        if (graphNode.id === selectedNodeId) return 3;
        if (pathNodeSet.has(graphNode.id)) return 2.5;
        return 1.8;
      })
      .attr('filter', (graphNode) => {
        if (graphNode.id === selectedNodeId) {
          return 'drop-shadow(0 0 16px rgba(125, 211, 252, 0.9)) drop-shadow(0 0 4px rgba(125, 211, 252, 0.6))';
        }
        if (pathNodeSet.has(graphNode.id)) {
          return 'drop-shadow(0 0 12px rgba(110, 231, 183, 0.6)) drop-shadow(0 0 3px rgba(110, 231, 183, 0.4))';
        }
        if (graphNode.type === 'user') {
          return 'drop-shadow(0 0 10px rgba(125, 211, 252, 0.5))';
        }
        return 'drop-shadow(0 0 6px rgba(148, 163, 184, 0.3))';
      })
      .on('click', (event, graphNode) => {
        event.stopPropagation();
        onNodeClick?.(graphNode.id);
      });

    node
      .append('text')
      .text((graphNode) => graphNode.label)
      .attr('x', 0)
      .attr('y', 26)
      .attr('font-size', '11px')
      .attr('font-weight', 600)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('fill-opacity', (graphNode) => {
        if (selectedNodeId && !isNodeHighlighted(graphNode.id)) return 0.35;
        return 1;
      })
      .attr('pointer-events', 'none');

    if (showDistanceMetrics) {
      node
        .append('text')
        .text((graphNode) =>
          graphNode.id === 'user-1' ? 'You are here' : `${graphNode.distance} shifts`
        )
        .attr('x', 0)
        .attr('y', -18)
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('pointer-events', 'none');
    }

    simulation.on('tick', () => {
      const userNode = nodesCopy.find((graphNode) => graphNode.type === 'user') as
        | (Node & { x?: number; y?: number })
        | undefined;

      if (userNode?.x !== undefined && userNode?.y !== undefined) {
        rings
          .attr('cx', userNode.x)
          .attr('cy', userNode.y)
          .attr('stroke', (d) => d === 1 ? '#7dd3fc' : '#334155')
          .attr('stroke-opacity', (d) => visualizationMode === 'concentric' ? (d === 1 ? 0.6 : 0.45) : 0);
      }

      link
        .attr('x1', (edge) => resolveLinkedNode(edge.source, nodesCopy)?.x ?? 0)
        .attr('y1', (edge) => resolveLinkedNode(edge.source, nodesCopy)?.y ?? 0)
        .attr('x2', (edge) => resolveLinkedNode(edge.target, nodesCopy)?.x ?? 0)
        .attr('y2', (edge) => resolveLinkedNode(edge.target, nodesCopy)?.y ?? 0);

      node.attr('transform', (graphNode: SimulationNode) => `translate(${graphNode.x},${graphNode.y})`);
    });

    return () => {
      simulation.stop();
    };
  };

  const renderCanvas = () => {
    if (!canvasRef.current) return undefined;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    canvas.width = width;
    canvas.height = height;

    const nodesCopy: SimulationNode[] = nodes.map((node) => ({ ...node }));
    const edgesCopy: SimulationLink[] = edges.map((edge) => ({ ...edge }));

    const simulation = d3
      .forceSimulation<SimulationNode>(nodesCopy)
      .force(
        'link',
        d3
          .forceLink<SimulationNode, SimulationLink>(edgesCopy)
          .id((d) => d.id)
          .distance(82)
          .strength((edge) => edge.strength)
      )
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(28));

    const zoom = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.3, 4])
      .translateExtent([
        [-480, -480],
        [width + 480, height + 480],
      ])
      .on('zoom', (event) => {
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
        });
        render();
      });

    d3.select(canvas).call(zoom);
    zoomBehaviorRef.current = zoom;

    const render = () => {
      context.save();
      context.clearRect(0, 0, width, height);
      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);

      const userNode = nodesCopy.find((graphNode) => graphNode.type === 'user') as
        | (Node & { x?: number; y?: number })
        | undefined;
      if (
        visualizationMode === 'concentric' &&
        userNode?.x !== undefined &&
        userNode?.y !== undefined
      ) {
        [1, 2, 3, 4].forEach((distance) => {
          context.beginPath();
          context.setLineDash([6, 8]);
          context.strokeStyle = 'rgba(148, 163, 184, 0.35)';
          context.lineWidth = 1;
          context.arc(userNode.x ?? 0, userNode.y ?? 0, 92 * distance, 0, Math.PI * 2);
          context.stroke();
        });
        context.setLineDash([]);
      }

      edgesCopy.forEach((edge) => {
        const sourceNode = resolveLinkedNode(edge.source, nodesCopy);
        const targetNode = resolveLinkedNode(edge.target, nodesCopy);
        if (!sourceNode || !targetNode) {
          return;
        }

        context.beginPath();
        context.strokeStyle = isEdgeHighlighted(edge) ? '#7dd3fc' : '#334155';
        context.globalAlpha =
          visualizationMode === 'path' && pathEdgeSet.size > 0
            ? pathEdgeSet.has(edge.id)
              ? 1
              : 0.12
            : isEdgeHighlighted(edge)
              ? 0.95
              : 0.3;
        context.lineWidth = isEdgeHighlighted(edge)
          ? Math.max(2.5, edge.strength * 4.5)
          : Math.max(1, edge.strength * 2.6);
        context.moveTo(sourceNode.x ?? 0, sourceNode.y ?? 0);
        context.lineTo(targetNode.x ?? 0, targetNode.y ?? 0);
        context.stroke();
      });

      nodesCopy.forEach((graphNode: SimulationNode) => {
        const nodeX = graphNode.x ?? 0;
        const nodeY = graphNode.y ?? 0;
        const radius =
          graphNode.id === selectedNodeId
            ? NODE_RADIUS * 1.7
            : pathNodeSet.has(graphNode.id)
              ? NODE_RADIUS * 1.35
              : NODE_RADIUS;

        context.beginPath();
        context.fillStyle = getNodeFill(graphNode);
        context.globalAlpha =
          selectedNodeId && !isNodeHighlighted(graphNode.id)
            ? 0.25
            : visualizationMode === 'path' && pathNodeSet.size > 0 && !pathNodeSet.has(graphNode.id)
              ? 0.28
              : 1;
        context.arc(nodeX, nodeY, radius, 0, Math.PI * 2);
        context.fill();

        context.globalAlpha = 1;
        context.strokeStyle =
          visualizationMode === 'heatmap' ? NODE_COLORS[graphNode.type] : '#f8fafc';
        context.lineWidth = graphNode.id === selectedNodeId ? 3 : 2;
        context.stroke();

        context.fillStyle = '#e2e8f0';
        context.font = '600 11px sans-serif';
        context.textAlign = 'center';
        context.fillText(graphNode.label, nodeX, nodeY + 26);

        if (showDistanceMetrics) {
          context.fillStyle = '#94a3b8';
          context.font = '10px sans-serif';
          context.fillText(
            graphNode.id === 'user-1' ? 'You are here' : `${graphNode.distance} shifts`,
            nodeX,
            nodeY - 18
          );
        }
      });

      context.restore();
    };

    simulation.on('tick', render);

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - transform.x) / transform.k;
      const y = (event.clientY - rect.top - transform.y) / transform.k;

      const clickedNode = nodesCopy.find((graphNode: SimulationNode) => {
        const dx = x - (graphNode.x ?? 0);
        const dy = y - (graphNode.y ?? 0);
        return Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS * 1.8;
      });

      if (clickedNode) {
        onNodeClick?.(clickedNode.id);
      }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      simulation.stop();
      canvas.removeEventListener('click', handleClick);
    };
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#07111F] sm:rounded-[28px]"
      style={{ width, height }}
    >
      {/* Constellation background with stars */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.18), transparent 24%), radial-gradient(circle at 80% 12%, rgba(34, 197, 94, 0.14), transparent 20%), radial-gradient(1px 1px at 15% 35%, white, transparent), radial-gradient(1px 1px at 85% 65%, white, transparent), radial-gradient(1px 1px at 45% 80%, rgba(125, 211, 252, 0.8), transparent), radial-gradient(1px 1px at 70% 25%, rgba(110, 231, 183, 0.7), transparent), radial-gradient(2px 2px at 30% 60%, rgba(252, 211, 77, 0.6), transparent), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 28px 28px, 28px 28px',
        }}
      />

      {!useCanvas ? (
        <svg ref={svgRef} width={width} height={height} className="relative z-10" />
      ) : (
        <canvas ref={canvasRef} className="relative z-10" />
      )}

      {isMobile && (
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white backdrop-blur-sm transition hover:bg-slate-900/90"
            aria-label="Zoom in"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white backdrop-blur-sm transition hover:bg-slate-900/90"
            aria-label="Zoom out"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleResetView}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white backdrop-blur-sm transition hover:bg-slate-900/90"
            aria-label="Reset view"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}

      {searchState === 'searching' && (
        <>
          {/* Particle effects during search */}
          <ConstellationParticles count={12} />
          
          {/* Search status banner */}
          <div className="absolute inset-x-3 bottom-3 z-20 rounded-full border border-sky-300/20 bg-slate-950/80 px-4 py-2.5 backdrop-blur-sm sm:inset-x-6 sm:bottom-6 sm:px-5 sm:py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-300 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-300" />
                </span>
                <p className="text-xs font-medium text-slate-100 sm:text-sm">
                  Calculating your destined path through the constellation...
                </p>
              </div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 sm:text-xs">
                {visualizationMode}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Compass navigation indicator */}
      {focusNodeId && (
        <div className="absolute top-6 right-6 z-20 flex flex-col items-center gap-2">
          <div className="relative h-16 w-16 rounded-full border-2 border-sky-300/30 bg-slate-950/80 backdrop-blur-sm">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 40 40" className="animate-pulse">
                <circle cx="20" cy="20" r="2" fill="#7dd3fc" />
                <path d="M20 8 L20 12" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 28 L20 32" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 20 L12 20" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M28 20 L32 20" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                <text x="20" y="6" textAnchor="middle" fill="#7dd3fc" fontSize="8" fontWeight="600">N</text>
              </svg>
            </div>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-300">Navigate</p>
        </div>
      )}
    </div>
  );
}

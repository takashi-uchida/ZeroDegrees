'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Node, Edge } from '@/types/graph';

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  focusNodeId?: string;
  selectedNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
  onEdgeHover?: (edgeId: string) => void;
  searchState?: 'idle' | 'searching' | 'found';
  width?: number;
  height?: number;
}

// Node type colors based on design requirements
const NODE_COLORS = {
  user: '#7dd3fc', // sky-300
  future_self: '#6ee7b7', // emerald-300
  comrade: '#7dd3fc', // sky-300
  guide: '#fcd34d', // amber-300
};

const NODE_RADIUS = 8;
const CANVAS_THRESHOLD = 100; // Use canvas for >100 nodes

export default function GraphCanvas({
  nodes,
  edges,
  focusNodeId,
  selectedNodeId,
  onNodeClick,
  onEdgeHover,
  searchState = 'idle',
  width = 800,
  height = 600,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCanvas, setUseCanvas] = useState(false);
  
  // Zoom and pan state
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<any, any> | null>(null);

  // Calculate neighbor nodes for highlighting
  const getNeighborIds = (nodeId: string): Set<string> => {
    const neighbors = new Set<string>();
    edges.forEach(edge => {
      if (edge.source === nodeId || (typeof edge.source === 'object' && (edge.source as any).id === nodeId)) {
        const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
        neighbors.add(targetId);
      }
      if (edge.target === nodeId || (typeof edge.target === 'object' && (edge.target as any).id === nodeId)) {
        const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
        neighbors.add(sourceId);
      }
    });
    return neighbors;
  };

  // Get neighbor IDs for selected node
  const neighborIds = selectedNodeId ? getNeighborIds(selectedNodeId) : new Set<string>();

  // Check if a node should be highlighted
  const isHighlighted = (nodeId: string): boolean => {
    if (!selectedNodeId) return false;
    return nodeId === selectedNodeId || neighborIds.has(nodeId);
  };

  // Check if an edge should be highlighted
  const isEdgeHighlighted = (edge: Edge): boolean => {
    if (!selectedNodeId) return false;
    const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
    const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
    return (sourceId === selectedNodeId && neighborIds.has(targetId)) ||
           (targetId === selectedNodeId && neighborIds.has(sourceId));
  };

  useEffect(() => {
    // Determine rendering mode based on node count
    setUseCanvas(nodes.length > CANVAS_THRESHOLD);
  }, [nodes.length]);

  useEffect(() => {
    console.log('useEffect triggered', {
      containerRef: containerRef.current,
      svgRef: svgRef.current,
      canvasRef: canvasRef.current,
      nodesLength: nodes.length,
      useCanvas
    });

    if (nodes.length === 0) {
      console.log('No nodes to render');
      return;
    }

    if (!useCanvas && !svgRef.current) {
      console.log('SVG ref not ready');
      return;
    }

    if (useCanvas && !canvasRef.current) {
      console.log('Canvas ref not ready');
      return;
    }

    // Clear previous visualization
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll('*').remove();
    }

    if (useCanvas) {
      console.log('Calling renderCanvas');
      renderCanvas();
    } else {
      console.log('Calling renderSVG');
      renderSVG();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, focusNodeId, selectedNodeId, searchState, useCanvas, width, height, neighborIds]);

  const renderSVG = () => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.append('g');

    // Create copies of nodes and edges to avoid mutating props
    const nodesCopy = nodes.map(n => ({ ...n }));
    const edgesCopy = edges.map(e => ({ ...e }));

    console.log('Rendering SVG with', nodesCopy.length, 'nodes and', edgesCopy.length, 'edges');

    // Define zoom limits and pan boundaries
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3;
    const PAN_BOUNDARY = 500; // Prevent panning beyond this distance from center

    // Create zoom behavior with limits
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .translateExtent([
        [-PAN_BOUNDARY, -PAN_BOUNDARY],
        [width + PAN_BOUNDARY, height + PAN_BOUNDARY]
      ])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        // Persist zoom/pan state
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k
        });
      });

    // Apply zoom behavior to SVG
    svg.call(zoom);
    
    // Store zoom behavior reference for potential external control
    zoomBehaviorRef.current = zoom;

    // Restore previous transform state if it exists
    if (transform.k !== 1 || transform.x !== 0 || transform.y !== 0) {
      svg.call(zoom.transform, d3.zoomIdentity.translate(transform.x, transform.y).scale(transform.k));
    }

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodesCopy as any)
      .force(
        'link',
        d3
          .forceLink(edgesCopy)
          .id((d: any) => d.id)
          .distance(80)
          .strength((d: any) => d.strength)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(NODE_RADIUS + 5));

    // Render edges
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edgesCopy)
      .enter()
      .append('line')
      .attr('stroke', (d) => isEdgeHighlighted(d) ? '#7dd3fc' : '#334155')
      .attr('stroke-opacity', (d) => isEdgeHighlighted(d) ? 1 : (selectedNodeId ? 0.2 : 0.6))
      .attr('stroke-width', (d) => isEdgeHighlighted(d) ? Math.max(2, d.strength * 4) : Math.max(1, d.strength * 3))
      .on('mouseenter', function (event, d) {
        if (!selectedNodeId) {
          d3.select(this).attr('stroke-opacity', 1).attr('stroke', '#64748b');
        }
        if (onEdgeHover) onEdgeHover(d.id);
      })
      .on('mouseleave', function (event, d) {
        if (!selectedNodeId) {
          d3.select(this).attr('stroke-opacity', 0.6).attr('stroke', '#334155');
        }
      });

    // Render nodes
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodesCopy)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<any, any>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    // Node circles
    node
      .append('circle')
      .attr('r', (d) => {
        if (d.id === selectedNodeId) return NODE_RADIUS * 1.5;
        if (isHighlighted(d.id)) return NODE_RADIUS * 1.2;
        return NODE_RADIUS;
      })
      .attr('fill', (d) => NODE_COLORS[d.type])
      .attr('fill-opacity', (d) => {
        if (!selectedNodeId) return 1;
        return isHighlighted(d.id) ? 1 : 0.3;
      })
      .attr('stroke', (d) => {
        if (d.id === selectedNodeId) return '#7dd3fc';
        if (d.id === focusNodeId) return '#fff';
        return '#fff';
      })
      .attr('stroke-width', (d) => {
        if (d.id === selectedNodeId) return 3;
        return 2;
      })
      .attr('filter', (d) => {
        if (d.id === selectedNodeId) return 'drop-shadow(0 0 10px rgba(125, 211, 252, 0.8))';
        if (d.id === focusNodeId) return 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))';
        return 'none';
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        if (onNodeClick) onNodeClick(d.id);
      });

    // Node labels
    node
      .append('text')
      .text((d) => d.label)
      .attr('x', 0)
      .attr('y', (d) => {
        if (d.id === selectedNodeId) return NODE_RADIUS * 1.5 + 14;
        if (isHighlighted(d.id)) return NODE_RADIUS * 1.2 + 14;
        return NODE_RADIUS + 14;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#e2e8f0')
      .attr('fill-opacity', (d) => {
        if (!selectedNodeId) return 1;
        return isHighlighted(d.id) ? 1 : 0.4;
      })
      .attr('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  };

  const renderCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Create copies of nodes and edges to avoid mutating props
    const nodesCopy = nodes.map(n => ({ ...n }));
    const edgesCopy = edges.map(e => ({ ...e }));

    console.log('Rendering Canvas with', nodesCopy.length, 'nodes and', edgesCopy.length, 'edges');

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Define zoom limits and pan boundaries
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3;
    const PAN_BOUNDARY = 500;

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodesCopy as any)
      .force(
        'link',
        d3
          .forceLink(edgesCopy)
          .id((d: any) => d.id)
          .distance(80)
          .strength((d: any) => d.strength)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(NODE_RADIUS + 5));

    // Render function with transform applied
    const render = () => {
      context.save();
      context.clearRect(0, 0, width, height);
      
      // Apply transform
      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);

      // Draw edges
      edgesCopy.forEach((edge: any) => {
        const highlighted = isEdgeHighlighted(edge);
        context.beginPath();
        context.strokeStyle = highlighted ? '#7dd3fc' : '#334155';
        context.globalAlpha = highlighted ? 1 : (selectedNodeId ? 0.2 : 0.6);
        context.lineWidth = highlighted ? Math.max(2, edge.strength * 4) : Math.max(1, edge.strength * 3);
        context.moveTo(edge.source.x, edge.source.y);
        context.lineTo(edge.target.x, edge.target.y);
        context.stroke();
      });

      // Draw nodes
      context.globalAlpha = 1;
      nodesCopy.forEach((node: any) => {
        const highlighted = isHighlighted(node.id);
        const isSelected = node.id === selectedNodeId;
        const radius = isSelected ? NODE_RADIUS * 1.5 : (highlighted ? NODE_RADIUS * 1.2 : NODE_RADIUS);
        
        // Draw glow for selected node
        if (isSelected) {
          context.shadowColor = 'rgba(125, 211, 252, 0.8)';
          context.shadowBlur = 10;
        } else if (node.id === focusNodeId) {
          context.shadowColor = 'rgba(255, 255, 255, 0.6)';
          context.shadowBlur = 8;
        } else {
          context.shadowBlur = 0;
        }
        
        context.beginPath();
        context.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        context.fillStyle = NODE_COLORS[node.type as keyof typeof NODE_COLORS];
        context.globalAlpha = (!selectedNodeId || highlighted) ? 1 : 0.3;
        context.fill();
        
        // Reset shadow
        context.shadowBlur = 0;
        
        context.strokeStyle = isSelected ? '#7dd3fc' : '#fff';
        context.lineWidth = isSelected ? 3 : 2;
        context.globalAlpha = 1;
        context.stroke();

        // Draw label
        context.fillStyle = '#e2e8f0';
        context.globalAlpha = (!selectedNodeId || highlighted) ? 1 : 0.4;
        context.font = '10px sans-serif';
        context.textAlign = 'center';
        context.fillText(node.label, node.x, node.y + radius + 14);
      });
      
      context.restore();
    };

    // Update on simulation tick
    simulation.on('tick', render);

    // Create zoom behavior for canvas
    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .translateExtent([
        [-PAN_BOUNDARY, -PAN_BOUNDARY],
        [width + PAN_BOUNDARY, height + PAN_BOUNDARY]
      ])
      .on('zoom', (event) => {
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k
        });
        render();
      });

    // Apply zoom behavior to canvas
    d3.select(canvas).call(zoom);
    
    // Store zoom behavior reference
    zoomBehaviorRef.current = zoom;

    // Restore previous transform state
    if (transform.k !== 1 || transform.x !== 0 || transform.y !== 0) {
      d3.select(canvas).call(zoom.transform, d3.zoomIdentity.translate(transform.x, transform.y).scale(transform.k));
    }

    // Handle canvas interactions with transform
    const handleCanvasClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Apply inverse transform to get actual coordinates
      const x = (event.clientX - rect.left - transform.x) / transform.k;
      const y = (event.clientY - rect.top - transform.y) / transform.k;

      // Find clicked node
      const clickedNode = nodesCopy.find((node: any) => {
        const dx = x - node.x;
        const dy = y - node.y;
        return Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS;
      });

      if (clickedNode && onNodeClick) {
        onNodeClick(clickedNode.id);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    // Cleanup
    return () => {
      simulation.stop();
      canvas.removeEventListener('click', handleCanvasClick);
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#07111F]"
      style={{ width, height }}
    >
      {/* Debug info */}
      <div className="absolute left-4 top-4 z-10 rounded bg-black/50 p-2 text-xs text-white">
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {edges.length}</div>
        <div>Mode: {useCanvas ? 'Canvas' : 'SVG'}</div>
        <div>Container: {containerRef.current ? 'OK' : 'NULL'}</div>
        <div>SVG Ref: {svgRef.current ? 'OK' : 'NULL'}</div>
      </div>
      
      {!useCanvas ? (
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="graph-canvas"
        />
      ) : (
        <canvas
          ref={canvasRef}
          className="graph-canvas"
        />
      )}
      
      {searchState === 'searching' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-sky-300 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-300">Exploring connections...</p>
          </div>
        </div>
      )}
    </div>
  );
}

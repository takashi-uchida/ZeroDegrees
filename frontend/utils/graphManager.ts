/**
 * Graph data structure manager
 */

import { Node, Edge, GraphData, Path } from '@/types/graph';

export class GraphManager {
  private data: GraphData;

  constructor(userNodeId: string) {
    this.data = {
      nodes: new Map(),
      edges: new Map(),
      adjacencyList: new Map(),
      userNodeId,
    };
  }

  addNode(node: Node): void {
    this.data.nodes.set(node.id, node);
    if (!this.data.adjacencyList.has(node.id)) {
      this.data.adjacencyList.set(node.id, []);
    }
  }

  addEdge(edge: Edge): void {
    this.data.edges.set(edge.id, edge);
    
    // Update adjacency list
    const sourceNeighbors = this.data.adjacencyList.get(edge.source) || [];
    if (!sourceNeighbors.includes(edge.target)) {
      sourceNeighbors.push(edge.target);
      this.data.adjacencyList.set(edge.source, sourceNeighbors);
    }

    const targetNeighbors = this.data.adjacencyList.get(edge.target) || [];
    if (!targetNeighbors.includes(edge.source)) {
      targetNeighbors.push(edge.source);
      this.data.adjacencyList.set(edge.target, targetNeighbors);
    }
  }

  removeNode(nodeId: string): void {
    this.data.nodes.delete(nodeId);
    this.data.adjacencyList.delete(nodeId);

    // Remove edges connected to this node
    const edgesToRemove: string[] = [];
    this.data.edges.forEach((edge, edgeId) => {
      if (edge.source === nodeId || edge.target === nodeId) {
        edgesToRemove.push(edgeId);
      }
    });
    edgesToRemove.forEach((edgeId) => this.data.edges.delete(edgeId));

    // Update adjacency lists
    this.data.adjacencyList.forEach((neighbors, id) => {
      const filtered = neighbors.filter((n) => n !== nodeId);
      this.data.adjacencyList.set(id, filtered);
    });
  }

  removeEdge(edgeId: string): void {
    const edge = this.data.edges.get(edgeId);
    if (!edge) return;

    this.data.edges.delete(edgeId);

    // Update adjacency list
    const sourceNeighbors = this.data.adjacencyList.get(edge.source) || [];
    this.data.adjacencyList.set(
      edge.source,
      sourceNeighbors.filter((n) => n !== edge.target)
    );

    const targetNeighbors = this.data.adjacencyList.get(edge.target) || [];
    this.data.adjacencyList.set(
      edge.target,
      targetNeighbors.filter((n) => n !== edge.source)
    );
  }

  findShortestPath(sourceId: string, targetId: string): string[] {
    // Dijkstra's algorithm implementation
    // Using edge strength as weight (lower strength = higher cost)
    // Cost = 1 / strength (to prefer stronger connections)
    
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    // Initialize distances
    this.data.nodes.forEach((_, nodeId) => {
      distances.set(nodeId, nodeId === sourceId ? 0 : Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    });

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let currentNode: string | null = null;
      let minDistance = Infinity;
      
      unvisited.forEach((nodeId) => {
        const distance = distances.get(nodeId) || Infinity;
        if (distance < minDistance) {
          minDistance = distance;
          currentNode = nodeId;
        }
      });

      if (currentNode === null || minDistance === Infinity) {
        break; // No path exists
      }

      unvisited.delete(currentNode);

      // If we reached the target, reconstruct path
      if (currentNode === targetId) {
        const path: string[] = [];
        let current: string | null = targetId;
        
        while (current !== null) {
          path.unshift(current);
          current = previous.get(current) || null;
        }
        
        return path;
      }

      // Update distances to neighbors
      const neighbors = this.data.adjacencyList.get(currentNode) || [];
      const currentDistance = distances.get(currentNode);
      
      if (currentDistance === undefined) continue;

      for (const neighborId of neighbors) {
        if (!unvisited.has(neighborId)) continue;

        // Find edge between current and neighbor
        const edge = this.findEdgeBetween(currentNode, neighborId);
        const edgeCost = edge ? (1 / Math.max(edge.strength, 0.01)) : 1;
        
        const newDistance = currentDistance + edgeCost;
        const neighborDistance = distances.get(neighborId) || Infinity;

        if (newDistance < neighborDistance) {
          distances.set(neighborId, newDistance);
          previous.set(neighborId, currentNode);
        }
      }
    }

    return []; // No path found
  }

  private findEdgeBetween(nodeId1: string, nodeId2: string): Edge | undefined {
    for (const edge of this.data.edges.values()) {
      if (
        (edge.source === nodeId1 && edge.target === nodeId2) ||
        (edge.source === nodeId2 && edge.target === nodeId1)
      ) {
        return edge;
      }
    }
    return undefined;
  }

  getNeighbors(nodeId: string): Node[] {
    const neighborIds = this.data.adjacencyList.get(nodeId) || [];
    return neighborIds
      .map((id) => this.data.nodes.get(id))
      .filter((node): node is Node => node !== undefined);
  }

  calculateDistance(sourceId: string, targetId: string): number {
    const path = this.findShortestPath(sourceId, targetId);
    return path.length > 0 ? path.length - 1 : -1;
  }

  getSubgraph(centerNodeId: string, radius: number): GraphData {
    const subgraph: GraphData = {
      nodes: new Map(),
      edges: new Map(),
      adjacencyList: new Map(),
      userNodeId: this.data.userNodeId,
    };

    // BFS to find nodes within radius
    const queue: Array<{ id: string; distance: number }> = [{ id: centerNodeId, distance: 0 }];
    const visited = new Set<string>([centerNodeId]);

    while (queue.length > 0) {
      const { id, distance } = queue.shift()!;
      const node = this.data.nodes.get(id);
      if (node) {
        subgraph.nodes.set(id, node);
      }

      if (distance < radius) {
        const neighbors = this.data.adjacencyList.get(id) || [];
        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push({ id: neighborId, distance: distance + 1 });
          }
        }
      }
    }

    // Add edges between nodes in subgraph
    this.data.edges.forEach((edge, edgeId) => {
      if (subgraph.nodes.has(edge.source) && subgraph.nodes.has(edge.target)) {
        subgraph.edges.set(edgeId, edge);
        
        const sourceNeighbors = subgraph.adjacencyList.get(edge.source) || [];
        sourceNeighbors.push(edge.target);
        subgraph.adjacencyList.set(edge.source, sourceNeighbors);

        const targetNeighbors = subgraph.adjacencyList.get(edge.target) || [];
        targetNeighbors.push(edge.source);
        subgraph.adjacencyList.set(edge.target, targetNeighbors);
      }
    });

    return subgraph;
  }

  getData(): GraphData {
    return this.data;
  }

  getNode(nodeId: string): Node | undefined {
    return this.data.nodes.get(nodeId);
  }

  getEdge(edgeId: string): Edge | undefined {
    return this.data.edges.get(edgeId);
  }

  getAllNodes(): Node[] {
    return Array.from(this.data.nodes.values());
  }

  getAllEdges(): Edge[] {
    return Array.from(this.data.edges.values());
  }
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { NodeMetrics, TimeSeriesPoint } from "@/lib/types";
import {
  generateMockNodes,
  generateTimeSeries,
  batchUpdateNodes,
  NetworkIssueConfig,
  DEFAULT_NETWORK_ISSUES,
} from "@/lib/mock-data";
import { nodeDiscovery, NodeConnection } from "@/lib/node-client";

export type DataMode = "simulation" | "live";

interface UseNodesOptions {
  mode: DataMode;
  simulatedNodeCount?: number;
  pollingIntervalMs?: number;
  timeSeriesPoints?: number;
  cellsPerNode?: number;
  networkIssues?: NetworkIssueConfig;
}

interface UseNodesReturn {
  nodes: NodeMetrics[];
  timeSeries: TimeSeriesPoint[];
  connections: NodeConnection[];
  isLoading: boolean;
  error: string | null;
  addEndpoint: (endpoint: string) => void;
  removeEndpoint: (endpoint: string) => void;
  refresh: () => Promise<void>;
  setNodeCount: (count: number) => void;
  setNetworkIssues: (config: NetworkIssueConfig) => void;
  networkIssues: NetworkIssueConfig;
}

export function useNodes({
  mode,
  simulatedNodeCount = 50,
  pollingIntervalMs = 500,
  timeSeriesPoints = 60,
  cellsPerNode = 16,
  networkIssues: initialNetworkIssues = DEFAULT_NETWORK_ISSUES,
}: UseNodesOptions): UseNodesReturn {
  const [nodes, setNodes] = useState<NodeMetrics[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(simulatedNodeCount);
  const [networkIssues, setNetworkIssues] =
    useState<NetworkIssueConfig>(initialNetworkIssues);

  const nodesRef = useRef<NodeMetrics[]>([]);
  const timeSeriesRef = useRef<TimeSeriesPoint[]>([]);

  const updateTimeSeries = useCallback(
    (currentNodes: NodeMetrics[]) => {
      const healthyNodes = currentNodes.filter((n) => n.status !== "offline");
      const totalThroughput = healthyNodes.reduce(
        (s, n) => s + n.throughput,
        0,
      );
      const avgP50 =
        healthyNodes.length > 0
          ? healthyNodes.reduce((s, n) => s + n.latency.p50, 0) /
            healthyNodes.length
          : 0;
      const avgP99 =
        healthyNodes.length > 0
          ? healthyNodes.reduce((s, n) => s + n.latency.p99, 0) /
            healthyNodes.length
          : 0;
      const totalWorkers = healthyNodes.reduce(
        (s, n) => s + n.workers.active,
        0,
      );

      const newPoint: TimeSeriesPoint = {
        timestamp: Date.now(),
        throughput: totalThroughput,
        latencyP50: avgP50,
        latencyP99: avgP99,
        activeWorkers: totalWorkers,
      };

      timeSeriesRef.current = [
        ...timeSeriesRef.current.slice(-(timeSeriesPoints - 1)),
        newPoint,
      ];
      setTimeSeries(timeSeriesRef.current);
    },
    [timeSeriesPoints],
  );

  useEffect(() => {
    if (mode !== "simulation") return;

    const initialNodes = generateMockNodes(nodeCount, cellsPerNode);
    nodesRef.current = initialNodes;
    setNodes(initialNodes);
    setTimeSeries(generateTimeSeries(timeSeriesPoints));
    setIsLoading(false);
    setError(null);

    const interval = setInterval(() => {
      nodesRef.current = batchUpdateNodes(nodesRef.current, networkIssues);
      setNodes(nodesRef.current);
      updateTimeSeries(nodesRef.current);
    }, pollingIntervalMs);

    return () => clearInterval(interval);
  }, [
    mode,
    nodeCount,
    pollingIntervalMs,
    timeSeriesPoints,
    cellsPerNode,
    networkIssues,
    updateTimeSeries,
  ]);

  useEffect(() => {
    if (mode !== "live") return;

    setNodes([]);
    nodesRef.current = [];
    timeSeriesRef.current = [];
    setIsLoading(true);
    setTimeSeries([]);
    setError(null);

    nodeDiscovery.startPolling(pollingIntervalMs, (discoveredNodes) => {
      setNodes(discoveredNodes);
      setConnections(nodeDiscovery.getConnections());
      updateTimeSeries(discoveredNodes);
      setIsLoading(false);

      if (discoveredNodes.length === 0) {
        setError("No nodes discovered. Check if nodes are running.");
      } else {
        setError(null);
      }
    });

    return () => {
      nodeDiscovery.stopPolling();
    };
  }, [mode, pollingIntervalMs, updateTimeSeries]);

  const addEndpoint = useCallback((endpoint: string) => {
    nodeDiscovery.addEndpoint(endpoint);
  }, []);

  const removeEndpoint = useCallback((endpoint: string) => {
    nodeDiscovery.removeEndpoint(endpoint);
    setConnections(nodeDiscovery.getConnections());
  }, []);

  const refresh = useCallback(async () => {
    if (mode === "live") {
      setIsLoading(true);
      const discoveredNodes = await nodeDiscovery.discoverNodes();
      setNodes(discoveredNodes);
      setConnections(nodeDiscovery.getConnections());
      setIsLoading(false);
    }
  }, [mode]);

  const handleSetNodeCount = useCallback((count: number) => {
    setNodeCount(count);
  }, []);

  return {
    nodes,
    timeSeries,
    connections,
    isLoading,
    error,
    addEndpoint,
    removeEndpoint,
    refresh,
    setNodeCount: handleSetNodeCount,
    setNetworkIssues,
    networkIssues,
  };
}

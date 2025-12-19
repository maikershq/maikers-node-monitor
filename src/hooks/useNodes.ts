"use client";

import { useState, useEffect, useCallback } from "react";
import type { NodeMetrics, TimeSeriesPoint } from "@/lib/types";
import {
  generateMockNodes,
  generateTimeSeries,
  updateNodeMetrics,
} from "@/lib/mock-data";
import { nodeDiscovery, NodeConnection } from "@/lib/node-client";

export type DataMode = "simulation" | "live";

interface UseNodesOptions {
  mode: DataMode;
  simulatedNodeCount?: number;
  pollingIntervalMs?: number;
  timeSeriesPoints?: number;
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
}

export function useNodes({
  mode,
  simulatedNodeCount = 6,
  pollingIntervalMs = 1000,
  timeSeriesPoints = 60,
}: UseNodesOptions): UseNodesReturn {
  const [nodes, setNodes] = useState<NodeMetrics[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateTimeSeries = useCallback(
    (currentNodes: NodeMetrics[]) => {
      setTimeSeries((prev) => {
        const totalThroughput = currentNodes.reduce(
          (s, n) => s + n.throughput,
          0,
        );
        const avgP50 =
          currentNodes.length > 0
            ? currentNodes.reduce((s, n) => s + n.latency.p50, 0) /
              currentNodes.length
            : 0;
        const avgP99 =
          currentNodes.length > 0
            ? currentNodes.reduce((s, n) => s + n.latency.p99, 0) /
              currentNodes.length
            : 0;
        const totalWorkers = currentNodes.reduce(
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

        const updated = [...prev, newPoint];
        return updated.slice(-timeSeriesPoints);
      });
    },
    [timeSeriesPoints],
  );

  // Simulation mode
  useEffect(() => {
    if (mode !== "simulation") return;

    setNodes(generateMockNodes(simulatedNodeCount));
    setTimeSeries(generateTimeSeries(timeSeriesPoints));
    setIsLoading(false);
    setError(null);

    const interval = setInterval(() => {
      setNodes((prev) => {
        const updated = prev.map(updateNodeMetrics);
        updateTimeSeries(updated);
        return updated;
      });
    }, pollingIntervalMs);

    return () => clearInterval(interval);
  }, [
    mode,
    simulatedNodeCount,
    pollingIntervalMs,
    timeSeriesPoints,
    updateTimeSeries,
  ]);

  // Live mode
  useEffect(() => {
    if (mode !== "live") return;

    setIsLoading(true);
    setTimeSeries(generateTimeSeries(0));

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

  return {
    nodes,
    timeSeries,
    connections,
    isLoading,
    error,
    addEndpoint,
    removeEndpoint,
    refresh,
  };
}

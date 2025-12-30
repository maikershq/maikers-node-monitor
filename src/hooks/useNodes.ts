"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { NodeMetrics, TimeSeriesPoint } from "@/lib/types";
import { nodeDiscovery, NodeConnection } from "@/lib/node-client";
import { config, NetworkId } from "@/lib/config";

function getNetworkFromUrl(): NetworkId {
  if (typeof window === "undefined") return config.defaultNetwork;
  const params = new URLSearchParams(window.location.search);
  const network = params.get("network");
  if (network && network in config.networks) {
    return network as NetworkId;
  }
  return config.defaultNetwork;
}

function updateUrlNetwork(networkId: NetworkId) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (networkId === config.defaultNetwork) {
    url.searchParams.delete("network");
  } else {
    url.searchParams.set("network", networkId);
  }
  window.history.replaceState({}, "", url.toString());
}

interface UseNodesOptions {
  pollingIntervalMs?: number;
  registryScanIntervalMs?: number;
  timeSeriesPoints?: number;
}

interface UseNodesReturn {
  nodes: NodeMetrics[];
  timeSeries: TimeSeriesPoint[];
  connections: NodeConnection[];
  isLoading: boolean;
  error: string | null;
  currentNetwork: NetworkId;
  setNetwork: (networkId: NetworkId) => void;
  addEndpoint: (endpoint: string) => void;
  removeEndpoint: (endpoint: string) => void;
  removeOfflineNodes: () => number;
  scanRegistry: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNodes({
  pollingIntervalMs = 500,
  registryScanIntervalMs = 60000,
  timeSeriesPoints = 60,
}: UseNodesOptions = {}): UseNodesReturn {
  const [nodes, setNodes] = useState<NodeMetrics[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkId>(
    config.defaultNetwork,
  );

  const timeSeriesRef = useRef<TimeSeriesPoint[]>([]);
  const initializedRef = useRef(false);

  // Initialize network from URL on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const urlNetwork = getNetworkFromUrl();
    if (urlNetwork !== config.defaultNetwork) {
      setCurrentNetwork(urlNetwork);
      nodeDiscovery.setRegistryUrl(config.networks[urlNetwork].registryUrl);
    }
  }, []);

  const setNetwork = useCallback((networkId: NetworkId) => {
    const network = config.networks[networkId];
    if (network) {
      setCurrentNetwork(networkId);
      nodeDiscovery.setRegistryUrl(network.registryUrl);
      updateUrlNetwork(networkId);
      // Reset time series on network switch
      timeSeriesRef.current = [];
      setTimeSeries([]);
    }
  }, []);

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
    // Only show loading if we don't have data yet
    if (timeSeriesRef.current.length === 0) {
      setIsLoading(true);
    }
    setError(null);

    // Start polling
    nodeDiscovery.startPolling(
      pollingIntervalMs,
      (discoveredNodes) => {
        setNodes(discoveredNodes);
        setConnections(nodeDiscovery.getConnections());
        updateTimeSeries(discoveredNodes);
        setIsLoading(false);

        if (discoveredNodes.length === 0) {
          setError("No nodes discovered. Check if nodes are running.");
        } else {
          setError(null);
        }
      },
      registryScanIntervalMs,
    );

    return () => {
      nodeDiscovery.stopPolling();
    };
  }, [pollingIntervalMs, registryScanIntervalMs, updateTimeSeries]);

  const addEndpoint = useCallback((endpoint: string) => {
    nodeDiscovery.addEndpoint(endpoint);
  }, []);

  const removeEndpoint = useCallback((endpoint: string) => {
    nodeDiscovery.removeEndpoint(endpoint);
    setConnections(nodeDiscovery.getConnections());
  }, []);

  const removeOfflineNodes = useCallback(() => {
    const removed = nodeDiscovery.removeOfflineNodes();
    setConnections(nodeDiscovery.getConnections());
    return removed;
  }, []);

  const scanRegistry = useCallback(async () => {
    await nodeDiscovery.scanForNodes();
    setConnections(nodeDiscovery.getConnections());
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const discoveredNodes = await nodeDiscovery.discoverNodes();
    setNodes(discoveredNodes);
    setConnections(nodeDiscovery.getConnections());
    setIsLoading(false);
  }, []);

  return {
    nodes,
    timeSeries,
    connections,
    isLoading,
    error,
    currentNetwork,
    setNetwork,
    addEndpoint,
    removeEndpoint,
    removeOfflineNodes,
    scanRegistry,
    refresh,
  };
}

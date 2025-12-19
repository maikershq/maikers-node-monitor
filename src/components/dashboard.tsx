"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MetricCard } from "./metric-card";
import { VirtualizedNodeGrid } from "./virtualized-node-grid";
import { LatencyChart } from "./latency-chart";
import { ThroughputChart } from "./throughput-chart";
import { ModeToggle } from "./mode-toggle";
import { EndpointManager } from "./endpoint-manager";
import { useNodes, DataMode } from "@/hooks/useNodes";
import { formatNumber, formatLatency } from "@/lib/utils";
import type { NetworkStats } from "@/lib/types";
import {
  Activity,
  Cpu,
  Clock,
  ShieldCheck,
  Zap,
  Server,
  AlertCircle,
  Loader2,
  Settings,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react";

export function Dashboard() {
  const [mode, setMode] = useState<DataMode>("live");
  const [showSettings, setShowSettings] = useState(false);
  const [nodeCount, setNodeCountState] = useState(50);

  const {
    nodes,
    timeSeries,
    connections,
    isLoading,
    error,
    addEndpoint,
    removeEndpoint,
    setNodeCount,
    networkIssues,
    setNetworkIssues,
  } = useNodes({
    mode,
    simulatedNodeCount: nodeCount,
    pollingIntervalMs: 500,
    timeSeriesPoints: 60,
    cellsPerNode: 16,
  });

  const stats = useMemo<NetworkStats>(() => {
    if (nodes.length === 0)
      return {
        totalNodes: 0,
        activeNodes: 0,
        totalThroughput: 0,
        avgLatencyP99: 0,
        totalCells: 0,
        attestedNodes: 0,
      };

    const healthyNodes = nodes.filter((n) => n.status !== "offline");
    const totalThroughput = healthyNodes.reduce((s, n) => s + n.throughput, 0);
    const avgLatencyP99 =
      healthyNodes.length > 0
        ? healthyNodes.reduce((s, n) => s + n.latency.p99, 0) /
          healthyNodes.length
        : 0;
    const attestedNodes = nodes.filter((n) => n.teeAttested).length;
    const totalCells = nodes.reduce((s, n) => s + n.cells.length, 0);

    return {
      totalNodes: nodes.length,
      activeNodes: healthyNodes.length,
      totalThroughput,
      avgLatencyP99,
      totalCells,
      attestedNodes,
    };
  }, [nodes]);

  const networkStatusCounts = useMemo(() => {
    const healthy = nodes.filter((n) => n.status === "healthy").length;
    const degraded = nodes.filter((n) => n.status === "degraded").length;
    const offline = nodes.filter((n) => n.status === "offline").length;
    return { healthy, degraded, offline };
  }, [nodes]);

  const handleNodeCountChange = (value: number) => {
    setNodeCountState(value);
    setNodeCount(value);
  };

  return (
    <div className="min-h-screen bg-[#111111] bg-pattern text-white p-4 md:p-6">
      <header className="flex items-center justify-between mb-8 animate-in">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              mode === "live"
                ? isLoading
                  ? "bg-amber-400 animate-pulse"
                  : error
                    ? "bg-red-400"
                    : "bg-cyan-400 animate-pulse"
                : "bg-amber-400"
            }`}
          />
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold">
              Cellular Stigmergy Monitor
            </h1>
            <p className="text-xs text-zinc-500">
              {mode === "live"
                ? "Live network discovery"
                : `Simulation: ${nodes.length} nodes`}
              {mode === "live" &&
                nodes.length > 0 &&
                ` • ${nodes.length} nodes`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle mode={mode} onChange={setMode} />
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="text-xs text-zinc-600 font-mono tabular-nums">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      {showSettings && (
        <Card className="monitor-card mb-6 animate-in">
          <CardContent className="p-4 space-y-4">
            {mode === "live" && (
              <EndpointManager
                connections={connections}
                onAdd={addEndpoint}
                onRemove={removeEndpoint}
              />
            )}

            {mode === "simulation" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">
                    Node Count:{" "}
                    <span className="text-cyan-400 font-mono">{nodeCount}</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="2000"
                    step="50"
                    value={nodeCount}
                    onChange={(e) =>
                      handleNodeCountChange(Number(e.target.value))
                    }
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                    <span>10</span>
                    <span>500</span>
                    <span>1000</span>
                    <span>2000</span>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-zinc-400">
                      Network Issues Simulation
                    </span>
                    <button
                      onClick={() =>
                        setNetworkIssues({
                          ...networkIssues,
                          enabled: !networkIssues.enabled,
                        })
                      }
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        networkIssues.enabled
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {networkIssues.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  {networkIssues.enabled && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-zinc-500 block mb-1">
                          Offline Chance
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={networkIssues.offlineChance * 100}
                          onChange={(e) =>
                            setNetworkIssues({
                              ...networkIssues,
                              offlineChance: Number(e.target.value) / 100,
                            })
                          }
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-400"
                        />
                        <span className="text-red-400 font-mono">
                          {Math.round(networkIssues.offlineChance * 100)}%
                        </span>
                      </div>
                      <div>
                        <label className="text-zinc-500 block mb-1">
                          Degraded Chance
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={networkIssues.degradedChance * 100}
                          onChange={(e) =>
                            setNetworkIssues({
                              ...networkIssues,
                              degradedChance: Number(e.target.value) / 100,
                            })
                          }
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                        />
                        <span className="text-amber-400 font-mono">
                          {Math.round(networkIssues.degradedChance * 100)}%
                        </span>
                      </div>
                      <div>
                        <label className="text-zinc-500 block mb-1">
                          Latency Spike
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={networkIssues.latencySpikeChance * 100}
                          onChange={(e) =>
                            setNetworkIssues({
                              ...networkIssues,
                              latencySpikeChance: Number(e.target.value) / 100,
                            })
                          }
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                        />
                        <span className="text-purple-400 font-mono">
                          {Math.round(networkIssues.latencySpikeChance * 100)}%
                        </span>
                      </div>
                      <div>
                        <label className="text-zinc-500 block mb-1">
                          Packet Loss
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={networkIssues.packetLossChance * 100}
                          onChange={(e) =>
                            setNetworkIssues({
                              ...networkIssues,
                              packetLossChance: Number(e.target.value) / 100,
                            })
                          }
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-400"
                        />
                        <span className="text-orange-400 font-mono">
                          {Math.round(networkIssues.packetLossChance * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {mode === "live" && error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 animate-in">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-400 font-medium">{error}</p>
            <p className="text-xs text-red-400/70 mt-0.5">
              Make sure nodes are running with HTTP metrics enabled on port 8080
            </p>
          </div>
        </div>
      )}

      {isLoading && nodes.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-zinc-500">
              {mode === "live"
                ? "Discovering nodes..."
                : "Initializing simulation..."}
            </p>
          </div>
        </div>
      )}

      {nodes.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 animate-in">
            <MetricCard
              label="Nodes"
              value={stats.totalNodes}
              subValue={`${stats.attestedNodes} attested`}
              icon={<Server className="w-5 h-5" />}
            />
            <MetricCard
              label="Throughput"
              value={formatNumber(stats.totalThroughput)}
              subValue="ops/s"
              trend="up"
              icon={<Zap className="w-5 h-5" />}
            />
            <MetricCard
              label="Latency P99"
              value={formatLatency(stats.avgLatencyP99)}
              icon={<Clock className="w-5 h-5" />}
            />
            <MetricCard
              label="Cells"
              value={formatNumber(stats.totalCells)}
              subValue="shards"
              icon={<Cpu className="w-5 h-5" />}
            />
            <MetricCard
              label="TEE Attested"
              value={`${Math.round((stats.attestedNodes / stats.totalNodes) * 100 || 0)}%`}
              icon={<ShieldCheck className="w-5 h-5" />}
            />
            <MetricCard
              label="Active"
              value={stats.activeNodes}
              subValue="nodes online"
              icon={<Activity className="w-5 h-5" />}
            />
          </div>

          {mode === "simulation" && networkIssues.enabled && (
            <div className="grid grid-cols-3 gap-3 mb-6 animate-in">
              <div className="flex items-center gap-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <Wifi className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-zinc-400">Healthy</span>
                <span className="ml-auto text-lg font-bold text-cyan-400 tabular-nums">
                  {networkStatusCounts.healthy}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-zinc-400">Degraded</span>
                <span className="ml-auto text-lg font-bold text-amber-400 tabular-nums">
                  {networkStatusCounts.degraded}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-sm text-zinc-400">Offline</span>
                <span className="ml-auto text-lg font-bold text-red-400 tabular-nums">
                  {networkStatusCounts.offline}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 animate-in">
            <Card className="monitor-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Throughput
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-48">
                  <ThroughputChart data={timeSeries} />
                </div>
              </CardContent>
            </Card>

            <Card className="monitor-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4 text-teal-400" />
                  Latency Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-48">
                  <LatencyChart data={timeSeries} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="animate-in">
            <h2 className="text-sm font-heading font-semibold text-zinc-400 mb-4 flex items-center gap-2">
              <Server className="w-4 h-4" />
              {mode === "live" ? "Discovered Nodes" : "Simulated Nodes"}
              <span className="text-zinc-600 font-normal">
                ({nodes.length})
              </span>
            </h2>
            <VirtualizedNodeGrid nodes={nodes} />
          </div>
        </>
      )}

      {mode === "live" && !isLoading && nodes.length === 0 && !error && (
        <div className="text-center py-20">
          <Server className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-zinc-400 mb-2">
            No Nodes Discovered
          </h3>
          <p className="text-sm text-zinc-600 max-w-md mx-auto">
            Start some nodes or add their endpoints in the settings panel to
            begin monitoring.
          </p>
        </div>
      )}
    </div>
  );
}

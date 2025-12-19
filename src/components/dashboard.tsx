"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MetricCard } from "./metric-card";
import { NodeCard } from "./node-card";
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
} from "lucide-react";

export function Dashboard() {
  const [mode, setMode] = useState<DataMode>("simulation");
  const [showSettings, setShowSettings] = useState(false);

  const {
    nodes,
    timeSeries,
    connections,
    isLoading,
    error,
    addEndpoint,
    removeEndpoint,
  } = useNodes({
    mode,
    simulatedNodeCount: 6,
    pollingIntervalMs: 1000,
    timeSeriesPoints: 60,
  });

  const [stats, setStats] = useState<NetworkStats>({
    totalNodes: 0,
    activeNodes: 0,
    totalThroughput: 0,
    avgLatencyP99: 0,
    totalCells: 0,
    attestedNodes: 0,
  });

  useEffect(() => {
    if (nodes.length === 0) return;

    const totalThroughput = nodes.reduce((s, n) => s + n.throughput, 0);
    const avgLatencyP99 =
      nodes.reduce((s, n) => s + n.latency.p99, 0) / nodes.length;
    const attestedNodes = nodes.filter((n) => n.teeAttested).length;
    const totalCells = nodes.reduce((s, n) => s + n.cells.length, 0);

    setStats({
      totalNodes: nodes.length,
      activeNodes: nodes.length,
      totalThroughput,
      avgLatencyP99,
      totalCells,
      attestedNodes,
    });
  }, [nodes]);

  return (
    <div className="min-h-screen bg-[#111111] bg-pattern text-white p-4 md:p-6">
      {/* Header */}
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
              {mode === "live" ? "Live network discovery" : "Simulation mode"}
              {mode === "live" &&
                nodes.length > 0 &&
                ` • ${nodes.length} nodes`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle mode={mode} onChange={setMode} />
          {mode === "live" && (
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
          )}
          <div className="text-xs text-zinc-600 font-mono tabular-nums">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* Settings Panel (Live mode only) */}
      {mode === "live" && showSettings && (
        <Card className="monitor-card mb-6 animate-in">
          <CardContent className="p-4">
            <EndpointManager
              connections={connections}
              onAdd={addEndpoint}
              onRemove={removeEndpoint}
            />
          </CardContent>
        </Card>
      )}

      {/* Error Banner */}
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

      {/* Loading State */}
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

      {/* Main Content */}
      {nodes.length > 0 && (
        <>
          {/* Stats Grid */}
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

          {/* Charts */}
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

          {/* Nodes Grid */}
          <div className="animate-in">
            <h2 className="text-sm font-heading font-semibold text-zinc-400 mb-4 flex items-center gap-2">
              <Server className="w-4 h-4" />
              {mode === "live" ? "Discovered Nodes" : "Simulated Nodes"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nodes.map((node) => (
                <NodeCard key={node.nodeId} node={node} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty State for Live Mode */}
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

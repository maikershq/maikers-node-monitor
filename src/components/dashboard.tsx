"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MetricCard } from "./metric-card";
import { VirtualizedNodeGrid } from "./virtualized-node-grid";
import { LatencyChart } from "./latency-chart";
import { ThroughputChart } from "./throughput-chart";
import { SettingsPanel } from "./settings-panel";
import { GlobalCellFabric } from "./global-cell-fabric";
import { NodePool } from "./node-pool";
import { LatencyHistogram } from "./latency-histogram";
import { ClusterStatus } from "./cluster-status";
import { useNodes } from "@/hooks/useNodes";
import { useSettings } from "@/hooks/useSettings";
import { nodeDiscovery } from "@/lib/node-client";
import { formatNumber, formatLatency } from "@/lib/utils";
import type { NetworkStats } from "@/lib/types";
import { TOTAL_CELLS, DEFAULT_REPLICATION_FACTOR } from "@/lib/types";
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
  const [showSettings, setShowSettings] = useState(false);
  const { settings, updateSettings, resetSettings, isLoaded } = useSettings();

  useEffect(() => {
    if (isLoaded) {
      nodeDiscovery.setRegistryUrl(settings.registryUrl);
    }
  }, [settings.registryUrl, isLoaded]);

  const {
    nodes,
    timeSeries,
    connections,
    isLoading,
    error,
    addEndpoint,
    removeEndpoint,
    removeOfflineNodes,
    scanRegistry,
  } = useNodes({
    pollingIntervalMs: settings.refreshRateMs,
    registryScanIntervalMs: settings.registryScanIntervalMs,
    timeSeriesPoints: 60,
  });

  const stats = useMemo<NetworkStats>(() => {
    if (nodes.length === 0)
      return {
        totalNodes: 0,
        activeNodes: 0,
        totalThroughput: 0,
        avgLatencyP99: 0,
        totalCells: TOTAL_CELLS,
        attestedNodes: 0,
        secureNodes: 0,
        replicationFactor: DEFAULT_REPLICATION_FACTOR,
        healthyCells: 0,
        degradedCells: 0,
      };

    const healthyNodes = nodes.filter((n) => n.status !== "offline");
    const totalThroughput = healthyNodes.reduce((s, n) => s + n.throughput, 0);
    const avgLatencyP99 =
      healthyNodes.length > 0
        ? healthyNodes.reduce((s, n) => s + n.latency.p99, 0) /
          healthyNodes.length
        : 0;
    const attestedNodes = nodes.filter((n) => n.teeAttested).length;
    const secureNodes = nodes.filter((n) => n.secure).length;

    // Calculate cell coverage for replication health
    const cellCoverage = new Map<number, number>();
    healthyNodes.forEach((node) => {
      node.cells.forEach((cell) => {
        const current = cellCoverage.get(cell.id) || 0;
        cellCoverage.set(cell.id, current + 1);
      });
    });

    const healthyCells = Array.from(cellCoverage.values()).filter(
      (count) => count >= DEFAULT_REPLICATION_FACTOR,
    ).length;
    const degradedCells = Array.from(cellCoverage.values()).filter(
      (count) => count > 0 && count < DEFAULT_REPLICATION_FACTOR,
    ).length;

    return {
      totalNodes: nodes.length,
      activeNodes: healthyNodes.length,
      totalThroughput,
      avgLatencyP99,
      totalCells: TOTAL_CELLS,
      attestedNodes,
      secureNodes,
      replicationFactor: DEFAULT_REPLICATION_FACTOR,
      healthyCells,
      degradedCells,
    };
  }, [nodes]);

  return (
    <div className="min-h-screen bg-[var(--background)] bg-pattern text-white p-4 md:p-6">
      <header className="flex items-center justify-between mb-6 animate-in border-b border-zinc-800/50 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isLoading
                ? "bg-[var(--sys-warn)] animate-pulse"
                : error
                  ? "bg-[var(--sys-danger)]"
                  : "bg-[var(--sys-accent)] animate-pulse"
            }`}
          />
          <div>
            <h1 className="text-lg md:text-xl font-heading font-bold flex items-center gap-2">
              maikers nodes
              {stats.activeNodes > 0 && (
                <span className="text-[10px] bg-[var(--sys-tee)]/20 text-[var(--sys-tee)] px-2 py-0.5 rounded border border-[var(--sys-tee)]/30">
                  TEE Protected
                </span>
              )}
            </h1>
            <p className="text-[10px] text-zinc-500">
              Live network discovery
              {nodes.length > 0 && ` • ${nodes.length} nodes`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings
                ? "bg-[var(--sys-accent)]/20 text-[var(--sys-accent)]"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="text-[10px] text-zinc-600 font-mono tabular-nums">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      {showSettings && (
        <Card className="monitor-card mb-6 animate-in">
          <CardContent className="p-4">
            <SettingsPanel
              settings={settings}
              connections={connections}
              onSettingsChange={updateSettings}
              onResetSettings={resetSettings}
              onAddEndpoint={addEndpoint}
              onRemoveEndpoint={removeEndpoint}
              onRemoveOfflineNodes={removeOfflineNodes}
              onScanRegistry={scanRegistry}
            />
          </CardContent>
        </Card>
      )}

      {error && (
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
            <p className="text-sm text-zinc-500">Discovering nodes...</p>
          </div>
        </div>
      )}

      {nodes.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6 animate-in">
            <MetricCard
              label="Nodes"
              value={stats.totalNodes}
              subValue={`${stats.attestedNodes} TEE attested`}
              icon={<Server className="w-4 h-4" />}
            />
            <MetricCard
              label="Throughput"
              value={formatNumber(stats.totalThroughput)}
              subValue="ops/s"
              trend="up"
              icon={<Zap className="w-4 h-4" />}
            />
            <MetricCard
              label="Latency P99"
              value={formatLatency(stats.avgLatencyP99)}
              trend={stats.avgLatencyP99 > 500 ? "down" : undefined}
              icon={<Clock className="w-4 h-4" />}
            />
            <MetricCard
              label="Cells"
              value={`${stats.healthyCells}/${stats.totalCells}`}
              subValue={`RF=${stats.replicationFactor}`}
              trend={stats.degradedCells === 0 ? "up" : "down"}
              icon={<Cpu className="w-4 h-4" />}
            />
            <MetricCard
              label="Secure"
              value={`${stats.secureNodes}/${stats.totalNodes}`}
              subValue={stats.secureNodes > 0 ? "TEE protected" : "insecure"}
              icon={<ShieldCheck className="w-4 h-4" />}
            />
            <MetricCard
              label="Active"
              value={stats.activeNodes}
              subValue="nodes online"
              trend={stats.activeNodes === stats.totalNodes ? "up" : undefined}
              icon={<Activity className="w-4 h-4" />}
            />
          </div>

          {/* Main Visualization Row: Cell Fabric + Stack + Node Pool */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-6 animate-in lg:h-[380px]">
            {/* Global Cell Fabric - Main visualization */}
            <div className="lg:col-span-5 h-full">
              <GlobalCellFabric nodes={nodes} className="h-full" />
            </div>

            {/* Architecture Stack */}
            <div className="lg:col-span-3 h-full">
              <ClusterStatus nodes={nodes} className="h-full" />
            </div>

            {/* Node Pool */}
            <div className="lg:col-span-4 h-full">
              <NodePool nodes={nodes} className="h-full" />
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6 animate-in">
            <Card className="monitor-card">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="w-3.5 h-3.5 text-[var(--sys-accent)]" />
                  Throughput
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="h-32">
                  <ThroughputChart data={timeSeries} />
                </div>
              </CardContent>
            </Card>

            <Card className="monitor-card">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-3.5 h-3.5 text-[var(--sys-success)]" />
                  Latency Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="h-32">
                  <LatencyChart data={timeSeries} />
                </div>
              </CardContent>
            </Card>

            <Card className="monitor-card">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Activity className="w-3.5 h-3.5 text-[var(--sys-warn)]" />
                  Latency Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="h-32">
                  <LatencyHistogram nodes={nodes} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="animate-in">
            <VirtualizedNodeGrid nodes={nodes} />
          </div>
        </>
      )}

      {!isLoading && nodes.length === 0 && !error && (
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

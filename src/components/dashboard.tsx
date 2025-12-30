"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { MetricCard } from "./metric-card";
import { VirtualizedNodeGrid } from "./virtualized-node-grid";
import { LatencyChart } from "./latency-chart";
import { ThroughputChart } from "./throughput-chart";
import { SettingsPanel } from "./settings-panel";
import { GlobalCellFabric } from "./global-cell-fabric";
import { NodePool } from "./node-pool";
import { LatencyHistogram } from "./latency-histogram";
import { RecentAgents } from "./recent-agents";
import { ClusterStatus } from "./cluster-status";
import { useNodes } from "@/hooks/useNodes";
import { useSettings } from "@/hooks/useSettings";
import { nodeDiscovery } from "@/lib/node-client";
import { config } from "@/lib/config";
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
  Loader2,
  Settings,
} from "lucide-react";

export function Dashboard() {
  const [showSettings, setShowSettings] = useState(false);
  const { settings, updateSettings, resetSettings } = useSettings();

  const {
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
        loadedCells: 0,
        minReplication: 0,
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
    for (let i = 0; i < TOTAL_CELLS; i++) {
      cellCoverage.set(i, 0);
    }
    healthyNodes.forEach((node) => {
      node.cells.forEach((cell) => {
        const current = cellCoverage.get(cell.id) || 0;
        cellCoverage.set(cell.id, current + 1);
      });
    });

    const coverageValues = Array.from(cellCoverage.values());
    const healthyCells = coverageValues.filter(
      (count) => count >= DEFAULT_REPLICATION_FACTOR,
    ).length;
    const degradedCells = coverageValues.filter(
      (count) => count > 0 && count < DEFAULT_REPLICATION_FACTOR,
    ).length;
    const loadedCells = coverageValues.filter((count) => count > 0).length;
    const minReplication = Math.min(...coverageValues);

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
      loadedCells,
      minReplication,
    };
  }, [nodes]);

  const getCellsColor = (minRF: number): string => {
    if (minRF === 0) return "#71717a"; // zinc-500 (gray)
    if (minRF === 1) return "var(--sys-danger)"; // red
    if (minRF === 2) return "var(--sys-warn)"; // orange
    return "var(--sys-success)"; // green (3+)
  };

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
              <span className="text-[9px] font-mono font-normal px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                BETA
              </span>
            </h1>
            <p className="text-[10px] text-zinc-500">
              Live network discovery
              {nodes.length > 0 && ` • ${nodes.length} nodes`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-zinc-800/50 rounded-lg p-1 border border-zinc-800">
            {Object.values(config.networks).map((net) => (
              <button
                key={net.id}
                onClick={() => setNetwork(net.id)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  currentNetwork === net.id
                    ? "bg-[var(--sys-accent)] text-white font-medium shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
                }`}
              >
                {net.name}
              </button>
            ))}
          </div>
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

      {error && nodes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 animate-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-transparent rounded-full blur-2xl" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center">
              <Server className="w-8 h-8 text-zinc-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
            </div>
          </div>
          <h3 className="text-lg font-heading font-semibold text-zinc-300 mb-2">
            Waiting for Nodes
          </h3>
          <p className="text-sm text-zinc-500 max-w-sm text-center mb-6">
            No nodes found on{" "}
            <span className="text-[var(--sys-accent)] font-medium">
              {config.networks[currentNetwork].name}
            </span>
            . Nodes will appear here once they register with the registry.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => scanRegistry()}
              className="px-4 py-2 bg-[var(--sys-accent)]/20 text-[var(--sys-accent)] rounded-lg text-sm hover:bg-[var(--sys-accent)]/30 transition-colors flex items-center gap-2"
            >
              <Loader2 className="w-3.5 h-3.5" />
              Scan Registry
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700 transition-colors flex items-center gap-2"
            >
              <Settings className="w-3.5 h-3.5" />
              Add Manually
            </button>
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
              value={`${stats.loadedCells}/${stats.totalCells}`}
              subValue={`RF=${stats.replicationFactor}`}
              valueColor={getCellsColor(stats.minReplication)}
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

          {/* Main Visualization Row: Shards (Left) | Group 1 (Middle) | Group 2 (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-6 animate-in lg:h-[680px]">
            {/* Left Column: Global Cell Fabric (Shards) */}
            <div className="lg:col-span-6 h-full min-h-[400px]">
              <GlobalCellFabric nodes={nodes} className="h-full" />
            </div>

            {/* Middle Column: Group 1 (Stack + Node Pool) */}
            <div className="lg:col-span-3 h-full flex flex-col gap-3 min-h-[500px] lg:min-h-0">
              <div className="flex-[5] min-h-0">
                <ClusterStatus
                  nodes={nodes}
                  className="h-full min-h-[250px] lg:min-h-0"
                />
              </div>
              <div className="flex-[5] min-h-0">
                <NodePool
                  nodes={nodes}
                  className="h-full min-h-[250px] lg:min-h-0"
                />
              </div>
            </div>

            {/* Right Column: Group 2 (Charts) - Unified Card */}
            <div className="lg:col-span-3 h-full flex flex-col min-h-[600px] lg:min-h-0">
              <Card className="monitor-card h-full flex flex-col p-0 overflow-hidden bg-[var(--card-background)]">
                {/* Throughput Section */}
                <div className="flex-[1] flex flex-col min-h-0 border-b border-zinc-800/50">
                  <div className="px-3 pt-3 flex-none flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      <Zap className="w-3 h-3 text-[var(--sys-accent)]" />
                      Throughput
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 px-1 pb-1">
                    <div className="h-full w-full">
                      <ThroughputChart data={timeSeries} />
                    </div>
                  </div>
                </div>

                {/* Latency Timeline Section */}
                <div className="flex-[1] flex flex-col min-h-0 border-b border-zinc-800/50">
                  <div className="px-3 pt-3 flex-none flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      <Clock className="w-3 h-3 text-[var(--sys-success)]" />
                      Latency
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 px-1 pb-1">
                    <div className="h-full w-full">
                      <LatencyChart data={timeSeries} />
                    </div>
                  </div>
                </div>

                {/* Latency Distribution Section */}
                <div className="flex-[1] flex flex-col min-h-0">
                  <div className="px-3 pt-3 flex-none flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      <Activity className="w-3 h-3 text-[var(--sys-warn)]" />
                      Distribution
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 px-3 pb-3">
                    <div className="h-full w-full">
                      <LatencyHistogram nodes={nodes} />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="animate-in mb-6">
            <VirtualizedNodeGrid nodes={nodes} />
          </div>

          <div className="animate-in mb-6">
            <RecentAgents />
          </div>
        </>
      )}

      {!isLoading && nodes.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 animate-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--sys-accent)]/10 to-transparent rounded-full blur-2xl" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center">
              <Server className="w-8 h-8 text-zinc-500" />
            </div>
          </div>
          <h3 className="text-lg font-heading font-semibold text-zinc-300 mb-2">
            No Nodes Yet
          </h3>
          <p className="text-sm text-zinc-500 max-w-sm text-center mb-6">
            Start some nodes or add endpoints manually to begin monitoring the{" "}
            <span className="text-[var(--sys-accent)] font-medium">
              {config.networks[currentNetwork].name}
            </span>{" "}
            network.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => scanRegistry()}
              className="px-4 py-2 bg-[var(--sys-accent)]/20 text-[var(--sys-accent)] rounded-lg text-sm hover:bg-[var(--sys-accent)]/30 transition-colors flex items-center gap-2"
            >
              <Loader2 className="w-3.5 h-3.5" />
              Scan Registry
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700 transition-colors flex items-center gap-2"
            >
              <Settings className="w-3.5 h-3.5" />
              Add Manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

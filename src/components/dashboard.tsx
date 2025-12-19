"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MetricCard } from "./metric-card";
import { NodeCard } from "./node-card";
import { LatencyChart } from "./latency-chart";
import { ThroughputChart } from "./throughput-chart";
import {
  generateMockNodes,
  generateTimeSeries,
  updateNodeMetrics,
} from "@/lib/mock-data";
import { formatNumber, formatLatency } from "@/lib/utils";
import type { NodeMetrics, TimeSeriesPoint, NetworkStats } from "@/lib/types";
import { Activity, Cpu, Clock, ShieldCheck, Zap, Server } from "lucide-react";

const INITIAL_NODES = 6;
const TIME_SERIES_POINTS = 60;
const UPDATE_INTERVAL = 1000;

export function Dashboard() {
  const [nodes, setNodes] = useState<NodeMetrics[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [stats, setStats] = useState<NetworkStats>({
    totalNodes: 0,
    activeNodes: 0,
    totalThroughput: 0,
    avgLatencyP99: 0,
    totalCells: 0,
    attestedNodes: 0,
  });

  useEffect(() => {
    setNodes(generateMockNodes(INITIAL_NODES));
    setTimeSeries(generateTimeSeries(TIME_SERIES_POINTS));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) => prev.map(updateNodeMetrics));

      setTimeSeries((prev) => {
        const newPoint: TimeSeriesPoint = {
          timestamp: Date.now(),
          throughput: 200 + Math.random() * 300,
          latencyP50: 12 + Math.random() * 8,
          latencyP99: 60 + Math.random() * 40,
          activeWorkers: 50 + Math.floor(Math.random() * 100),
        };
        return [...prev.slice(1), newPoint];
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <div>
            <h1 className="text-xl font-bold">Cellular Stigmergy Monitor</h1>
            <p className="text-xs text-zinc-500">
              Real-time network observability
            </p>
          </div>
        </div>
        <div className="text-xs text-zinc-600 font-mono">
          {new Date().toLocaleTimeString()}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ThroughputChart data={timeSeries} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Latency Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <LatencyChart data={timeSeries} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nodes Grid */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
          <Server className="w-4 h-4" />
          TEE Node Pool
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node) => (
            <NodeCard key={node.nodeId} node={node} />
          ))}
        </div>
      </div>
    </div>
  );
}

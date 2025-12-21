"use client";

import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { NodeMetrics } from "@/lib/types";
import { TOTAL_CELLS, DEFAULT_REPLICATION_FACTOR } from "@/lib/types";
import {
  Layers,
  Shield,
  Activity,
  Database,
  Zap,
  CheckCircle,
} from "lucide-react";

interface ClusterStatusProps {
  nodes: NodeMetrics[];
  className?: string;
}

export function ClusterStatus({ nodes, className }: ClusterStatusProps) {
  const stats = useMemo(() => {
    // Calculate cell coverage
    const cellCoverage = new Map<number, number>();
    for (let i = 0; i < TOTAL_CELLS; i++) {
      cellCoverage.set(i, 0);
    }

    nodes.forEach((node) => {
      if (node.status !== "offline") {
        node.cells.forEach((cell) => {
          const current = cellCoverage.get(cell.id) || 0;
          cellCoverage.set(cell.id, current + 1);
        });
      }
    });

    const healthyCells = Array.from(cellCoverage.values()).filter(
      (count) => count >= DEFAULT_REPLICATION_FACTOR,
    ).length;
    const degradedCells = Array.from(cellCoverage.values()).filter(
      (count) => count > 0 && count < DEFAULT_REPLICATION_FACTOR,
    ).length;
    const emptyCells = Array.from(cellCoverage.values()).filter(
      (count) => count === 0,
    ).length;

    const activeNodes = nodes.filter((n) => n.status !== "offline").length;
    const secureNodes = nodes.filter((n) => n.secure).length;
    const totalWorkers = nodes.reduce((s, n) => s + n.workers.active, 0);
    const totalThroughput = nodes.reduce((s, n) => s + n.throughput, 0);
    const totalEvents = nodes.reduce(
      (s, n) => s + n.cells.reduce((cs, c) => cs + c.queueDepth, 0),
      0,
    );

    return {
      healthyCells,
      degradedCells,
      emptyCells,
      activeNodes,
      secureNodes,
      totalWorkers,
      totalThroughput,
      totalEvents,
      clusterHealth:
        emptyCells === 0 && degradedCells === 0
          ? "healthy"
          : emptyCells > 0
            ? "critical"
            : "degraded",
    };
  }, [nodes]);

  const layers = [
    {
      label: "INGEST",
      icon: Zap,
      value: `${stats.totalThroughput.toLocaleString()} op/s`,
      color: "blue",
      active: stats.totalThroughput > 0,
    },
    {
      label: "DISCOVERY",
      icon: Activity,
      value: `${stats.activeNodes} nodes`,
      color: "cyan",
      active: stats.activeNodes > 0,
    },
    {
      label: "CELL FABRIC",
      icon: Database,
      value: `${stats.healthyCells}/${TOTAL_CELLS} healthy`,
      color: "indigo",
      active: stats.healthyCells > 0,
    },
    {
      label: "TEE NODES",
      icon: Shield,
      value: `${stats.secureNodes} attested`,
      color: "purple",
      active: stats.secureNodes > 0,
    },
    {
      label: "REPLICATION",
      icon: Layers,
      value: `RF=${DEFAULT_REPLICATION_FACTOR}`,
      color: "emerald",
      active: stats.degradedCells === 0 && stats.emptyCells === 0,
    },
  ];

  return (
    <Card className={twMerge("monitor-card h-full flex flex-col", className)}>
      <CardHeader className="pb-2 pt-3 flex-none">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[var(--sys-accent)]" />
            Stack
          </div>
          <div
            className={twMerge(
              "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
              stats.clusterHealth === "healthy" &&
                "bg-[var(--sys-success)]/20 text-[var(--sys-success)]",
              stats.clusterHealth === "degraded" &&
                "bg-[var(--sys-warn)]/20 text-[var(--sys-warn)]",
              stats.clusterHealth === "critical" &&
                "bg-[var(--sys-danger)]/20 text-[var(--sys-danger)]",
            )}
          >
            <CheckCircle className="w-3 h-3" />
            {stats.clusterHealth.toUpperCase()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 flex-1 flex flex-col min-h-0 justify-between">
        <div className="space-y-1 flex-1 flex flex-col justify-center">
          {layers.map((layer) => {
            const Icon = layer.icon;
            return (
              <div
                key={layer.label}
                className={twMerge(
                  "flex items-center gap-2 p-1.5 rounded text-[10px] transition-all",
                  `border-l-2 border-${layer.color}-500`,
                  layer.active
                    ? `bg-${layer.color}-500/5`
                    : "bg-zinc-900/30 opacity-50",
                )}
              >
                <Icon
                  className={twMerge("w-3 h-3", `text-${layer.color}-400`)}
                />
                <span className={`text-${layer.color}-400 font-bold flex-1`}>
                  {layer.label}
                </span>
                <span className="text-zinc-400 font-mono">{layer.value}</span>
              </div>
            );
          })}
        </div>

        {/* Replication Status */}
        <div className="mt-auto pt-2 border-t border-zinc-800/50 flex-none">
          <div className="flex items-center justify-between gap-1 text-center text-[9px]">
            <div className="flex flex-col items-center px-1">
              <div className="text-zinc-500">Healthy</div>
              <div className="text-[var(--sys-success)] font-mono font-bold text-xs">
                {stats.healthyCells}
              </div>
            </div>
            <div className="flex flex-col items-center px-1">
              <div className="text-zinc-500">Degraded</div>
              <div
                className={twMerge(
                  "font-mono font-bold text-xs",
                  stats.degradedCells > 0
                    ? "text-[var(--sys-warn)]"
                    : "text-zinc-600",
                )}
              >
                {stats.degradedCells}
              </div>
            </div>
            <div className="flex flex-col items-center px-1">
              <div className="text-zinc-500">Empty</div>
              <div
                className={twMerge(
                  "font-mono font-bold text-xs",
                  stats.emptyCells > 0
                    ? "text-[var(--sys-danger)]"
                    : "text-zinc-600",
                )}
              >
                {stats.emptyCells}
              </div>
            </div>
          </div>
        </div>

        {/* Events in flight */}
        {stats.totalEvents > 0 && (
          <div className="mt-2 pt-2 border-t border-zinc-800/50 flex items-center justify-between text-[10px] flex-none">
            <span className="text-zinc-500">Events in queue</span>
            <span className="text-[var(--sys-accent)] font-mono">
              {stats.totalEvents.toLocaleString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

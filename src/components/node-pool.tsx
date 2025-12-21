"use client";

import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { NodeMetrics } from "@/lib/types";
import { TOTAL_CELLS } from "@/lib/types";
import { ShieldCheck, Database } from "lucide-react";

interface NodePoolProps {
  nodes: NodeMetrics[];
  className?: string;
}

type NodeState = "active" | "busy" | "error" | "not_synced" | "offline";

function getNodeState(node: NodeMetrics): NodeState {
  if (node.status === "offline") return "offline";
  if (node.status === "degraded") return "error";
  if (node.workers.active === 0) return "not_synced";
  if (node.workers.active > node.workers.total * 0.8) return "busy";
  return "active";
}

function getStateColor(state: NodeState): string {
  switch (state) {
    case "active":
      return "bg-[var(--sys-success)]";
    case "busy":
      return "bg-[var(--sys-accent)]";
    case "error":
      return "bg-[var(--sys-danger)]";
    case "not_synced":
      return "bg-zinc-700";
    case "offline":
      return "bg-zinc-800 border border-zinc-700";
    default:
      return "bg-zinc-700";
  }
}

export function NodePool({ nodes, className }: NodePoolProps) {
  const nodeData = useMemo(() => {
    return nodes.map((node) => ({
      id: node.nodeId,
      state: getNodeState(node),
      workers: node.workers,
      secure: node.secure,
      cellCount: node.cells.length,
      ownedCells: node.ownedCells || node.cells.map((c) => c.id),
      claimedEvents: node.claimedEvents || 0,
      throughput: node.throughput,
    }));
  }, [nodes]);

  const activeCount = nodeData.filter((n) => n.state === "active").length;
  const busyCount = nodeData.filter((n) => n.state === "busy").length;
  const errorCount = nodeData.filter((n) => n.state === "error").length;
  const notSyncedCount = nodeData.filter(
    (n) => n.state === "not_synced",
  ).length;
  const totalWorkers = nodes.reduce((s, n) => s + n.workers.active, 0);
  const totalClaimed = nodeData.reduce((s, n) => s + n.claimedEvents, 0);

  return (
    <Card className={twMerge("monitor-card h-full flex flex-col", className)}>
      <CardHeader className="pb-2 pt-3 flex-none">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--sys-tee)]" />
            Node Pool
          </div>
          <span className="text-[10px] font-normal text-zinc-500">
            {nodes.length} nodes • {totalWorkers} workers
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 flex-1 flex flex-col min-h-0">
        {/* Node list with cell ownership */}
        <div className="space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {nodeData.map((node) => (
            <div
              key={node.id}
              className={twMerge(
                "flex items-center gap-2 p-1.5 rounded text-[10px] transition-colors",
                "bg-zinc-900/50 hover:bg-zinc-800/50",
                node.state === "offline" && "opacity-50",
              )}
            >
              {/* Status dot */}
              <div
                className={twMerge(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  getStateColor(node.state),
                  (node.state === "active" || node.state === "busy") &&
                    "shadow-[0_0_4px_currentColor] animate-pulse",
                )}
              />

              {/* Node ID */}
              <span className="text-zinc-300 font-mono truncate min-w-0 flex-1">
                {node.id}
              </span>

              {/* Cell ownership indicator */}
              <div
                className="flex items-center gap-1 text-zinc-500"
                title={`Owns cells: ${node.ownedCells.slice(0, 10).join(", ")}${node.ownedCells.length > 10 ? "..." : ""}`}
              >
                <Database className="w-3 h-3" />
                <span className="font-mono">
                  {node.cellCount}/{TOTAL_CELLS}
                </span>
              </div>

              {/* Claimed events */}
              {node.claimedEvents > 0 && (
                <span className="text-[var(--sys-accent)] font-mono">
                  {node.claimedEvents} claimed
                </span>
              )}

              {/* Throughput */}
              <span className="text-[var(--sys-success)] font-mono w-16 text-right">
                {node.throughput.toLocaleString()} op/s
              </span>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/50 text-[10px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--sys-success)]" />
              <span className="text-zinc-400">Active</span>
              <span className="text-white font-mono">{activeCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--sys-accent)]" />
              <span className="text-zinc-400">Busy</span>
              <span className="text-white font-mono">{busyCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--sys-danger)]" />
              <span className="text-zinc-400">Error</span>
              <span className="text-white font-mono">{errorCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-700" />
              <span className="text-zinc-400">Not synced</span>
              <span className="text-white font-mono">{notSyncedCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

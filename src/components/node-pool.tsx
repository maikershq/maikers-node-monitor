"use client";

import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { NodeMetrics } from "@/lib/types";
import { ShieldCheck } from "lucide-react";

interface NodePoolProps {
  nodes: NodeMetrics[];
  className?: string;
}

type NodeState = "idle" | "working" | "attesting" | "offline";

function getNodeState(node: NodeMetrics): NodeState {
  if (node.status === "offline") return "offline";
  if (node.workers.active === 0) return "idle";
  if (node.workers.active < node.workers.total * 0.3) return "attesting";
  return "working";
}

function getStateColor(state: NodeState): string {
  switch (state) {
    case "working":
      return "bg-[var(--sys-tee)]";
    case "attesting":
      return "bg-[var(--sys-warn)]";
    case "offline":
      return "bg-[var(--sys-danger)]";
    default:
      return "bg-zinc-700";
  }
}

export function NodePool({ nodes, className }: NodePoolProps) {
  const nodeStates = useMemo(() => {
    return nodes.map((node) => ({
      id: node.nodeId,
      state: getNodeState(node),
      workers: node.workers,
      secure: node.secure,
    }));
  }, [nodes]);

  const workingCount = nodeStates.filter((n) => n.state === "working").length;
  const attestingCount = nodeStates.filter(
    (n) => n.state === "attesting",
  ).length;
  const totalWorkers = nodes.reduce((s, n) => s + n.workers.active, 0);

  // Calculate dot size based on node count
  const total = nodes.length;
  const dotSize = total > 100 ? 4 : total > 50 ? 5 : total > 20 ? 6 : 8;
  const cols = Math.max(10, Math.ceil(Math.sqrt(total * 2)));

  return (
    <Card className={twMerge("monitor-card", className)}>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--sys-tee)]" />
            TEE Node Pool
          </div>
          <span className="text-[10px] font-normal text-zinc-500">
            {nodes.length} nodes • {totalWorkers} workers
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div
          className="inline-grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${dotSize}px)`,
          }}
        >
          {nodeStates.map((node, idx) => (
            <div
              key={`${node.id}-${idx}`}
              className={twMerge(
                "rounded-sm transition-all",
                getStateColor(node.state),
                node.state === "working" && "shadow-[0_0_4px_var(--sys-tee)]",
              )}
              style={{ width: dotSize, height: dotSize }}
              title={`${node.id} • ${node.state} • ${node.workers.active}/${node.workers.total} workers`}
            />
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-zinc-800/50 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[var(--sys-tee)]" />
            <span className="text-zinc-400">Working</span>
            <span className="text-white font-mono">{workingCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[var(--sys-warn)]" />
            <span className="text-zinc-400">Attesting</span>
            <span className="text-white font-mono">{attestingCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-zinc-700" />
            <span className="text-zinc-400">Idle</span>
            <span className="text-white font-mono">
              {nodes.length - workingCount - attestingCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

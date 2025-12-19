"use client";

import { twMerge } from "tailwind-merge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CellFabric } from "./cell-fabric";
import { formatLatency, formatNumber } from "@/lib/utils";
import type { NodeMetrics } from "@/lib/types";
import { Shield, ShieldCheck, Activity, Clock, Cpu } from "lucide-react";

interface NodeCardProps {
  node: NodeMetrics;
  className?: string;
}

export function NodeCard({ node, className }: NodeCardProps) {
  const avgSignal =
    node.cells.reduce((s, c) => s + c.signal, 0) / node.cells.length;
  const uptimeHours = Math.floor(node.uptime / 3600);

  return (
    <Card
      className={twMerge(
        "monitor-card overflow-hidden transition-all duration-300",
        className,
      )}
    >
      <CardHeader className="pb-3 pt-4 px-5 border-b-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span
              className={twMerge(
                "w-2 h-2 rounded-full",
                node.teeAttested ? "bg-cyan-400" : "bg-amber-400",
              )}
            />
            {node.nodeId}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {node.teeAttested ? (
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            ) : (
              <Shield className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-[10px] text-zinc-500 font-medium">
              {node.teePlatform}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 font-mono truncate mt-1">
          {node.peerId}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <CellFabric cells={node.cells} className="h-20" />

        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-[10px] text-zinc-500 font-medium">Throughput</p>
            <p className="text-sm font-heading font-bold text-white tabular-nums">
              {formatNumber(node.throughput)}
            </p>
            <p className="text-[9px] text-zinc-600">ops/s</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-medium">Workers</p>
            <p className="text-sm font-heading font-bold text-cyan-400 tabular-nums">
              {node.workers.active}/{node.workers.total}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-medium">P99</p>
            <p className="text-sm font-heading font-bold text-amber-400 tabular-nums">
              {formatLatency(node.latency.p99)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-medium">Load</p>
            <p
              className={twMerge(
                "text-sm font-heading font-bold tabular-nums",
                avgSignal > 80
                  ? "text-red-400"
                  : avgSignal > 50
                    ? "text-amber-400"
                    : "text-cyan-400",
              )}
            >
              {avgSignal.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-800/50 pt-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className="tabular-nums">{uptimeHours}h</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span className="tabular-nums">
              {formatNumber(node.tasksProcessed)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            <span>{node.peers.length} peers</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

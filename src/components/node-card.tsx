"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CellFabric } from "./cell-fabric";
import { cn, formatLatency, formatNumber } from "@/lib/utils";
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
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                node.teeAttested ? "bg-emerald-500" : "bg-amber-500",
              )}
            />
            {node.nodeId}
          </CardTitle>
          <div className="flex items-center gap-1">
            {node.teeAttested ? (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <Shield className="w-4 h-4 text-amber-500" />
            )}
            <span className="text-[10px] text-zinc-500">
              {node.teePlatform}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 font-mono truncate">
          {node.peerId}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <CellFabric cells={node.cells} className="h-24" />

        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-[10px] text-zinc-500">Throughput</p>
            <p className="text-sm font-bold text-white">
              {formatNumber(node.throughput)}
            </p>
            <p className="text-[9px] text-zinc-600">ops/s</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">Workers</p>
            <p className="text-sm font-bold text-indigo-400">
              {node.workers.active}/{node.workers.total}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">P99</p>
            <p className="text-sm font-bold text-amber-400">
              {formatLatency(node.latency.p99)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">Load</p>
            <p
              className={cn(
                "text-sm font-bold",
                avgSignal > 80
                  ? "text-red-400"
                  : avgSignal > 50
                    ? "text-amber-400"
                    : "text-emerald-400",
              )}
            >
              {avgSignal.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-600 border-t border-zinc-800 pt-2">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {uptimeHours}h
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {formatNumber(node.tasksProcessed)} tasks
          </div>
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            {node.peers.length} peers
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

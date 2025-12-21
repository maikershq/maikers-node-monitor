"use client";

import { memo } from "react";
import { twMerge } from "tailwind-merge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CellFabric } from "./cell-fabric";
import { formatLatency, formatNumber } from "@/lib/utils";
import type { NodeMetrics, NodeStatus } from "@/lib/types";
import {
  Shield,
  ShieldCheck,
  Activity,
  Clock,
  Cpu,
  WifiOff,
  AlertTriangle,
} from "lucide-react";

interface NodeCardProps {
  node: NodeMetrics;
  className?: string;
}

function getStatusIndicator(status: NodeStatus) {
  switch (status) {
    case "offline":
      return { color: "bg-red-500", icon: WifiOff, label: "Offline" };
    case "degraded":
      return {
        color: "bg-amber-500 animate-pulse",
        icon: AlertTriangle,
        label: "Degraded",
      };
    default:
      return { color: "bg-cyan-400", icon: null, label: "Healthy" };
  }
}

function NodeCardComponent({ node, className }: NodeCardProps) {
  const avgSignal =
    node.cells.reduce((s, c) => s + c.signal, 0) / node.cells.length;
  const uptimeHours = Math.floor(node.uptime / 3600);
  const statusInfo = getStatusIndicator(node.status);
  const StatusIcon = statusInfo.icon;

  return (
    <Card
      className={twMerge(
        "monitor-card overflow-hidden transition-all duration-300",
        node.status === "offline" && "opacity-50 grayscale",
        node.status === "degraded" && "ring-1 ring-amber-500/30",
        className,
      )}
    >
      <CardHeader className="pb-3 pt-4 px-5 border-b-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span
              className={twMerge("w-2 h-2 rounded-full", statusInfo.color)}
            />
            {node.nodeId}
            {StatusIcon && (
              <StatusIcon className="w-3.5 h-3.5 text-amber-400" />
            )}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {node.secure ? (
              <>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] text-cyan-400 font-medium">
                  {node.teePlatform}
                </span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 font-medium">
                  Insecure
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-zinc-600 font-mono truncate flex-1">
            {node.peerId}
          </p>
          {node.packetLoss > 0 && node.status !== "offline" && (
            <span className="text-[9px] text-red-400 ml-2">
              {Math.round(node.packetLoss * 100)}% loss
            </span>
          )}
        </div>
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

export const NodeCard = memo(NodeCardComponent);

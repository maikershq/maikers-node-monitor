"use client";

import { memo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { formatLatency, formatNumber } from "@/lib/utils";
import type { NodeMetrics, NodeStatus, CellMetrics } from "@/lib/types";
import {
  Shield,
  ShieldCheck,
  Activity,
  Clock,
  Cpu,
  WifiOff,
  AlertTriangle,
  Database,
  Copy,
  Check,
} from "lucide-react";

function CellDotsLine({ cells }: { cells: CellMetrics[] }) {
  const dotSize = cells.length > 32 ? 3 : cells.length > 16 ? 4 : 5;

  return (
    <div className="flex flex-wrap gap-0.5">
      {cells.map((cell) => {
        const intensity = cell.signal / 100;
        const hue = 260 - intensity * 30;
        const alpha = 0.15 + intensity * 0.6;
        const isHighLoad = cell.signal > 80;
        const hasQueue = cell.queueDepth > 0;

        return (
          <div
            key={cell.id}
            className={twMerge(
              "rounded-sm transition-all",
              isHighLoad && "shadow-[0_0_4px_var(--sys-danger)]",
              hasQueue && "shadow-[0_0_3px_var(--sys-tee)]",
            )}
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor:
                intensity > 0.02
                  ? `hsla(${hue}, 60%, 50%, ${alpha})`
                  : "#374151",
            }}
            title={`Cell ${cell.id} • Signal: ${Math.round(cell.signal)}% • Queue: ${cell.queueDepth}`}
          />
        );
      })}
    </div>
  );
}

interface NodeCardProps {
  node: NodeMetrics;
  className?: string;
}

function getStatusIndicator(status: NodeStatus) {
  switch (status) {
    case "offline":
      return {
        color: "bg-[var(--sys-danger)]",
        icon: WifiOff,
        label: "Offline",
      };
    case "degraded":
      return {
        color: "bg-[var(--sys-warn)] animate-pulse",
        icon: AlertTriangle,
        label: "Degraded",
      };
    default:
      return {
        color: "bg-[var(--sys-accent)] animate-pulse",
        icon: null,
        label: "Healthy",
      };
  }
}

function NodeCardComponent({ node, className }: NodeCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const avgSignal =
    node.cells.reduce((s, c) => s + c.signal, 0) / node.cells.length;
  const uptimeHours = Math.floor(node.uptime / 3600);
  const statusInfo = getStatusIndicator(node.status);
  const StatusIcon = statusInfo.icon;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(node.nodeId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
            <button
              onClick={handleCopy}
              className="ml-1 p-1 text-zinc-500 hover:text-[var(--sys-accent)] transition-colors rounded hover:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              aria-label="Copy Node ID"
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-[var(--sys-success)]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            {StatusIcon && (
              <StatusIcon className="w-3.5 h-3.5 text-amber-400" />
            )}
          </CardTitle>
          {node.secure ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--sys-tee)]/20 border border-[var(--sys-tee)]/50">
              <ShieldCheck className="w-3 h-3 text-[var(--sys-tee)]" />
              <span className="text-[9px] text-[var(--sys-tee)] font-medium">
                {node.teePlatform}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/50 border border-zinc-700/50">
              <Shield className="w-3 h-3 text-zinc-500" />
              <span className="text-[9px] text-zinc-500 font-medium">
                Insecure
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <p
            className="text-[10px] text-zinc-600 font-mono truncate flex-1 cursor-default"
            title={node.peerId}
          >
            {node.peerId}
          </p>
          {node.packetLoss > 0 && node.status !== "offline" && (
            <span className="text-[9px] text-red-400 ml-2 whitespace-nowrap">
              {Math.round(node.packetLoss * 100)}% loss
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-4">
        {/* Cell Shards - inline dot visualization */}
        <div className="py-2 px-2 bg-zinc-900/50 rounded">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1 text-[9px] text-zinc-500">
              <Database className="w-3 h-3" />
              <span>Cell Shards</span>
            </div>
            <span className="text-[9px] text-zinc-600 font-mono">
              {node.cells.length} owned
            </span>
          </div>
          <CellDotsLine cells={node.cells} />
        </div>

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
            <p className="text-sm font-heading font-bold text-[var(--sys-accent)] tabular-nums">
              {node.workers.active}/{node.workers.total}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-medium">P99</p>
            <p
              className={twMerge(
                "text-sm font-heading font-bold tabular-nums",
                node.latency.p99 > 1000
                  ? "text-[var(--sys-danger)]"
                  : node.latency.p99 > 200
                    ? "text-[var(--sys-warn)]"
                    : "text-[var(--sys-success)]",
              )}
            >
              {formatLatency(node.latency.p99)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-medium">Load</p>
            <p
              className={twMerge(
                "text-sm font-heading font-bold tabular-nums",
                avgSignal > 80
                  ? "text-[var(--sys-danger)]"
                  : avgSignal > 50
                    ? "text-[var(--sys-warn)]"
                    : "text-[var(--sys-success)]",
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

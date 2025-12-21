"use client";

import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { NodeMetrics, CellMetrics } from "@/lib/types";
import { Cpu } from "lucide-react";

interface GlobalCellFabricProps {
  nodes: NodeMetrics[];
  className?: string;
}

interface AggregatedCell extends CellMetrics {
  nodeId: string;
}

export function GlobalCellFabric({ nodes, className }: GlobalCellFabricProps) {
  const allCells = useMemo<AggregatedCell[]>(() => {
    return nodes.flatMap((node) =>
      node.cells.map((cell) => ({ ...cell, nodeId: node.nodeId })),
    );
  }, [nodes]);

  const cols = Math.max(8, Math.ceil(Math.sqrt(allCells.length)));
  const cellSize = allCells.length > 256 ? 6 : allCells.length > 100 ? 8 : 10;

  const avgSignal =
    allCells.length > 0
      ? allCells.reduce((s, c) => s + c.signal, 0) / allCells.length
      : 0;

  return (
    <Card className={twMerge("monitor-card", className)}>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[var(--sys-tee)]" />
            Cell Fabric
          </div>
          <div className="flex items-center gap-3 text-[10px] font-normal text-zinc-500">
            <span>{allCells.length} shards</span>
            <span
              className={twMerge(
                "font-mono",
                avgSignal > 80
                  ? "text-[var(--sys-danger)]"
                  : avgSignal > 50
                    ? "text-[var(--sys-warn)]"
                    : "text-[var(--sys-success)]",
              )}
            >
              {avgSignal.toFixed(0)}% load
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div
          className="inline-grid gap-px rounded overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            backgroundColor: "#27272a",
          }}
        >
          {allCells.map((cell, idx) => {
            const intensity = cell.signal / 100;
            const hue = 260 - intensity * 30;
            const alpha = 0.08 + intensity * 0.4;
            const isHighLoad = cell.signal > 80;

            return (
              <div
                key={`${cell.nodeId}-${cell.id}-${idx}`}
                className={twMerge(
                  "cell-shard cursor-crosshair",
                  isHighLoad && "animate-pulse",
                )}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor:
                    intensity > 0.02
                      ? `hsla(${hue}, 60%, 50%, ${alpha})`
                      : "#18181b",
                }}
                title={`${cell.nodeId} Cell ${cell.id} • Signal: ${Math.round(cell.signal)}%`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 text-[9px] text-zinc-600">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-[hsla(260,60%,50%,0.1)]" />
            Low
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-[hsla(245,60%,50%,0.3)]" />
            Medium
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-[hsla(230,60%,50%,0.5)]" />
            High
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

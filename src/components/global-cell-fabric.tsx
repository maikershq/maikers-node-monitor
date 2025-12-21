"use client";

import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { NodeMetrics, GlobalCell } from "@/lib/types";
import { TOTAL_CELLS, DEFAULT_REPLICATION_FACTOR } from "@/lib/types";
import { Cpu } from "lucide-react";

interface GlobalCellFabricProps {
  nodes: NodeMetrics[];
  className?: string;
}

export function GlobalCellFabric({ nodes, className }: GlobalCellFabricProps) {
  // Aggregate cells from all nodes into global view
  const globalCells = useMemo<GlobalCell[]>(() => {
    const cellMap = new Map<number, GlobalCell>();

    // Initialize all 64 cells
    for (let i = 0; i < TOTAL_CELLS; i++) {
      cellMap.set(i, {
        id: i,
        replicas: [],
        totalSignal: 0,
        totalQueueDepth: 0,
        replicationCount: 0,
        healthy: false,
      });
    }

    // Aggregate from nodes
    nodes.forEach((node) => {
      node.cells.forEach((cell) => {
        const global = cellMap.get(cell.id);
        if (global) {
          global.replicas.push({
            nodeId: node.nodeId,
            role: cell.role || "replica",
            signal: cell.signal,
            queueDepth: cell.queueDepth,
            status: node.status,
          });
          global.totalSignal += cell.signal;
          global.totalQueueDepth += cell.queueDepth;
          global.replicationCount++;
        }
      });
    });

    // Calculate health
    cellMap.forEach((cell) => {
      cell.healthy = cell.replicationCount >= DEFAULT_REPLICATION_FACTOR;
      if (cell.replicationCount > 0) {
        cell.totalSignal = cell.totalSignal / cell.replicationCount;
      }
    });

    return Array.from(cellMap.values()).sort((a, b) => a.id - b.id);
  }, [nodes]);

  const healthyCells = globalCells.filter((c) => c.healthy).length;
  const degradedCells = globalCells.filter(
    (c) => c.replicationCount > 0 && !c.healthy,
  ).length;
  const avgLoad =
    globalCells.reduce((s, c) => s + c.totalSignal, 0) / TOTAL_CELLS;

  const cols = 8; // 8x8 grid for 64 cells

  return (
    <Card className={twMerge("monitor-card h-full flex flex-col", className)}>
      <CardHeader className="pb-2 pt-3 flex-none">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[var(--sys-tee)]" />
            Shards
          </div>
          <div className="flex items-center gap-3 text-[10px] font-normal">
            <span className="text-[var(--sys-success)]">
              {healthyCells} healthy
            </span>
            {degradedCells > 0 && (
              <span className="text-[var(--sys-warn)]">
                {degradedCells} degraded
              </span>
            )}
            <span
              className={twMerge(
                "font-mono",
                avgLoad > 80
                  ? "text-[var(--sys-danger)]"
                  : avgLoad > 50
                    ? "text-[var(--sys-warn)]"
                    : "text-zinc-500",
              )}
            >
              {avgLoad.toFixed(0)}% load
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div
            className={twMerge(
              "grid gap-1 rounded overflow-hidden p-1",
              "w-full aspect-square max-w-[400px]", // Mobile: width constrained
              "lg:w-auto lg:h-full lg:max-w-none", // Desktop: height constrained
            )}
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              backgroundColor: "#0a0a0c",
            }}
          >
            {globalCells.map((cell) => {
              const intensity = cell.totalSignal / 100;
              const hue = 260 - intensity * 30;
              const alpha = 0.1 + intensity * 0.5;
              const isHighLoad = cell.totalSignal > 80;
              const isDegraded = !cell.healthy && cell.replicationCount > 0;
              const isEmpty = cell.replicationCount === 0;

              return (
                <div
                  key={cell.id}
                  className={twMerge(
                    "relative cursor-crosshair transition-all rounded aspect-square",
                    isHighLoad && "animate-pulse",
                    isDegraded && "ring-1 ring-[var(--sys-warn)]/50",
                  )}
                  style={{
                    backgroundColor: isEmpty
                      ? "#18181b"
                      : `hsla(${hue}, 60%, 50%, ${alpha})`,
                  }}
                  title={`Cell ${cell.id} • RF: ${cell.replicationCount}/${DEFAULT_REPLICATION_FACTOR} • Signal: ${Math.round(cell.totalSignal)}% • Queue: ${cell.totalQueueDepth}`}
                >
                  {/* Replication indicator dots */}
                  <div className="absolute bottom-0.5 left-0.5 flex gap-px">
                    {Array.from({ length: DEFAULT_REPLICATION_FACTOR }).map(
                      (_, i) => {
                        const isFilled = i < cell.replicationCount;
                        const replicationColor =
                          cell.replicationCount >= DEFAULT_REPLICATION_FACTOR
                            ? "bg-[var(--sys-success)]"
                            : cell.replicationCount >= 2
                              ? "bg-[var(--sys-warn)]"
                              : "bg-[var(--sys-danger)]";

                        return (
                          <div
                            key={i}
                            className={twMerge(
                              "w-1.5 h-1.5 rounded-full",
                              isFilled ? replicationColor : "bg-zinc-700",
                            )}
                          />
                        );
                      },
                    )}
                  </div>

                  {/* Queue depth indicator */}
                  {cell.totalQueueDepth > 0 && (
                    <div className="absolute top-0.5 right-0.5">
                      <div
                        className={twMerge(
                          "w-2 h-2 rounded-full",
                          cell.totalQueueDepth > 10
                            ? "bg-[var(--sys-danger)]"
                            : cell.totalQueueDepth > 5
                              ? "bg-[var(--sys-warn)]"
                              : "bg-[var(--sys-accent)]",
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-2 text-[9px] text-zinc-600 flex-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--sys-success)]" />
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--sys-warn)]" />
              <span>Degraded</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--sys-danger)]" />
              <span>Critical</span>
            </div>
          </div>
          <span className="font-mono">{TOTAL_CELLS} shards</span>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { NodeMetrics, GlobalCell } from "@/lib/types";
import { TOTAL_CELLS, DEFAULT_REPLICATION_FACTOR } from "@/lib/types";
import { Cpu, Activity, ShieldCheck, ShieldAlert, BarChart3 } from "lucide-react";

interface GlobalCellFabricProps {
  nodes: NodeMetrics[];
  className?: string;
}

export function GlobalCellFabric({ nodes, className }: GlobalCellFabricProps) {
  const [hoveredCellId, setHoveredCellId] = useState<number | null>(null);

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

    // Aggregate from online nodes only
    nodes.forEach((node) => {
      const isOnline = node.status !== "offline";
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
          if (isOnline) {
            global.totalSignal += cell.signal;
            global.totalQueueDepth += cell.queueDepth;
            global.replicationCount++;
          }
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

  const hoveredCell = useMemo(
    () => (hoveredCellId !== null ? globalCells[hoveredCellId] : null),
    [hoveredCellId, globalCells],
  );

  const healthyCells = globalCells.filter((c) => c.healthy).length;
  const degradedCells = globalCells.filter(
    (c) => c.replicationCount > 0 && !c.healthy,
  ).length;
  const avgLoad =
    globalCells.reduce((s, c) => s + c.totalSignal, 0) / TOTAL_CELLS;

  const loadPercentiles = useMemo(() => {
    const sorted = [...globalCells]
      .map((c) => c.totalQueueDepth)
      .sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p75 = sorted[Math.floor(sorted.length * 0.75)] || 0;
    const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
    return { p50, p75, p90 };
  }, [globalCells]);

  const getLoadBorderColor = (queueDepth: number): string => {
    if (queueDepth > loadPercentiles.p90 && loadPercentiles.p90 > 0)
      return "#ef4444";
    if (queueDepth > loadPercentiles.p75 && loadPercentiles.p75 > 0)
      return "#f97316";
    if (queueDepth > loadPercentiles.p50 && loadPercentiles.p50 > 0)
      return "#eab308";
    return "#3f3f46";
  };

  const cols = 8;

  return (
    <Card className={twMerge("monitor-card h-full flex flex-col", className)}>
      <CardHeader className="pb-2 pt-3 flex-none">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Cpu className="w-3.5 h-3.5 text-[var(--sys-tee)]" />
            Shards
          </CardTitle>
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
              {avgLoad.toFixed(0)}% avg load
            </span>
          </div>
        </div>

        {/* Dynamic Detail Strip */}
        <div className="h-10 bg-zinc-900/50 rounded border border-zinc-800/50 flex items-center px-3 gap-6 transition-colors">
          {hoveredCell ? (
            <>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-mono">
                  Shard
                </span>
                <span className="text-xs font-mono text-zinc-200">
                  #{hoveredCell.id.toString().padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-mono">
                  Status
                </span>
                <div className="flex items-center gap-1.5">
                  {hoveredCell.healthy ? (
                    <ShieldCheck className="w-3 h-3 text-[var(--sys-success)]" />
                  ) : (
                    <ShieldAlert className="w-3 h-3 text-[var(--sys-warn)]" />
                  )}
                  <span className="text-[10px] text-zinc-300">
                    {hoveredCell.replicationCount}/{DEFAULT_REPLICATION_FACTOR} RF
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-mono">
                  Pressure
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${hoveredCell.totalSignal}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {Math.round(hoveredCell.totalSignal)}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col ml-auto">
                <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-mono text-right">
                  Queue
                </span>
                <span className="text-[10px] font-mono text-zinc-300 text-right">
                  {hoveredCell.totalQueueDepth} pkts
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-zinc-600">
              <Activity className="w-3 h-3" />
              <span className="text-[10px]">Hover a shard for metrics</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 flex items-center justify-center py-2">
          <div
            className={twMerge(
              "grid gap-1.5 rounded-lg p-2 bg-black/40 border border-zinc-800/30",
              "w-full aspect-square max-w-[420px]",
              "lg:w-auto lg:h-full lg:max-w-none",
            )}
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
            }}
          >
            {globalCells.map((cell) => {
              const intensity = cell.totalSignal / 100;
              const isHighLoad = cell.totalSignal > 80;
              const isEmpty = cell.replicationCount === 0;
              const borderColor = getLoadBorderColor(cell.totalQueueDepth);
              const isHovered = hoveredCellId === cell.id;

              return (
                <div
                  key={cell.id}
                  onMouseEnter={() => setHoveredCellId(cell.id)}
                  onMouseLeave={() => setHoveredCellId(null)}
                  className={twMerge(
                    "relative cursor-crosshair transition-all duration-200 rounded-[2px] border group",
                    isHighLoad && "animate-pulse",
                    isHovered ? "scale-110 z-10 border-white/40 ring-4 ring-cyan-500/10" : "scale-100",
                  )}
                  style={{
                    backgroundColor: isEmpty
                      ? "#09090b"
                      : `rgba(99, 102, 241, ${0.05 + intensity * 0.4})`,
                    borderColor: isHovered ? undefined : borderColor,
                    boxShadow: isHovered && !isEmpty ? `0 0 15px rgba(99, 102, 241, ${0.2 + intensity * 0.3})` : 'none'
                  }}
                >
                  {/* Shard Background Pattern */}
                  {!isEmpty && (
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:4px_4px]" />
                  )}

                  {/* Replication Pips */}
                  <div className="absolute inset-x-0 bottom-0.5 flex justify-center gap-[1px] px-0.5">
                    {Array.from({ length: DEFAULT_REPLICATION_FACTOR }).map(
                      (_, i) => {
                        const isFilled = i < cell.replicationCount;
                        const pipColor =
                          cell.replicationCount === 0
                            ? "bg-zinc-800"
                            : cell.replicationCount >= DEFAULT_REPLICATION_FACTOR
                              ? "bg-emerald-500"
                              : cell.replicationCount === 1
                                ? "bg-red-500"
                                : "bg-amber-500";

                        return (
                          <div
                            key={i}
                            className={twMerge(
                              "h-1 rounded-[1px] transition-all",
                              isFilled ? pipColor : "bg-zinc-800",
                              "flex-1"
                            )}
                          />
                        );
                      },
                    )}
                  </div>

                  {/* Shard ID (Top Left) - only visible on high intensity or hover */}
                  <span className={twMerge(
                    "absolute top-0.5 left-0.5 text-[6px] font-mono transition-opacity",
                    isHovered ? "opacity-100 text-zinc-300" : "opacity-20 text-zinc-600"
                  )}>
                    {cell.id.toString().padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-2 text-[9px] text-zinc-600 flex-none px-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">RF:</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-[1px] bg-emerald-500" />
                <span>3+</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-[1px] bg-amber-500" />
                <span>2</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-[1px] bg-red-500" />
                <span>1</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-4">
              <span className="text-zinc-500">Pressure:</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-[1px] border border-red-500" />
                <span>Hot</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-[1px] border border-orange-500" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-[1px] border border-yellow-500" />
                <span>Med</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-zinc-500">
            <BarChart3 className="w-2.5 h-2.5" />
            <span className="font-mono">Global Mesh v1.0</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

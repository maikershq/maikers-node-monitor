"use client";

import { useMemo, useState, useRef, useEffect } from "react";
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
  const [hoveredCell, setHoveredCell] = useState<GlobalCell | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

    // Aggregate from online nodes only (offline nodes don't contribute to replication)
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
          // Only count online nodes for replication and metrics
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

  const healthyCells = globalCells.filter((c) => c.healthy).length;
  const degradedCells = globalCells.filter(
    (c) => c.replicationCount > 0 && !c.healthy,
  ).length;
  const avgLoad =
    globalCells.reduce((s, c) => s + c.totalSignal, 0) / TOTAL_CELLS;

  // Calculate load percentiles for border coloring
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
      return "#ef4444"; // red - top 10%
    if (queueDepth > loadPercentiles.p75 && loadPercentiles.p75 > 0)
      return "#f97316"; // orange - top 25%
    if (queueDepth > loadPercentiles.p50 && loadPercentiles.p50 > 0)
      return "#eab308"; // yellow - top 50%
    return "#3f3f46"; // zinc-700 - normal
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const cols = 8; // 8x8 grid for 64 cells

  return (
    <Card className={twMerge("monitor-card h-full flex flex-col relative", className)}>
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
      <CardContent className="pt-0 pb-3 flex-1 flex flex-col min-h-0 relative overflow-hidden">
        <div 
          ref={containerRef}
          className="flex-1 min-h-0 flex items-center justify-center relative overflow-auto"
          onMouseMove={handleMouseMove}
        >
          <div
            className="grid gap-1 rounded p-1 w-full max-w-full aspect-square"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${cols}, 1fr)`,
              backgroundColor: "#0a0a0c",
            }}
          >
            {globalCells.map((cell) => {
              const intensity = cell.totalSignal / 100;
              const hue = 260 - intensity * 30;
              const alpha = 0.1 + intensity * 0.5;
              const isHighLoad = cell.totalSignal > 80;
              const isEmpty = cell.replicationCount === 0;
              const borderColor = getLoadBorderColor(cell.totalQueueDepth);

              return (
                <div
                  key={cell.id}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={twMerge(
                    "relative cursor-crosshair transition-all rounded border",
                    isHighLoad && "animate-pulse",
                    hoveredCell?.id === cell.id && "z-10 ring-1 ring-white/30"
                  )}
                  style={{
                    backgroundColor: isEmpty
                      ? "#18181b"
                      : `hsla(${hue}, 60%, 50%, ${alpha})`,
                    borderColor,
                  }}
                >
                  {/* Replication indicator dots */}
                  <div className="absolute bottom-0.5 left-0.5 flex gap-px">
                    {Array.from({ length: DEFAULT_REPLICATION_FACTOR }).map(
                      (_, i) => {
                        const isFilled = i < cell.replicationCount;
                        const replicationColor =
                          cell.replicationCount === 0
                            ? "bg-zinc-700"
                            : cell.replicationCount >=
                                DEFAULT_REPLICATION_FACTOR
                              ? "bg-[var(--sys-success)]"
                              : cell.replicationCount === 1
                                ? "bg-[var(--sys-danger)]"
                                : "bg-[var(--sys-warn)]";

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
                </div>
              );
            })}
          </div>

          {/* Custom Tooltip */}
          {hoveredCell && (
            <div 
              className="absolute z-50 pointer-events-none bg-zinc-900/95 border border-zinc-800 rounded px-2 py-1.5 shadow-2xl backdrop-blur-md min-w-[120px]"
              style={{
                left: `${mousePos.x + 12}px`,
                top: `${mousePos.y + 12}px`,
              }}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-1">
                  <span className="text-[10px] font-mono text-zinc-400">Shard #{hoveredCell.id.toString().padStart(2, '0')}</span>
                  <span className={twMerge(
                    "text-[8px] px-1 rounded",
                    hoveredCell.healthy ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                  )}>
                    {hoveredCell.healthy ? "HEALTHY" : "DEGRADED"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  <span className="text-[9px] text-zinc-500">Replication</span>
                  <span className="text-[9px] text-zinc-200 font-mono text-right">{hoveredCell.replicationCount}/{DEFAULT_REPLICATION_FACTOR}</span>
                  <span className="text-[9px] text-zinc-500">Signal</span>
                  <span className="text-[9px] text-zinc-200 font-mono text-right">{Math.round(hoveredCell.totalSignal)}%</span>
                  <span className="text-[9px] text-zinc-500">Queue</span>
                  <span className="text-[9px] text-zinc-200 font-mono text-right">{hoveredCell.totalQueueDepth}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-2 text-[9px] text-zinc-600 flex-none flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">RF:</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <span>0</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--sys-danger)]" />
              <span>1</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--sys-warn)]" />
              <span>2</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--sys-success)]" />
              <span>3+</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Load:</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm border border-[#ef4444] bg-zinc-900" />
              <span>Hot</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm border border-[#f97316] bg-zinc-900" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm border border-[#eab308] bg-zinc-900" />
              <span>Med</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

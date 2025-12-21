"use client";

import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { NodeMetrics, GlobalCell } from "@/lib/types";
import { TOTAL_CELLS, DEFAULT_REPLICATION_FACTOR } from "@/lib/types";
import { Cpu, AlertCircle } from "lucide-react";

interface GlobalCellFabricProps {
  nodes: NodeMetrics[];
  className?: string;
}

export function GlobalCellFabric({ nodes, className }: GlobalCellFabricProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

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

  const healthyCells = globalCells.filter((c) => c.healthy).length;
  const degradedCells = globalCells.filter(
    (c) => c.replicationCount > 0 && !c.healthy,
  ).length;
  const avgLoad =
    globalCells.reduce((s, c) => s + c.totalSignal, 0) / TOTAL_CELLS;

  const cols = 8;

  return (
    <Card className={twMerge("monitor-card h-full flex flex-col", className)}>
      <CardHeader className="pb-3 pt-4 flex-none">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[var(--sys-tee)]" />
            Shards
          </div>
          <div className="flex items-center gap-4 text-[11px] font-normal">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--sys-success)]" />
              <span className="text-zinc-400">{healthyCells} healthy</span>
            </div>
            {degradedCells > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--sys-warn)] animate-pulse" />
                <span className="text-zinc-400">{degradedCells} degraded</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-4">
              <span className="text-zinc-500 font-mono">{avgLoad.toFixed(0)}% avg load</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 pb-4 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div
            className={twMerge(
              "grid gap-1.5",
              "w-full aspect-square max-w-[440px]",
              "lg:w-auto lg:h-full lg:max-w-none",
            )}
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
            }}
          >
            {globalCells.map((cell) => {
              const intensity = cell.totalSignal / 100;
              const isEmpty = cell.replicationCount === 0;
              const isDegraded = !cell.healthy && !isEmpty;
              const isHighQueue = cell.totalQueueDepth > 5;
              const isHovered = hoveredId === cell.id;

              return (
                <div
                  key={cell.id}
                  onMouseEnter={() => setHoveredId(cell.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={twMerge(
                    "relative cursor-crosshair transition-all duration-150 rounded-sm border overflow-hidden",
                    isDegraded && "border-amber-500/40 ring-1 ring-amber-500/20",
                    !isDegraded && "border-white/5",
                    isHovered && "scale-105 z-10 border-white/20 shadow-xl",
                  )}
                  style={{
                    backgroundColor: isEmpty
                      ? "#09090b"
                      : `rgba(99, 102, 241, ${0.05 + intensity * 0.4})`,
                  }}
                >
                  {/* Heatmap overlay for signal intensity */}
                  {!isEmpty && (
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-50"
                      style={{
                        background: `radial-gradient(circle at center, rgba(139, 92, 246, ${intensity}), transparent)`,
                      }}
                    />
                  )}

                  {/* Replication Dots (Glanceable RF) */}
                  <div className="absolute bottom-1 inset-x-0 flex justify-center gap-0.5 px-0.5">
                    {Array.from({ length: DEFAULT_REPLICATION_FACTOR }).map((_, i) => {
                      const isFilled = i < cell.replicationCount;
                      const dotColor = 
                        cell.replicationCount >= DEFAULT_REPLICATION_FACTOR ? "bg-emerald-500" :
                        cell.replicationCount === 2 ? "bg-amber-500" :
                        cell.replicationCount === 1 ? "bg-red-500" : "bg-zinc-800";
                      
                      return (
                        <div 
                          key={i}
                          className={twMerge(
                            "w-1 h-1 rounded-full transition-colors duration-300",
                            isFilled ? dotColor : "bg-zinc-800/50"
                          )}
                        />
                      );
                    })}
                  </div>

                  {/* Congestion Indicator (Top Right) */}
                  {cell.totalQueueDepth > 0 && (
                    <div className="absolute top-0.5 right-0.5">
                      <div className={twMerge(
                        "w-1.5 h-1.5 rounded-full",
                        isHighQueue ? "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)] animate-pulse" : "bg-cyan-400"
                      )} />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  {isHovered && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-1 animate-in fade-in duration-200">
                      <span className="text-[9px] font-mono text-white leading-none mb-1">#{cell.id}</span>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[7px] text-zinc-400 font-mono">{cell.replicationCount} RF</span>
                        <span className="text-[7px] text-zinc-400 font-mono">{cell.totalQueueDepth} Q</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Simplified Legend */}
        <div className="flex items-center justify-between mt-3 px-2 text-[10px] text-zinc-500 border-t border-zinc-800/50 pt-3">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 uppercase tracking-tighter text-[9px]">Replication:</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Healthy (3+)" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Degraded (2)" />
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Critical (1)" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 uppercase tracking-tighter text-[9px]">Queue:</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="Processing" />
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Backlogged" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-zinc-600 uppercase tracking-tighter text-[9px]">Load:</span>
             <div className="flex items-center h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500/50 w-full bg-gradient-to-r from-transparent to-indigo-500" />
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

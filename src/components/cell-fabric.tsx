"use client";

import { twMerge } from "tailwind-merge";
import type { CellMetrics } from "@/lib/types";

interface CellFabricProps {
  cells: CellMetrics[];
  className?: string;
}

export function CellFabric({ cells, className }: CellFabricProps) {
  const cols = Math.ceil(Math.sqrt(cells.length));

  return (
    <div
      className={twMerge("grid gap-px rounded-lg overflow-hidden", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        backgroundColor: "#27272a",
      }}
    >
      {cells.map((cell) => {
        const intensity = cell.signal / 100;
        // Purple hue shifting from simulation: 260 - intensity * 30
        const hue = 260 - intensity * 30;
        const alpha = 0.05 + intensity * 0.35;
        const isHighLoad = cell.signal > 80;
        const dots = Math.min(cell.queueDepth, 9);

        return (
          <div
            key={cell.id}
            className={twMerge(
              "cell-shard aspect-square relative cursor-crosshair",
              isHighLoad && "animate-backpressure border border-transparent",
            )}
            style={{
              backgroundColor:
                intensity > 0.02
                  ? `hsla(${hue}, 60%, 50%, ${alpha})`
                  : "#18181b",
            }}
            title={`Cell ${cell.id} • Signal: ${Math.round(cell.signal)}% • Queue: ${cell.queueDepth}`}
          >
            {/* Task dots grid */}
            {dots > 0 && (
              <div className="absolute inset-0 p-[15%] grid grid-cols-3 gap-px content-center justify-items-center pointer-events-none">
                {Array.from({ length: dots }).map((_, i) => {
                  let dotClass = "dot-quick";
                  if (cell.queueDepth > 8) dotClass = "dot-heavy";
                  else if (cell.queueDepth > 4) dotClass = "dot-medium";

                  return (
                    <div
                      key={i}
                      className={twMerge("w-1 h-1 rounded-full", dotClass)}
                    />
                  );
                })}
              </div>
            )}

            {/* Gossip distress pulse */}
            {isHighLoad && (
              <div className="absolute inset-0 bg-[var(--sys-danger)]/20 animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { twMerge } from "tailwind-merge";
import type { CellMetrics } from "@/lib/types";

interface CellFabricProps {
  cells: CellMetrics[];
  className?: string;
}

export function CellFabric({ cells, className }: CellFabricProps) {
  const total = cells.length;
  // Calculate optimal columns - aim for roughly square grid
  const cols = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / cols);

  // Calculate cell size based on count - smaller cells for more cells
  const cellSize = total > 64 ? 8 : total > 36 ? 10 : total > 16 ? 12 : 14;

  return (
    <div
      className={twMerge("inline-grid gap-px rounded", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        backgroundColor: "#27272a",
      }}
    >
      {cells.map((cell) => {
        const intensity = cell.signal / 100;
        const hue = 260 - intensity * 30;
        const alpha = 0.08 + intensity * 0.4;
        const isHighLoad = cell.signal > 80;
        const hasTasks = cell.queueDepth > 0;

        return (
          <div
            key={cell.id}
            className={twMerge(
              "cell-shard relative cursor-crosshair",
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
            {/* Activity indicator dot */}
            {hasTasks && (
              <div
                className={twMerge(
                  "absolute inset-0 m-auto w-1 h-1 rounded-full",
                  cell.queueDepth > 8
                    ? "dot-heavy"
                    : cell.queueDepth > 4
                      ? "dot-medium"
                      : "dot-quick",
                )}
              />
            )}

            {isHighLoad && (
              <div className="absolute inset-0 bg-[var(--sys-danger)]/25 animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );
}

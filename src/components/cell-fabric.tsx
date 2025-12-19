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
      className={twMerge(
        "grid gap-px bg-zinc-800/50 p-px rounded-lg",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {cells.map((cell) => {
        const intensity = cell.signal / 100;
        // Cyan to teal gradient based on intensity
        const bgColor =
          intensity > 0.05
            ? `rgba(6, 182, 212, ${0.1 + intensity * 0.5})`
            : "transparent";

        return (
          <div
            key={cell.id}
            className="aspect-square bg-zinc-900 relative group cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 hover:ring-1 hover:ring-cyan-400/50"
            style={{ backgroundColor: bgColor }}
            title={`Cell ${cell.id}: Signal ${cell.signal.toFixed(0)}%, Queue ${cell.queueDepth}`}
          >
            {cell.queueDepth > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[6px] text-zinc-400 font-mono tabular-nums">
                  {cell.queueDepth}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

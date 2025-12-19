"use client";

import { cn } from "@/lib/utils";
import type { CellMetrics } from "@/lib/types";

interface CellFabricProps {
  cells: CellMetrics[];
  className?: string;
}

export function CellFabric({ cells, className }: CellFabricProps) {
  const cols = Math.ceil(Math.sqrt(cells.length));

  return (
    <div
      className={cn("grid gap-px bg-zinc-800 p-px rounded", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {cells.map((cell) => {
        const intensity = cell.signal / 100;
        const hue = 260 - intensity * 40;
        const bgColor =
          intensity > 0.05
            ? `hsla(${hue}, 60%, 50%, ${0.1 + intensity * 0.5})`
            : "transparent";

        return (
          <div
            key={cell.id}
            className="aspect-square bg-zinc-900 relative group cursor-pointer transition-transform hover:scale-110 hover:z-10"
            style={{ backgroundColor: bgColor }}
            title={`Cell ${cell.id}: Signal ${cell.signal.toFixed(0)}%, Queue ${cell.queueDepth}`}
          >
            {cell.queueDepth > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[6px] text-zinc-400 font-mono">
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

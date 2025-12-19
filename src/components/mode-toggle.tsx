"use client";

import { twMerge } from "tailwind-merge";
import type { DataMode } from "@/hooks/useNodes";
import { Radio, Wifi } from "lucide-react";

interface ModeToggleProps {
  mode: DataMode;
  onChange: (mode: DataMode) => void;
  className?: string;
}

export function ModeToggle({ mode, onChange, className }: ModeToggleProps) {
  return (
    <div
      className={twMerge(
        "flex items-center gap-1 bg-zinc-900 rounded-lg p-1",
        className,
      )}
    >
      <button
        onClick={() => onChange("live")}
        className={twMerge(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
          mode === "live"
            ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50"
            : "text-zinc-500 hover:text-zinc-300",
        )}
      >
        <Wifi className="w-3.5 h-3.5" />
        Live
      </button>
      <button
        onClick={() => onChange("simulation")}
        className={twMerge(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
          mode === "simulation"
            ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50"
            : "text-zinc-500 hover:text-zinc-300",
        )}
      >
        <Radio className="w-3.5 h-3.5" />
        Simulate
      </button>
    </div>
  );
}

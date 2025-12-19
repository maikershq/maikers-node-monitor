"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import type { NodeConnection } from "@/lib/node-client";
import { Plus, X, Circle } from "lucide-react";

interface EndpointManagerProps {
  connections: NodeConnection[];
  onAdd: (endpoint: string) => void;
  onRemove: (endpoint: string) => void;
  className?: string;
}

export function EndpointManager({
  connections,
  onAdd,
  onRemove,
  className,
}: EndpointManagerProps) {
  const [newEndpoint, setNewEndpoint] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newEndpoint.trim()) {
      onAdd(newEndpoint.trim());
      setNewEndpoint("");
      setIsAdding(false);
    }
  };

  return (
    <div className={twMerge("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 font-medium">
          Node Endpoints
        </span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      {isAdding && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newEndpoint}
            onChange={(e) => setNewEndpoint(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="http://localhost:8080"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={handleAdd}
            className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs hover:bg-cyan-500/30"
          >
            Add
          </button>
        </div>
      )}

      <div className="space-y-1">
        {connections.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">
            No endpoints configured
          </p>
        ) : (
          connections.map((conn) => (
            <div
              key={conn.endpoint}
              className="flex items-center justify-between bg-zinc-900/50 rounded px-2 py-1.5"
            >
              <div className="flex items-center gap-2">
                <Circle
                  className={twMerge(
                    "w-2 h-2",
                    conn.connected
                      ? "text-cyan-400 fill-cyan-400"
                      : "text-zinc-600",
                  )}
                />
                <span className="text-xs text-zinc-400 font-mono truncate max-w-[180px]">
                  {conn.endpoint}
                </span>
              </div>
              <button
                onClick={() => onRemove(conn.endpoint)}
                className="text-zinc-600 hover:text-red-400 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

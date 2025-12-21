"use client";

import { formatNumber } from "@/lib/utils";

interface StackMetrics {
  ingestRate: number;
  nodeCount: number;
  pendingTasks: number;
  shardCount: number;
  activeNodes: number;
  stateDurability: number;
}

interface ArchitectureStackProps {
  metrics: StackMetrics;
}

export function ArchitectureStack({ metrics }: ArchitectureStackProps) {
  return (
    <div className="w-full md:w-48 flex flex-col gap-1">
      <div className="bg-[#0a0a0c] border border-zinc-800/50 rounded p-2 flex-1 flex flex-col text-[10px] font-mono">
        <div className="font-bold text-white text-xs mb-2 border-b border-zinc-800 pb-1">
          ARCHITECTURE STACK
        </div>

        {/* INGEST LAYER */}
        <div className="border-l-2 border-blue-500 pl-2 py-1.5 bg-blue-500/5 mb-1 transition-all hover:bg-blue-500/10">
          <div className="text-blue-400 font-bold flex justify-between">
            <span>🌐 INGEST</span>
          </div>
          <div className="text-zinc-500 tabular-nums">
            {formatNumber(metrics.ingestRate)} req/s
          </div>
        </div>

        {/* DISCOVERY LAYER */}
        <div className="border-l-2 border-cyan-500 pl-2 py-1.5 bg-cyan-500/5 mb-1 transition-all hover:bg-cyan-500/10">
          <div className="text-cyan-400 font-bold flex justify-between">
            <span>📡 DISCOVERY</span>
          </div>
          <div className="text-zinc-500 tabular-nums">
            {metrics.nodeCount} nodes
          </div>
        </div>

        {/* COORDINATOR LAYER */}
        <div className="border-l-2 border-amber-500 pl-2 py-1.5 bg-amber-500/5 mb-1 transition-all hover:bg-amber-500/10">
          <div className="text-amber-400 font-bold flex justify-between">
            <span>📨 COORDINATOR</span>
          </div>
          <div className="text-zinc-500 tabular-nums">
            {formatNumber(metrics.pendingTasks)} pending
          </div>
        </div>

        {/* CELL FABRIC LAYER */}
        <div className="border-l-2 border-indigo-500 pl-2 py-1.5 bg-indigo-500/5 mb-1 transition-all hover:bg-indigo-500/10">
          <div className="text-indigo-400 font-bold flex justify-between">
            <span>🧠 CELL FABRIC</span>
          </div>
          <div className="text-zinc-500 tabular-nums">
            {metrics.shardCount} shards
          </div>
        </div>

        {/* TEE NODES LAYER */}
        <div className="border-l-2 border-purple-500 pl-2 py-1.5 bg-purple-500/5 mb-1 transition-all hover:bg-purple-500/10">
          <div className="text-purple-400 font-bold flex justify-between">
            <span>🔒 TEE NODES</span>
          </div>
          <div className="text-zinc-500 tabular-nums">
            {metrics.activeNodes} active
          </div>
        </div>

        {/* STATE ANCHOR LAYER */}
        <div className="border-l-2 border-emerald-500 pl-2 py-1.5 bg-emerald-500/5 transition-all hover:bg-emerald-500/10">
          <div className="text-emerald-400 font-bold flex justify-between">
            <span>💾 STATE ANCHOR</span>
          </div>
          <div className="text-zinc-500 tabular-nums">
            {metrics.stateDurability}% durable
          </div>
        </div>

        {/* Flow Indicators Legend */}
        <div className="mt-auto pt-3 border-t border-zinc-800 text-zinc-500">
          <div className="flex items-center gap-2 text-[9px] mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Encrypted payload flow
          </div>
          <div className="flex items-center gap-2 text-[9px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Attestation verified
          </div>
        </div>
      </div>
    </div>
  );
}

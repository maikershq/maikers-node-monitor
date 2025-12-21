"use client";

import { useEffect, useRef } from "react";
import { formatNumber } from "@/lib/utils";
import type { TimeSeriesPoint } from "@/lib/types";

interface MonitorHeaderProps {
  stats: {
    throughput: number;
    totalNodes: number;
    activeNodes: number;
    activeWorkers: number;
    peers: number;
    globalLoad: number;
    latencyP99: number;
    memoryPages: number;
    uptime: number;
  };
  timeSeries: TimeSeriesPoint[];
  paused?: boolean;
}

export function MonitorHeader({
  stats,
  timeSeries,
  paused,
}: MonitorHeaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (timeSeries.length < 2) return;

    const max = Math.max(...timeSeries.map((p) => p.throughput), 1);

    ctx.strokeStyle = "#6366f1"; // sys-accent
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    timeSeries.forEach((p, i) => {
      const x = (i / (timeSeries.length - 1)) * w;
      const y = h - (p.throughput / max) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }, [timeSeries]);

  const loadColor =
    stats.globalLoad > 90
      ? "text-red-500"
      : stats.globalLoad > 70
        ? "text-amber-500"
        : "text-white";

  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-3 border-b border-zinc-800/50 bg-[#0a0a0c]/50 gap-4 md:gap-0">
      <div className="flex items-center gap-3 min-w-max">
        <div
          className={`w-2 h-2 rounded-full ${paused ? "bg-amber-500" : "bg-[#6366f1] animate-pulse"}`}
        />
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
            Node Monitor
            {paused && (
              <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded">
                PAUSED
              </span>
            )}
          </h1>
          <p className="text-[10px] text-zinc-500 font-mono">
            TEE-Protected • {Math.floor(stats.uptime / 3600)}h{" "}
            {Math.floor((stats.uptime % 3600) / 60)}m uptime
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center md:justify-end gap-6 md:gap-8 text-xs font-mono">
        <div className="text-center min-w-[4rem]">
          <div className="text-zinc-500 text-[10px]">THROUGHPUT</div>
          <div className="text-lg text-white font-bold tabular-nums">
            {formatNumber(stats.throughput)}
          </div>
          <canvas
            ref={canvasRef}
            width={64}
            height={16}
            className="w-16 h-4 mt-0.5 opacity-80"
          />
        </div>

        <div className="text-center min-w-[5rem]">
          <div className="text-zinc-500 text-[10px]">NODES / WORKERS</div>
          <div className="text-lg text-[#6366f1] font-bold tabular-nums">
            {stats.activeNodes} / {stats.totalNodes}
          </div>
          <div className="text-[10px] text-zinc-600 tabular-nums">
            {formatNumber(stats.activeWorkers)} workers
          </div>
        </div>

        <div className="text-center min-w-[4rem]">
          <div className="text-zinc-500 text-[10px]">PEERS</div>
          <div className="text-lg text-cyan-400 font-bold tabular-nums">
            {stats.peers}
          </div>
          <div className="text-[10px] text-zinc-600">discovered</div>
        </div>

        <div className="text-center min-w-[4rem]">
          <div className="text-zinc-500 text-[10px]">GLOBAL LOAD</div>
          <div className={`text-lg font-bold tabular-nums ${loadColor}`}>
            {stats.globalLoad}%
          </div>
          <div className="text-[10px] text-zinc-600">
            {stats.globalLoad > 90 ? "BACKPRESSURE" : ""}
          </div>
        </div>

        <div className="text-center min-w-[4rem]">
          <div className="text-zinc-500 text-[10px]">LATENCY P99</div>
          <div className="text-lg text-emerald-500 font-bold tabular-nums">
            {Math.round(stats.latencyP99)}ms
          </div>
        </div>

        <div className="text-center min-w-[4rem]">
          <div className="text-zinc-500 text-[10px]">MEMORY</div>
          <div className="text-lg text-amber-400 font-bold tabular-nums">
            {stats.memoryPages}/16
          </div>
          <div className="text-[10px] text-zinc-600">pages</div>
        </div>
      </div>
    </header>
  );
}

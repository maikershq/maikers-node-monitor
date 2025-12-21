"use client";

import { useEffect, useRef } from "react";
import type { NodeMetrics } from "@/lib/types";

interface NodePoolVisualizerProps {
  nodes: NodeMetrics[];
  className?: string;
}

export function NodePoolVisualizer({
  nodes,
  className,
}: NodePoolVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    if (nodes.length === 0) return;

    // Config
    const spacing = 1;
    let dotSize = 6;
    if (nodes.length > 100) dotSize = 5;
    if (nodes.length > 500) dotSize = 4;
    if (nodes.length > 1000) dotSize = 3;
    if (nodes.length > 3000) dotSize = 2;

    const cols = Math.floor(width / (dotSize + spacing));
    // const rows = Math.ceil(nodes.length / cols); // Not used currently

    nodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * (dotSize + spacing);
      const y = row * (dotSize + spacing);

      // Color logic based on state/load
      // In simulation: attesting=amber, working=purple (green if near completion), idle=gray
      // Mapping real metrics:
      // - Offline: Red/Gray
      // - High load (>80% workers): Green
      // - Med load: Purple
      // - Low load/Idle: Gray

      let color = "#374151"; // idle/gray

      if (node.status === "offline") {
        color = "#ef4444"; // red
      } else if (node.status === "degraded") {
        color = "#f59e0b"; // amber
      } else {
        const load = node.workers.active / (node.workers.total || 1);
        if (load > 0) {
          color = "#8b5cf6"; // synced/purple
          if (load > 0.8) color = "#10b981"; // heavy work/green (matching sim logic)
        } else if (node.teeAttested) {
          // Idle but attested, maybe show as amber like "ready/attesting" in sim
          color = "#374151";
        }
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      // Round rect approx using arc for small dots or rect
      if (dotSize > 2) {
        const radius = dotSize * 0.2;
        ctx.roundRect(x, y, dotSize, dotSize, radius);
      } else {
        ctx.rect(x, y, dotSize, dotSize);
      }
      ctx.fill();
    });
  }, [nodes]);

  return (
    <div
      className={`bg-[#0a0a0c] border border-zinc-800/50 rounded-lg p-2 ${className}`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-zinc-500 font-bold font-mono">
          NODE POOL
        </span>
        <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
          {nodes.length} nodes
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-14 block"
        style={{ width: "100%", height: "56px" }}
      />
    </div>
  );
}

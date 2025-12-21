"use client";

import { useMemo } from "react";
import type { NodeMetrics } from "@/lib/types";
import { formatLatency } from "@/lib/utils";

interface LatencyHistogramProps {
  nodes: NodeMetrics[];
  buckets?: number;
}

export function LatencyHistogram({
  nodes,
  buckets = 20,
}: LatencyHistogramProps) {
  const { histogram, min, max, p50, p95, p99 } = useMemo(() => {
    // Collect all latency samples
    const samples: number[] = [];
    nodes.forEach((node) => {
      if (node.status !== "offline" && node.latency.samples > 0) {
        // Use p50, p95, p99 as representative samples
        samples.push(node.latency.p50, node.latency.p95, node.latency.p99);
      }
    });

    if (samples.length === 0) {
      return { histogram: [], min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const range = max - min || 1;
    const bucketSize = range / buckets;

    const counts = new Array(buckets).fill(0);
    samples.forEach((v) => {
      const idx = Math.min(Math.floor((v - min) / bucketSize), buckets - 1);
      counts[idx]++;
    });

    const maxCount = Math.max(...counts, 1);
    const histogram = counts.map((count, i) => ({
      count,
      height: (count / maxCount) * 100,
      rangeStart: min + i * bucketSize,
      rangeEnd: min + (i + 1) * bucketSize,
    }));

    // Calculate percentiles
    const getPercentile = (p: number) => sorted[Math.floor(sorted.length * p)];

    return {
      histogram,
      min,
      max,
      p50: getPercentile(0.5),
      p95: getPercentile(0.95),
      p99: getPercentile(0.99),
    };
  }, [nodes, buckets]);

  if (histogram.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
        No latency data
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Histogram Bars */}
      <div className="flex-1 flex items-end gap-px">
        {histogram.map((bucket, i) => {
          const ratio = i / buckets;
          let colorClass = "bg-[var(--sys-success)]";
          if (ratio > 0.8) colorClass = "bg-[var(--sys-danger)]";
          else if (ratio > 0.5) colorClass = "bg-[var(--sys-warn)]";

          return (
            <div
              key={i}
              className="flex-1 min-w-0"
              title={`${formatLatency(bucket.rangeStart)} - ${formatLatency(bucket.rangeEnd)}: ${bucket.count} samples`}
            >
              <div
                className={`w-full ${colorClass} rounded-t-sm transition-all`}
                style={{ height: `${bucket.height}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* X Axis Labels */}
      <div className="flex justify-between text-[9px] text-zinc-600 mt-1 pt-1 border-t border-zinc-800/50">
        <span>{formatLatency(min)}</span>
        <span>{formatLatency(max)}</span>
      </div>

      {/* Percentile Stats */}
      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-zinc-800/50 text-center">
        <div>
          <div className="text-[9px] text-zinc-500">P50</div>
          <div className="text-xs font-mono text-[var(--sys-success)]">
            {formatLatency(p50)}
          </div>
        </div>
        <div>
          <div className="text-[9px] text-zinc-500">P95</div>
          <div className="text-xs font-mono text-[var(--sys-warn)]">
            {formatLatency(p95)}
          </div>
        </div>
        <div>
          <div className="text-[9px] text-zinc-500">P99</div>
          <div className="text-xs font-mono text-[var(--sys-danger)]">
            {formatLatency(p99)}
          </div>
        </div>
      </div>
    </div>
  );
}

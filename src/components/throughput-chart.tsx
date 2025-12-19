"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TimeSeriesPoint } from "@/lib/types";

interface ThroughputChartProps {
  data: TimeSeriesPoint[];
}

export function ThroughputChart({ data }: ThroughputChartProps) {
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTime}
          stroke="#52525b"
          fontSize={10}
        />
        <YAxis stroke="#52525b" fontSize={10} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelFormatter={(ts) => new Date(ts as number).toLocaleTimeString()}
        />
        <Area
          type="monotone"
          dataKey="throughput"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#throughputGrad)"
          name="Throughput"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

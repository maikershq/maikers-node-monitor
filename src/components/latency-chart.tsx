"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TimeSeriesPoint } from "@/lib/types";

interface LatencyChartProps {
  data: TimeSeriesPoint[];
}

export function LatencyChart({ data }: LatencyChartProps) {
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
        <Legend wrapperStyle={{ fontSize: "10px" }} />
        <Line
          type="monotone"
          dataKey="latencyP50"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          name="P50"
        />
        <Line
          type="monotone"
          dataKey="latencyP99"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          name="P99"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

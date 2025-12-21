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
      <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTime}
          stroke="#52525b"
          fontSize={10}
        />
        <YAxis stroke="#52525b" fontSize={10} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#181818",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
          labelFormatter={(ts) => new Date(ts as number).toLocaleTimeString()}
        />
        <Legend wrapperStyle={{ fontSize: "10px" }} />
        <Line
          type="monotone"
          dataKey="latencyP50"
          stroke="#06b6d4"
          strokeWidth={2}
          dot={false}
          name="P50"
        />
        <Line
          type="monotone"
          dataKey="latencyP99"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          name="P99"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

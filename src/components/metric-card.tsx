"use client";

import { twMerge } from "tailwind-merge";
import { Card, CardContent } from "./ui/card";

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subValue,
  trend,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={twMerge("monitor-card transition-all duration-300", className)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
              {label}
            </p>
            <p
              className={twMerge(
                "text-2xl font-heading font-bold mt-1 tabular-nums",
                trend === "up" && "text-cyan-400",
                trend === "down" && "text-red-400",
                !trend && "text-white",
              )}
            >
              {value}
            </p>
            {subValue && (
              <p className="text-xs text-zinc-500 mt-0.5">{subValue}</p>
            )}
          </div>
          {icon && <div className="text-zinc-600">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

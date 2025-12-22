"use client";

import { twMerge } from "tailwind-merge";
import { Card, CardContent } from "./ui/card";

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  valueColor?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subValue,
  trend,
  valueColor,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={twMerge("monitor-card transition-all duration-300", className)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
              {label}
            </p>
            <p
              className="text-xl font-heading font-bold mt-0.5 tabular-nums truncate"
              style={valueColor ? { color: valueColor } : undefined}
            >
              <span
                className={twMerge(
                  !valueColor && trend === "up" && "text-[var(--sys-success)]",
                  !valueColor && trend === "down" && "text-[var(--sys-danger)]",
                  !valueColor && !trend && "text-white",
                )}
              >
                {value}
              </span>
            </p>
            {subValue && (
              <p className="text-[10px] text-zinc-600 mt-0.5">{subValue}</p>
            )}
          </div>
          {icon && (
            <div
              className={twMerge(
                "text-zinc-600 flex-shrink-0",
                trend === "up" && "text-[var(--sys-success)]/50",
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

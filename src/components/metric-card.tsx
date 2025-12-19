import { cn } from "@/lib/utils";
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
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              {label}
            </p>
            <p
              className={cn(
                "text-2xl font-bold mt-1",
                trend === "up" && "text-emerald-500",
                trend === "down" && "text-red-500",
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

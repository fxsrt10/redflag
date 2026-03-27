import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, subValue, className, trend }: StatCardProps) {
  return (
    <div className={cn("bg-card border border-card-border rounded-xl p-4", className)}>
      <div className="text-[10px] text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold tracking-tight flex items-center gap-2">
        {value}
        {trend && (
          <span className={cn("text-xs", trend === "up" ? "text-red-400" : trend === "down" ? "text-emerald-400" : "text-muted")}>
            {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
          </span>
        )}
      </div>
      {subValue && <div className="text-xs text-muted mt-0.5">{subValue}</div>}
    </div>
  );
}

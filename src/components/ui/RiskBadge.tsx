import { cn, getRiskBg, getRiskColor } from "@/lib/utils";

interface RiskBadgeProps {
  level: string;
  score: number;
  size?: "sm" | "md" | "lg";
}

export function RiskBadge({ level, score, size = "md" }: RiskBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium capitalize",
        getRiskBg(level),
        getRiskColor(level),
        sizeClasses[size]
      )}
    >
      <span className="font-bold">{score}</span>
      <span className="opacity-70">/ 100</span>
      <span className="ml-1 text-[10px] uppercase tracking-wider opacity-80">{level}</span>
    </span>
  );
}

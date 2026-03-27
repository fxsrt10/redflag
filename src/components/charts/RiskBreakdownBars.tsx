import type { RiskScore } from "@/types";
import { cn, getScoreLevel, getRiskBgSolid, getRiskColor } from "@/lib/utils";

interface RiskBreakdownBarsProps {
  riskScore: RiskScore;
}

const COMPONENTS: { key: keyof RiskScore; label: string; weight: string }[] = [
  { key: "filingRate", label: "Filing Rate", weight: "30%" },
  { key: "sentimentTrend", label: "Sentiment Trend", weight: "25%" },
  { key: "themeConcentration", label: "Theme Concentration", weight: "20%" },
  { key: "filingAcceleration", label: "Filing Acceleration", weight: "15%" },
  { key: "warnSignal", label: "WARN / Layoff Signal", weight: "10%" },
];

export function RiskBreakdownBars({ riskScore }: RiskBreakdownBarsProps) {
  return (
    <div className="space-y-3">
      {COMPONENTS.map(({ key, label, weight }) => {
        const value = riskScore[key] as number;
        const level = getScoreLevel(value);
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground">{label}</span>
                <span className="text-[10px] text-muted">({weight})</span>
              </div>
              <span className={cn("text-xs font-bold", getRiskColor(level))}>{value}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", getRiskBgSolid(level))}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

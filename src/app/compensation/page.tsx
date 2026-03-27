"use client";

import { useState, useEffect } from "react";
import { riskRewardData as staticRiskRewardData, companies as staticCompanies } from "@/data/mock";
import type { Company } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { cn, getRiskColor, getRiskBgSolid, formatCurrency, getRiskBg } from "@/lib/utils";
import { DollarSign, TrendingUp, AlertTriangle, ArrowUpDown } from "lucide-react";

export default function CompensationPage() {
  const [companies, setCompanies] = useState<Company[]>(staticCompanies);
  const [sortBy, setSortBy] = useState<"comp" | "risk" | "ratio" | "glassdoor">("ratio");

  useEffect(() => {
    fetch("/api/companies?limit=200")
      .then((r) => r.json())
      .then((data) => { if (data.companies?.length > 0) setCompanies(data.companies); })
      .catch(() => {});
  }, []);

  const riskRewardData = companies.map((c) => ({
    companyId: c.id,
    companyName: c.name,
    ticker: c.ticker,
    riskScore: c.riskScore?.overall ?? 0,
    riskLevel: c.riskScore?.riskLevel ?? ("moderate" as const),
    medianTotalComp: c.compensation?.medianTotalComp ?? 0,
    glassdoorOverall: c.glassdoor?.overall ?? 0,
    industry: c.industry ?? "",
    sizeBucket: c.sizeBucket ?? "",
    employeeCount: c.employeeCount ?? 0,
  }));

  const dataWithRatio = riskRewardData.map((d) => ({
    ...d,
    riskRewardRatio: d.medianTotalComp > 0 ? d.medianTotalComp / Math.max(d.riskScore, 1) : 0,
  }));

  const sorted = [...dataWithRatio].sort((a, b) => {
    switch (sortBy) {
      case "comp": return b.medianTotalComp - a.medianTotalComp;
      case "risk": return b.riskScore - a.riskScore;
      case "ratio": return b.riskRewardRatio - a.riskRewardRatio;
      case "glassdoor": return b.glassdoorOverall - a.glassdoorOverall;
      default: return 0;
    }
  });

  const avgComp = Math.round(dataWithRatio.reduce((s, d) => s + d.medianTotalComp, 0) / dataWithRatio.length);
  const highestPay = dataWithRatio.reduce((max, d) => d.medianTotalComp > max.medianTotalComp ? d : max);
  const bestRatio = dataWithRatio.reduce((max, d) => d.riskRewardRatio > max.riskRewardRatio ? d : max);
  const worstRatio = dataWithRatio.reduce((min, d) => d.riskRewardRatio < min.riskRewardRatio ? d : min);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Risk vs Reward</h1>
        <p className="text-muted text-sm">Is the pay worth the risk? Compensation data correlated with workplace risk scores.</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Avg Total Comp" value={formatCurrency(avgComp)} subValue="median across tracked companies" />
        <StatCard label="Highest Paying" value={highestPay.companyName} subValue={formatCurrency(highestPay.medianTotalComp)} />
        <StatCard label="Best Risk/Reward" value={bestRatio.companyName} subValue={`${formatCurrency(bestRatio.medianTotalComp)} · Risk: ${bestRatio.riskScore}`} />
        <StatCard label="Worst Risk/Reward" value={worstRatio.companyName} subValue={`${formatCurrency(worstRatio.medianTotalComp)} · Risk: ${worstRatio.riskScore}`} />
      </div>

      {/* Scatter Plot Visualization */}
      <div className="bg-card border border-card-border rounded-xl p-6 mb-8">
        <h3 className="text-xs text-muted uppercase tracking-wider mb-4">Risk Score vs Median Total Compensation</h3>
        <div className="relative h-72">
          {/* Y axis label */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted whitespace-nowrap">
            Total Comp
          </div>
          {/* X axis label */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-muted">
            Risk Score →
          </div>
          {/* Grid */}
          <div className="ml-8 h-full relative border-l border-b border-white/10">
            {/* Quadrant labels */}
            <div className="absolute top-2 left-2 text-[10px] text-emerald-400/40">High Pay · Low Risk</div>
            <div className="absolute top-2 right-2 text-[10px] text-yellow-400/40">High Pay · High Risk</div>
            <div className="absolute bottom-6 left-2 text-[10px] text-muted/30">Low Pay · Low Risk</div>
            <div className="absolute bottom-6 right-2 text-[10px] text-red-400/40">Low Pay · High Risk</div>

            {/* Center lines */}
            <div className="absolute left-1/2 top-0 h-full border-l border-dashed border-white/5" />
            <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-white/5" />

            {/* Data points */}
            {sorted.map((d) => {
              const maxComp = 400000;
              const x = (d.riskScore / 100) * 100;
              const y = 100 - Math.min((d.medianTotalComp / maxComp) * 100, 100);
              return (
                <div
                  key={d.companyId}
                  className="absolute group"
                  style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full border-2 border-background cursor-pointer transition-all hover:scale-150",
                    getRiskBgSolid(d.riskLevel)
                  )} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1a1a] border border-card-border rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="font-medium">{d.companyName}</div>
                    <div className="text-muted">{formatCurrency(d.medianTotalComp)} · Risk: {d.riskScore}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 mb-6">
        <ArrowUpDown className="w-4 h-4 text-muted" />
        {(["ratio", "comp", "risk", "glassdoor"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
              sortBy === s ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-card border border-card-border text-muted hover:text-white"
            )}
          >
            {s === "ratio" ? "Risk/Reward Ratio" : s === "comp" ? "Compensation" : s === "glassdoor" ? "Glassdoor" : "Risk Score"}
          </button>
        ))}
      </div>

      {/* Company Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border">
              <th className="text-left text-[10px] text-muted uppercase tracking-wider p-4">Company</th>
              <th className="text-left text-[10px] text-muted uppercase tracking-wider p-4">Median Total Comp</th>
              <th className="text-left text-[10px] text-muted uppercase tracking-wider p-4">Risk Score</th>
              <th className="text-left text-[10px] text-muted uppercase tracking-wider p-4">Glassdoor</th>
              <th className="text-left text-[10px] text-muted uppercase tracking-wider p-4">Risk/Reward</th>
              <th className="text-left text-[10px] text-muted uppercase tracking-wider p-4">Comp by Level</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const company = companies.find((c) => c.id === d.companyId);
              return (
                <tr key={d.companyId} className="border-b border-card-border/50 hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="font-medium text-sm">{d.companyName}</div>
                    <div className="text-[10px] text-muted">{d.industry} · {d.sizeBucket}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      <span className="font-bold text-emerald-400">{formatCurrency(d.medianTotalComp)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn("font-bold", getRiskColor(d.riskLevel))}>{d.riskScore}</span>
                    <span className={cn("ml-2 text-[10px] px-1.5 py-0.5 rounded capitalize", getRiskBg(d.riskLevel))}>
                      {d.riskLevel}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={cn("font-bold", d.glassdoorOverall < 3.0 ? "text-red-400" : d.glassdoorOverall >= 4.0 ? "text-emerald-400" : "")}>
                      {d.glassdoorOverall}
                    </span>
                    <span className="text-muted text-xs"> / 5.0</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {d.riskRewardRatio > 5000 ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : d.riskRewardRatio < 2500 ? (
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      ) : null}
                      <span className={cn(
                        "font-bold text-sm",
                        d.riskRewardRatio > 5000 ? "text-emerald-400" : d.riskRewardRatio < 2500 ? "text-red-400" : "text-yellow-400"
                      )}>
                        {formatCurrency(Math.round(d.riskRewardRatio))}
                      </span>
                      <span className="text-[10px] text-muted">per risk point</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {company?.compensation?.compByLevel.slice(0, 4).map((lvl) => (
                        <div key={lvl.level} className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded">
                          <span className="text-muted">{lvl.level.split(" ")[0]}</span>{" "}
                          <span className="text-emerald-400">{formatCurrency(lvl.medianTotal)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted/30 text-center mt-8">
        Compensation data sourced from public aggregators. Risk/Reward ratio = median total comp / risk score. Higher is better.
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { companies as staticCompanies } from "@/data/mock";
import type { Company } from "@/types";
import { cn, getRiskColor, getRiskBg, formatCurrency, formatNumber } from "@/lib/utils";
import { Trophy, ArrowUpDown } from "lucide-react";

type MetricKey = "risk" | "glassdoor" | "lawsuits" | "comp" | "leadership" | "worklife";

const METRICS: { key: MetricKey; label: string; getValue: (c: Company) => number; format: (v: number) => string; direction: "asc" | "desc" }[] = [
  { key: "risk", label: "Riskiest Employers", getValue: (c) => c.riskScore?.overall ?? 0, format: (v) => v.toString(), direction: "desc" },
  { key: "glassdoor", label: "Best Glassdoor", getValue: (c) => c.glassdoor?.overall ?? 0, format: (v) => v.toFixed(1), direction: "desc" },
  { key: "lawsuits", label: "Most Lawsuits / Employee", getValue: (c) => c.lawsuits?.filingsPerThousandEmployees ?? 0, format: (v) => v.toFixed(2), direction: "desc" },
  { key: "comp", label: "Highest Compensation", getValue: (c) => c.compensation?.medianTotalComp ?? 0, format: (v) => formatCurrency(v), direction: "desc" },
  { key: "leadership", label: "Worst Leadership", getValue: (c) => c.glassdoor?.leadership ?? 5, format: (v) => v.toFixed(1), direction: "asc" },
  { key: "worklife", label: "Worst Work-Life Balance", getValue: (c) => c.glassdoor?.workLife ?? 5, format: (v) => v.toFixed(1), direction: "asc" },
];

export default function LeaderboardsPage() {
  const [companies, setCompanies] = useState<Company[]>(staticCompanies);
  const [metric, setMetric] = useState<MetricKey>("risk");
  const [industryFilter, setIndustryFilter] = useState("all");

  useEffect(() => {
    fetch("/api/companies?limit=200")
      .then((r) => r.json())
      .then((data) => { if (data.companies?.length > 0) setCompanies(data.companies); })
      .catch(() => {});
  }, []);

  const currentMetric = METRICS.find((m) => m.key === metric)!;
  const industries = [...new Set(companies.map((c) => c.industry?.split("/")[0]?.trim() ?? "Other"))].sort();

  const filtered = industryFilter === "all"
    ? companies
    : companies.filter((c) => c.industry?.includes(industryFilter));

  const sorted = [...filtered].sort((a, b) => {
    const aVal = currentMetric.getValue(a);
    const bVal = currentMetric.getValue(b);
    return currentMetric.direction === "desc" ? bVal - aVal : aVal - bVal;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
          <Trophy className="w-7 h-7 text-yellow-400" /> Industry Leaderboards
        </h1>
        <p className="text-muted text-sm">Rankings across industries — who&apos;s the riskiest, best-paying, and worst-rated.</p>
      </div>

      {/* Metric Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              metric === m.key ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-card border border-card-border text-muted hover:text-white"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Industry Filter */}
      <div className="flex items-center gap-2 mb-6">
        <ArrowUpDown className="w-4 h-4 text-muted" />
        <button
          onClick={() => setIndustryFilter("all")}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs transition-all",
            industryFilter === "all" ? "bg-white/10 text-white" : "text-muted hover:text-white"
          )}
        >
          All
        </button>
        {industries.map((ind) => (
          <button
            key={ind}
            onClick={() => setIndustryFilter(ind)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs transition-all",
              industryFilter === ind ? "bg-white/10 text-white" : "text-muted hover:text-white"
            )}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border">
              <th className="text-left text-[10px] text-muted uppercase tracking-wider p-4 w-12">#</th>
              <th className="text-left text-[10px] text-muted uppercase tracking-wider p-4">Company</th>
              <th className="text-left text-[10px] text-muted uppercase tracking-wider p-4">Industry</th>
              <th className="text-left text-[10px] text-muted uppercase tracking-wider p-4">Size</th>
              <th className="text-right text-[10px] text-muted uppercase tracking-wider p-4">{currentMetric.label}</th>
              <th className="text-right text-[10px] text-muted uppercase tracking-wider p-4">Risk Level</th>
              <th className="text-right text-[10px] text-muted uppercase tracking-wider p-4 w-40">Bar</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((company, index) => {
              const value = currentMetric.getValue(company);
              const maxValue = Math.max(...sorted.map((c) => currentMetric.getValue(c)));
              const barPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
              const isTop3 = index < 3;

              return (
                <tr key={company.id} className="border-b border-card-border/30 hover:bg-white/[0.02]">
                  <td className="p-4">
                    <span className={cn(
                      "text-sm font-bold",
                      isTop3 ? "text-yellow-400" : "text-muted"
                    )}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link href={`/dashboard/${company.id}`} className="hover:text-red-400 transition-colors">
                      <div className="font-medium text-sm">{company.name}</div>
                      <div className="text-[10px] text-muted">{company.ticker ?? "Private"} · {company.employeeCount ? formatNumber(company.employeeCount) : "—"} emp</div>
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-muted">{company.industry}</td>
                  <td className="p-4 text-sm text-muted capitalize">{company.sizeBucket}</td>
                  <td className="p-4 text-right">
                    <span className={cn("text-sm font-bold", metric === "risk" ? getRiskColor(company.riskScore?.riskLevel ?? "moderate") : "")}>
                      {currentMetric.format(value)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border capitalize", getRiskBg(company.riskScore?.riskLevel ?? "moderate"), getRiskColor(company.riskScore?.riskLevel ?? "moderate"))}>
                      {company.riskScore?.riskLevel ?? "—"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", isTop3 ? "bg-yellow-500" : "bg-white/20")}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

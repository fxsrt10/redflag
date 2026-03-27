"use client";

import { useState, useEffect } from "react";
import { companies as staticCompanies } from "@/data/mock";
import type { Company } from "@/types";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatCard } from "@/components/ui/StatCard";
import { cn, getRiskColor, getRiskBgSolid, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { Search, TrendingDown, Scale, AlertTriangle, Building2, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>(staticCompanies);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"risk" | "lawsuits" | "sentiment" | "name">("risk");

  useEffect(() => {
    fetch("/api/companies?limit=200")
      .then((r) => r.json())
      .then((data) => {
        if (data.companies && data.companies.length > 0) {
          setCompanies(data.companies);
        }
      })
      .catch(() => {
        // Keep static data as fallback
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = companies
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.ticker?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "risk": return (b.riskScore?.overall ?? 0) - (a.riskScore?.overall ?? 0);
        case "lawsuits": return (b.lawsuits?.filingsPerThousandEmployees ?? 0) - (a.lawsuits?.filingsPerThousandEmployees ?? 0);
        case "sentiment": return (a.glassdoor?.overall ?? 5) - (b.glassdoor?.overall ?? 5);
        case "name": return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  const highRiskCount = companies.filter((c) => c.riskScore?.riskLevel === "high").length;
  const avgRisk = companies.length > 0 ? Math.round(companies.reduce((sum, c) => sum + (c.riskScore?.overall ?? 0), 0) / companies.length) : 0;
  const totalLawsuits = companies.reduce((sum, c) => sum + (c.lawsuits?.employmentFilings12mo ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Company Risk Dashboard</h1>
        <p className="text-muted text-sm">Employment lawsuit activity correlated with employee sentiment signals</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Companies Tracked" value={companies.length} subValue="US public companies" />
        <StatCard label="High Risk" value={highRiskCount} subValue="companies flagged" trend="up" />
        <StatCard label="Avg Risk Score" value={avgRisk} subValue="out of 100" />
        <StatCard label="Employment Lawsuits" value={totalLawsuits} subValue="trailing 12 months" trend="up" />
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search companies or tickers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-card-border rounded-lg text-sm focus:outline-none focus:border-red-500/50 placeholder:text-muted/50"
          />
        </div>
        <div className="flex gap-2">
          {(["risk", "lawsuits", "sentiment", "name"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize",
                sortBy === s ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-card border border-card-border text-muted hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Company Grid */}
      <div className="space-y-3">
        {filtered.map((company) => (
          <Link
            key={company.id}
            href={`/dashboard/${company.id}`}
            className="block bg-card border border-card-border rounded-xl p-5 hover:border-red-500/20 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              {/* Left: Company Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-muted" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">{company.name}</h3>
                      {company.ticker && (
                        <span className="text-[10px] text-muted bg-white/5 px-1.5 py-0.5 rounded">{company.ticker}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      {company.industry} · {formatNumber(company.employeeCount)} employees · {company.hqState}
                    </div>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-5 gap-4 mt-4">
                  <div>
                    <div className="text-[10px] text-muted uppercase tracking-wider">Glassdoor</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-lg font-bold">{company.glassdoor?.overall || "—"}</span>
                      {company.glassdoor?.overall ? <span className="text-[10px] text-muted">/5.0</span> : null}
                      {(company.glassdoor?.trend === "declining" || company.glassdoor?.trend === "rapidly_declining") && (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase tracking-wider">Leadership</div>
                    <div className={cn("text-lg font-bold mt-1", (company.glassdoor?.leadership ?? 5) < 3.0 ? "text-red-400" : "")}>
                      {company.glassdoor?.leadership || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase tracking-wider">Risk Score</div>
                    <div className={cn("text-lg font-bold mt-1", getRiskColor(company.riskScore?.riskLevel ?? "moderate"))}>
                      {company.riskScore?.overall ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase tracking-wider">Employees</div>
                    <div className="text-lg font-bold mt-1">
                      {company.employeeCount ? formatNumber(company.employeeCount) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase tracking-wider">Industry</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-medium">
                        {company.industry?.split("/")[0]?.trim() ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category Tags */}
                <div className="flex gap-1.5 mt-3">
                  {(company.lawsuits?.topCategories ?? []).map((cat) => (
                    <span key={cat.category} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted capitalize">
                      {cat.category.replace("_", " ")} ({cat.count})
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Risk Score */}
              <div className="text-right ml-6 flex flex-col items-end gap-2">
                <RiskBadge level={company.riskScore.riskLevel} score={company.riskScore.overall} />
                <div className="text-[10px] text-muted">
                  Industry: P{company.riskScore.industryPercentile}
                </div>
                {/* Mini risk bar */}
                <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                  <div
                    className={cn("h-full rounded-full transition-all", getRiskBgSolid(company.riskScore.riskLevel))}
                    style={{ width: `${company.riskScore.overall}%` }}
                  />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

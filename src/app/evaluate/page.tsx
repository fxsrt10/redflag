"use client";

import { useState } from "react";
import { companies } from "@/data/mock";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatCard } from "@/components/ui/StatCard";
import { cn, getRiskColor, getRiskBg, formatCurrency, getTrendInfo } from "@/lib/utils";
import { FileCheck, Search, AlertTriangle, CheckCircle2, ShieldAlert, Scale, Star, DollarSign, TrendingDown, ChevronDown } from "lucide-react";

type Verdict = "green" | "caution" | "redflag";

function getVerdict(riskScore: number, compPercentile: number, glassdoor: number): { verdict: Verdict; label: string; description: string } {
  const score = (100 - riskScore) * 0.4 + compPercentile * 0.35 + (glassdoor / 5) * 100 * 0.25;
  if (score >= 65) return { verdict: "green", label: "Green Light", description: "This looks like a solid opportunity. Low workplace risk, competitive compensation, and positive employee sentiment." };
  if (score >= 40) return { verdict: "caution", label: "Proceed with Caution", description: "Mixed signals. The offer has some positives but there are risk factors worth investigating before accepting." };
  return { verdict: "redflag", label: "Red Flag", description: "Significant workplace risk indicators. The compensation may not justify the elevated legal filing activity and negative employee sentiment." };
}

export default function EvaluatePage() {
  const [companyId, setCompanyId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [base, setBase] = useState("");
  const [stock, setStock] = useState("");
  const [bonus, setBonus] = useState("");
  const [level, setLevel] = useState("");
  const [evaluated, setEvaluated] = useState(false);

  const company = companies.find((c) => c.id === companyId);
  const totalOffer = (parseInt(base) || 0) + (parseInt(stock) || 0) + (parseInt(bonus) || 0);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ticker?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  let compPercentile = 50;
  if (company?.compensation && totalOffer > 0) {
    const levels = company.compensation.compByLevel;
    const matchLevel = levels.find((l) => l.level.toLowerCase().includes(level.toLowerCase()));
    const median = matchLevel?.medianTotal ?? company.compensation.medianTotalComp;
    compPercentile = Math.min(Math.round((totalOffer / median) * 50), 100);
  }

  const verdictResult = company ? getVerdict(company.riskScore.overall, compPercentile, company.glassdoor.overall) : null;

  const handleEvaluate = () => {
    if (companyId && totalOffer > 0) setEvaluated(true);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
          <FileCheck className="w-7 h-7 text-emerald-400" /> Job Offer Evaluator
        </h1>
        <p className="text-muted text-sm">Paste your offer. See the risk. Is the pay worth it?</p>
      </div>

      {/* Input Form */}
      <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Company Selector */}
          <div className="col-span-2">
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Company</label>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between p-3 bg-background border border-card-border rounded-lg text-sm"
              >
                <span className={company ? "text-foreground" : "text-muted"}>{company?.name ?? "Select a company..."}</span>
                <ChevronDown className="w-4 h-4 text-muted" />
              </button>
              {dropdownOpen && (
                <div className="absolute z-50 top-full mt-1 w-full bg-[#111] border border-card-border rounded-xl max-h-60 overflow-y-auto shadow-xl">
                  <div className="p-2 border-b border-card-border">
                    <div className="flex items-center gap-2 px-2">
                      <Search className="w-3 h-3 text-muted" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted/50"
                        autoFocus
                      />
                    </div>
                  </div>
                  {filteredCompanies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCompanyId(c.id); setDropdownOpen(false); setSearchQuery(""); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between"
                    >
                      <span>{c.name} {c.ticker && <span className="text-muted">({c.ticker})</span>}</span>
                      <span className={cn("text-[10px]", getRiskColor(c.riskScore.riskLevel))}>{c.riskScore.riskLevel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Offer Details */}
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Base Salary</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="number"
                placeholder="150000"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-background border border-card-border rounded-lg text-sm outline-none focus:border-red-500/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Stock / RSUs (Annual)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="number"
                placeholder="50000"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-background border border-card-border rounded-lg text-sm outline-none focus:border-red-500/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Bonus (Annual)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="number"
                placeholder="20000"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-background border border-card-border rounded-lg text-sm outline-none focus:border-red-500/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Level / Title</label>
            <input
              type="text"
              placeholder="e.g. L5, Senior, E4..."
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-card-border rounded-lg text-sm outline-none focus:border-red-500/50"
            />
          </div>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={!companyId || totalOffer === 0}
          className={cn(
            "mt-6 w-full py-3 rounded-lg font-medium text-sm transition-all",
            companyId && totalOffer > 0
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-white/5 text-muted cursor-not-allowed"
          )}
        >
          Evaluate This Offer
        </button>
      </div>

      {/* Results */}
      {evaluated && company && verdictResult && (
        <div className="space-y-4">
          {/* Verdict Card */}
          <div className={cn(
            "rounded-xl p-6 border",
            verdictResult.verdict === "green" ? "bg-emerald-500/5 border-emerald-500/20" :
            verdictResult.verdict === "caution" ? "bg-yellow-500/5 border-yellow-500/20" :
            "bg-red-500/5 border-red-500/20"
          )}>
            <div className="flex items-center gap-3 mb-3">
              {verdictResult.verdict === "green" && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
              {verdictResult.verdict === "caution" && <AlertTriangle className="w-6 h-6 text-yellow-400" />}
              {verdictResult.verdict === "redflag" && <ShieldAlert className="w-6 h-6 text-red-400" />}
              <h2 className={cn(
                "text-xl font-bold",
                verdictResult.verdict === "green" ? "text-emerald-400" :
                verdictResult.verdict === "caution" ? "text-yellow-400" : "text-red-400"
              )}>
                {verdictResult.label}
              </h2>
            </div>
            <p className="text-sm text-muted leading-relaxed">{verdictResult.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Offer vs Market */}
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="text-xs text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Your Offer vs Market
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Your Total Comp</span>
                  <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalOffer)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Company Median</span>
                  <span className="text-sm font-bold">{formatCurrency(company.compensation?.medianTotalComp ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Your Percentile</span>
                  <span className={cn("text-sm font-bold", compPercentile >= 50 ? "text-emerald-400" : "text-orange-400")}>
                    P{compPercentile}
                  </span>
                </div>
                {company.compensation?.compByLevel && (
                  <div className="border-t border-card-border pt-3 mt-3">
                    <div className="text-[10px] text-muted mb-2">Reported comp by level:</div>
                    {company.compensation.compByLevel.map((lvl) => (
                      <div key={lvl.level} className="flex justify-between text-xs py-0.5">
                        <span className="text-muted">{lvl.level}</span>
                        <span>{formatCurrency(lvl.medianTotal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Risk Summary */}
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h3 className="text-xs text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" /> Company Risk Profile
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <RiskBadge level={company.riskScore.riskLevel} score={company.riskScore.overall} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted flex items-center gap-1.5"><Star className="w-3 h-3" /> Glassdoor</span>
                  <span className="text-sm font-bold">{company.glassdoor.overall}/5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted flex items-center gap-1.5"><TrendingDown className="w-3 h-3" /> Trend</span>
                  <span className={cn("text-sm font-bold", getTrendInfo(company.glassdoor.trend).color)}>
                    {getTrendInfo(company.glassdoor.trend).label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted flex items-center gap-1.5"><Scale className="w-3 h-3" /> Lawsuits (12mo)</span>
                  <span className="text-sm font-bold">{company.lawsuits.employmentFilings12mo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Top Category</span>
                  <span className="text-sm capitalize">{company.lawsuits.topCategories[0]?.category.replace("_", " ") ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Recommend %</span>
                  <span className={cn("text-sm font-bold", company.glassdoor.recommendPct < 50 ? "text-red-400" : "")}>
                    {company.glassdoor.recommendPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted/30 text-center">
            This evaluation is based on publicly available data and does not constitute career or legal advice. Your personal experience may differ.
          </p>
        </div>
      )}
    </div>
  );
}

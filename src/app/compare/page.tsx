"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { companies as staticCompanies } from "@/data/mock";
import type { Company } from "@/types";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { cn, getRiskColor, formatCurrency, formatNumber, getRiskBgSolid } from "@/lib/utils";
import { ArrowLeftRight, ChevronDown, X } from "lucide-react";

function CompareContent() {
  const searchParams = useSearchParams();
  const initialIds = (searchParams.get("ids")?.split(",") ?? []).slice(0, 3);

  const [companies, setCompanies] = useState<Company[]>(staticCompanies);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/companies?limit=200")
      .then((r) => r.json())
      .then((data) => {
        if (data.companies?.length > 0) {
          setCompanies(data.companies);
          if (initialIds.length > 0) {
            setSelectedIds(initialIds.filter((id: string) => data.companies.some((c: Company) => c.id === id)));
          }
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = selectedIds.map((id) => companies.find((c) => c.id === id)!).filter(Boolean);

  const addSlot = () => {
    if (selectedIds.length < 3) setSelectedIds([...selectedIds, ""]);
  };

  const setCompany = (index: number, id: string) => {
    const updated = [...selectedIds];
    updated[index] = id;
    setSelectedIds(updated);
    setDropdownOpen(null);
  };

  const removeSlot = (index: number) => {
    setSelectedIds(selectedIds.filter((_, i) => i !== index));
  };

  const metrics = [
    { label: "Risk Score", getValue: (c: Company) => c.riskScore?.overall ?? 0, format: (v: number) => v.toString(), color: (c: Company) => getRiskColor(c.riskScore?.riskLevel ?? "moderate"), higher: "worse" },
    { label: "Glassdoor Overall", getValue: (c: Company) => c.glassdoor?.overall ?? 0, format: (v: number) => v.toFixed(1), color: () => "", higher: "better" },
    { label: "Leadership Rating", getValue: (c: Company) => c.glassdoor?.leadership ?? 0, format: (v: number) => v.toFixed(1), color: () => "", higher: "better" },
    { label: "Culture Rating", getValue: (c: Company) => c.glassdoor?.culture ?? 0, format: (v: number) => v.toFixed(1), color: () => "", higher: "better" },
    { label: "Work-Life Balance", getValue: (c: Company) => c.glassdoor?.workLife ?? 0, format: (v: number) => v.toFixed(1), color: () => "", higher: "better" },
    { label: "Lawsuits / 1K Emp", getValue: (c: Company) => c.lawsuits?.filingsPerThousandEmployees ?? 0, format: (v: number) => v.toFixed(2), color: () => "", higher: "worse" },
    { label: "Filing Acceleration", getValue: (c: Company) => c.lawsuits?.filingAcceleration ?? 1, format: (v: number) => `${v > 1 ? "+" : ""}${((v - 1) * 100).toFixed(0)}%`, color: () => "", higher: "worse" },
    { label: "Employee Count", getValue: (c: Company) => c.employeeCount ?? 0, format: (v: number) => formatNumber(v), color: () => "", higher: "neutral" },
    { label: "Median Total Comp", getValue: (c: Company) => c.compensation?.medianTotalComp ?? 0, format: (v: number) => formatCurrency(v), color: () => "", higher: "better" },
    { label: "Comp vs Peers", getValue: (c: Company) => c.compensation?.compVsPeers ?? 0, format: (v: number) => `P${v}`, color: () => "", higher: "better" },
    { label: "Recommend %", getValue: (c: Company) => c.glassdoor?.recommendPct ?? 0, format: (v: number) => `${v}%`, color: () => "", higher: "better" },
    { label: "CEO Approval", getValue: (c: Company) => c.glassdoor?.ceoApprovalPct ?? 0, format: (v: number) => `${v}%`, color: () => "", higher: "better" },
  ];

  const getBestIndex = (values: number[], direction: string) => {
    if (direction === "neutral") return -1;
    if (direction === "better") return values.indexOf(Math.max(...values));
    return values.indexOf(Math.min(...values));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
          <ArrowLeftRight className="w-7 h-7 text-red-400" /> Compare Companies
        </h1>
        <p className="text-muted text-sm">Side-by-side comparison of risk, sentiment, compensation, and lawsuits.</p>
      </div>

      {/* Company Selectors */}
      <div className="flex gap-4 mb-8">
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="flex-1">
            {slot < selectedIds.length ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(dropdownOpen === slot ? null : slot)}
                  className="w-full flex items-center justify-between p-3 bg-card border border-card-border rounded-xl text-sm hover:border-red-500/20 transition-colors"
                >
                  <span className={selectedIds[slot] ? "text-foreground" : "text-muted"}>
                    {selected[slot]?.name ?? "Select company..."}
                  </span>
                  <div className="flex items-center gap-1">
                    <ChevronDown className="w-4 h-4 text-muted" />
                    <button onClick={(e) => { e.stopPropagation(); removeSlot(slot); }} className="ml-1">
                      <X className="w-3 h-3 text-muted hover:text-red-400" />
                    </button>
                  </div>
                </button>
                {dropdownOpen === slot && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-[#111] border border-card-border rounded-xl max-h-60 overflow-y-auto shadow-xl">
                    {companies
                      .filter((c) => !selectedIds.includes(c.id) || c.id === selectedIds[slot])
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCompany(slot, c.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between"
                        >
                          <span>{c.name} {c.ticker && <span className="text-muted">({c.ticker})</span>}</span>
                          <span className={cn("text-[10px]", getRiskColor(c.riskScore.riskLevel))}>{c.riskScore.overall}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ) : slot === selectedIds.length && selectedIds.length < 3 ? (
              <button
                onClick={addSlot}
                className="w-full p-3 border border-dashed border-card-border rounded-xl text-sm text-muted hover:border-red-500/20 hover:text-white transition-colors"
              >
                + Add company
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      {selected.length >= 2 && (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          {/* Header Row */}
          <div className="grid border-b border-card-border" style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}>
            <div className="p-4 text-[10px] text-muted uppercase tracking-wider">Metric</div>
            {selected.map((c) => (
              <div key={c.id} className="p-4 text-center border-l border-card-border">
                <div className="font-semibold">{c.name}</div>
                <div className="mt-1">
                  <RiskBadge level={c.riskScore.riskLevel} score={c.riskScore.overall} size="sm" />
                </div>
              </div>
            ))}
          </div>

          {/* Metric Rows */}
          {metrics.map((metric) => {
            const values = selected.map((c) => metric.getValue(c));
            const bestIdx = getBestIndex(values, metric.higher);
            return (
              <div
                key={metric.label}
                className="grid border-b border-card-border/30 hover:bg-white/[0.02]"
                style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}
              >
                <div className="p-3 text-sm text-muted flex items-center">{metric.label}</div>
                {selected.map((c, i) => (
                  <div key={c.id} className="p-3 text-center border-l border-card-border/30 flex flex-col items-center justify-center">
                    <span className={cn(
                      "text-sm font-bold",
                      metric.color(c) || (i === bestIdx ? "text-emerald-400" : "")
                    )}>
                      {metric.format(values[i])}
                    </span>
                    {i === bestIdx && metric.higher !== "neutral" && (
                      <span className="text-[8px] text-emerald-400 mt-0.5">BEST</span>
                    )}
                    {/* Visual bar */}
                    <div className="w-full h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", i === bestIdx ? "bg-emerald-500" : "bg-white/20")}
                        style={{ width: `${Math.min((values[i] / Math.max(...values)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {selected.length < 2 && (
        <div className="text-center py-16 text-muted">
          <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Select at least 2 companies to compare</p>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="text-muted text-center py-16">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}

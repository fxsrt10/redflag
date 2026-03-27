"use client";

import { useState } from "react";
import { founders } from "@/data/mock";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatCard } from "@/components/ui/StatCard";
import { cn, getRiskColor } from "@/lib/utils";
import { Users, ChevronDown, ChevronUp, TrendingDown, Scale, Zap } from "lucide-react";

export default function FoundersPage() {
  const [expandedId, setExpandedId] = useState<string | null>("musk");

  const sortedFounders = [...founders].sort((a, b) => b.impactScore - a.impactScore);
  const avgImpact = Math.round(founders.reduce((s, f) => s + f.impactScore, 0) / founders.length);
  const totalControversies = founders.reduce((s, f) => s + f.controversyEvents.length, 0);
  const totalLegalEvents = founders.reduce((s, f) => s + f.legalEvents.length, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">The Founders</h1>
        <p className="text-muted text-sm">Does founder behavior predict employee pain? Tracking the ripple effect.</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Founders Tracked" value={founders.length} />
        <StatCard label="Avg Impact Score" value={avgImpact} subValue="out of 100" />
        <StatCard label="Total Controversies" value={totalControversies} subValue="documented events" />
        <StatCard label="Legal Events" value={totalLegalEvents} subValue="personal filings" />
      </div>

      <div className="space-y-3">
        {sortedFounders.map((founder) => {
          const isExpanded = expandedId === founder.id;
          return (
            <div key={founder.id} className="bg-card border border-card-border rounded-xl overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : founder.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-muted" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{founder.name}</h3>
                      <span className="text-[10px] text-muted bg-white/5 px-2 py-0.5 rounded">{founder.netWorthBand}</span>
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {founder.companies.map((c) => c.name).join(" · ")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <RiskBadge level={founder.impactScore >= 80 ? "high" : founder.impactScore >= 60 ? "elevated" : founder.impactScore >= 40 ? "moderate" : "low"} score={founder.impactScore} size="sm" />
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-card-border">
                  {/* Company Impact Cards */}
                  {founder.companyImpacts.length > 0 && (
                    <div className="mt-4 mb-6">
                      <h4 className="text-xs text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Company Impact — The Ripple Effect
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {founder.companyImpacts.map((impact, i) => (
                          <div key={i} className="bg-white/[0.02] border border-card-border rounded-lg p-4">
                            <div className="font-medium text-sm mb-2">{impact.company}</div>
                            <div className="text-xs text-muted mb-3">{impact.eventDescription}</div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <div className="text-[10px] text-muted">Glassdoor Before</div>
                                <div className="text-lg font-bold">{impact.glassdoorBefore}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-muted">Glassdoor After</div>
                                <div className="text-lg font-bold text-red-400">{impact.glassdoorAfter}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-muted">Lawsuit Spike</div>
                                <div className="text-lg font-bold text-red-400">+{impact.lawsuitSpikePct}%</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                              <TrendingDown className="w-3 h-3 text-red-400" />
                              <span className="text-[10px] text-red-400">
                                -{(impact.glassdoorBefore - impact.glassdoorAfter).toFixed(1)} rating drop
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Legal Events */}
                    <div>
                      <h4 className="text-xs text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Scale className="w-3 h-3" /> Legal Events ({founder.legalEvents.length})
                      </h4>
                      <div className="space-y-2">
                        {founder.legalEvents.map((event, i) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <div className="text-[10px] text-muted w-16 flex-shrink-0 pt-0.5">{event.date}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded capitalize",
                                  event.severity === "criminal" ? "bg-red-500/10 text-red-400" :
                                  event.severity === "major" ? "bg-orange-500/10 text-orange-400" :
                                  "bg-yellow-500/10 text-yellow-400"
                                )}>
                                  {event.eventType.replace("_", " ")}
                                </span>
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded capitalize",
                                  event.outcome === "settled" ? "bg-yellow-500/10 text-yellow-400" :
                                  event.outcome === "dismissed" ? "bg-emerald-500/10 text-emerald-400" :
                                  "bg-muted/10 text-muted"
                                )}>
                                  {event.outcome}
                                </span>
                              </div>
                              <p className="text-xs text-muted/80 mt-1 leading-relaxed">{event.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Controversy Events */}
                    <div>
                      <h4 className="text-xs text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Controversy Events ({founder.controversyEvents.length})
                      </h4>
                      <div className="space-y-2">
                        {founder.controversyEvents.map((event, i) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <div className="text-[10px] text-muted w-16 flex-shrink-0 pt-0.5">{event.date}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded capitalize",
                                  event.impactLevel === "viral" ? "bg-red-500/10 text-red-400" :
                                  event.impactLevel === "high" ? "bg-orange-500/10 text-orange-400" :
                                  "bg-yellow-500/10 text-yellow-400"
                                )}>
                                  {event.eventType.replace("_", " ")}
                                </span>
                                {event.relatedCompany && (
                                  <span className="text-[10px] text-muted bg-white/5 px-1.5 py-0.5 rounded">{event.relatedCompany}</span>
                                )}
                              </div>
                              <p className="text-xs text-muted/80 mt-1 leading-relaxed">{event.headline}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

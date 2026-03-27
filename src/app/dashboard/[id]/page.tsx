"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getCompanyById, getFoundersByCompany, getPeerCompanies, getCompensationByCompany } from "@/lib/data";
import { getLayoffsByCompany, getLayoffSummary } from "@/data/layoffs";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatCard } from "@/components/ui/StatCard";
import { ShareCard } from "@/components/ui/ShareCard";
import { GlassdoorRadar } from "@/components/charts/GlassdoorRadar";
import { LawsuitCategoryChart } from "@/components/charts/LawsuitCategoryChart";
import { RiskBreakdownBars } from "@/components/charts/RiskBreakdownBars";
import { cn, getRiskColor, getRiskBgSolid, formatCurrency, formatNumber, getCategoryBg, getTrendInfo } from "@/lib/utils";
import {
  ArrowLeft, Building2, ExternalLink, Scale, Users, TrendingDown,
  AlertTriangle, Globe, MapPin, Briefcase, Star, Scissors, Newspaper,
} from "lucide-react";

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const company = getCompanyById(id);

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-2">Company not found</h1>
        <p className="text-muted mb-4">No data for &quot;{id}&quot;</p>
        <Link href="/dashboard" className="text-red-400 hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  const relatedFounders = getFoundersByCompany(company.name);
  const peers = getPeerCompanies(company);
  const compEntries = getCompensationByCompany(company.id);
  const layoffs = getLayoffsByCompany(company.id);
  const layoffSummary = getLayoffSummary(company.id);
  const trend = getTrendInfo(company.glassdoor.trend);

  return (
    <div className="max-w-7xl">
      {/* Back + Share */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </Link>
        <ShareCard
          companyName={company.name}
          riskScore={company.riskScore.overall}
          riskLevel={company.riskScore.riskLevel}
        />
      </div>

      {/* ========== ROW 1: Header ========== */}
      <section className="bg-card border border-card-border rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-muted" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{company.name}</h1>
                {company.ticker && (
                  <span className="text-xs text-muted bg-white/5 px-2 py-0.5 rounded">{company.ticker}</span>
                )}
                <span className={cn("text-xs font-medium flex items-center gap-1", trend.color)}>
                  {trend.arrow} {trend.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {company.industry}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {formatNumber(company.employeeCount)} employees</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {company.hqState}</span>
                <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white">
                  <Globe className="w-3 h-3" /> {company.website}
                </a>
              </div>
              <div className="text-xs text-muted/60 mt-1">{company.legalName} · {company.sizeBucket} cap</div>
            </div>
          </div>
          <RiskBadge level={company.riskScore.riskLevel} score={company.riskScore.overall} size="lg" />
        </div>
      </section>

      {/* ========== ROW 2: Risk Breakdown + Glassdoor ========== */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Risk Breakdown */}
        <section className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Risk Score Breakdown
          </h2>
          <RiskBreakdownBars riskScore={company.riskScore} />
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-card-border">
            <div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Industry Percentile</div>
              <div className={cn("text-xl font-bold", getRiskColor(company.riskScore.riskLevel))}>
                P{company.riskScore.industryPercentile}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Size Percentile</div>
              <div className={cn("text-xl font-bold", getRiskColor(company.riskScore.riskLevel))}>
                P{company.riskScore.sizePercentile}
              </div>
            </div>
          </div>
        </section>

        {/* Glassdoor Radar */}
        <section className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Glassdoor Ratings
          </h2>
          <GlassdoorRadar glassdoor={company.glassdoor} />
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div className="text-center">
              <div className="text-[10px] text-muted">Recommend</div>
              <div className="text-lg font-bold">{company.glassdoor.recommendPct}%</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted">CEO Approval</div>
              <div className="text-lg font-bold">{company.glassdoor.ceoApprovalPct}%</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted">Reviews</div>
              <div className="text-lg font-bold">{formatNumber(company.glassdoor.reviewCount)}</div>
            </div>
          </div>
        </section>
      </div>

      {/* ========== ROW 3: Lawsuits ========== */}
      <section className="bg-card border border-card-border rounded-xl p-6 mb-4">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Scale className="w-4 h-4 text-orange-400" /> Employment Lawsuits
        </h2>

        {/* Lawsuit Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Filings (12mo)" value={company.lawsuits.totalFilings12mo} />
          <StatCard label="Employment Filings" value={company.lawsuits.employmentFilings12mo} />
          <StatCard
            label="Per 1K Employees"
            value={company.lawsuits.filingsPerThousandEmployees.toFixed(2)}
            trend={company.lawsuits.filingsPerThousandEmployees > 1 ? "up" : undefined}
          />
          <StatCard
            label="Filing Trend (90d)"
            value={`${company.lawsuits.filingAcceleration > 1 ? "+" : ""}${((company.lawsuits.filingAcceleration - 1) * 100).toFixed(0)}%`}
            trend={company.lawsuits.filingAcceleration > 1.3 ? "up" : company.lawsuits.filingAcceleration < 1 ? "down" : "neutral"}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Category Chart */}
          <div>
            <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Categories</h3>
            {company.lawsuits.topCategories.length > 0 ? (
              <LawsuitCategoryChart categories={company.lawsuits.topCategories} />
            ) : (
              <div className="text-sm text-muted/50 py-8 text-center">No category data available</div>
            )}
          </div>

          {/* Recent Cases Timeline */}
          <div>
            <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Recent Cases</h3>
            {company.lawsuits.recentCases.length > 0 ? (
              <div className="space-y-3">
                {company.lawsuits.recentCases.map((lawsuit) => (
                  <div key={lawsuit.id} className="bg-white/[0.02] border border-card-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded capitalize", getCategoryBg(lawsuit.category))}>
                        {lawsuit.category.replace("_", " ")}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded capitalize",
                        lawsuit.status === "open" ? "bg-orange-500/10 text-orange-400" :
                        lawsuit.status === "settled" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {lawsuit.status}
                      </span>
                      <span className="text-[10px] text-muted capitalize">{lawsuit.plaintiffType.replace("_", " ")}</span>
                    </div>
                    <p className="text-xs text-muted/80 leading-relaxed mb-2">{lawsuit.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted">
                      <span>{lawsuit.caseNumber} · {lawsuit.court}</span>
                      <div className="flex items-center gap-2">
                        <span>{lawsuit.filedDate}</span>
                        {lawsuit.sourceUrl ? (
                          <a href={lawsuit.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-blue-400 hover:underline">
                            Source <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <a
                            href={`https://www.courtlistener.com/?q=${encodeURIComponent(lawsuit.caseNumber)}&type=r`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-blue-400 hover:underline"
                          >
                            CourtListener <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted/50 py-8 text-center">No recent cases in database</div>
            )}
            <div className="mt-3 text-[10px] text-muted/40">
              Data sourced from{" "}
              <a href="https://www.courtlistener.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:underline">RECAP/CourtListener</a>
              {" "}and{" "}
              <a href="https://www.pacer.gov/" target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:underline">PACER</a>
              . Federal employment cases only.
            </div>
          </div>
        </div>
      </section>

      {/* ========== ROW 3.5: Layoff Tracker ========== */}
      {layoffs.length > 0 && (
        <section className="bg-card border border-card-border rounded-xl p-6 mb-4">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-red-400" /> Layoff Tracker
          </h2>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <StatCard label="Layoff Events" value={layoffSummary.eventCount} />
            <StatCard
              label="Total Affected"
              value={formatNumber(layoffSummary.totalAffected)}
              subValue="employees across all events"
            />
            <StatCard
              label="Cumulative % Cut"
              value={`${layoffSummary.totalPctCut.toFixed(0)}%`}
              trend={layoffSummary.totalPctCut > 20 ? "up" : undefined}
            />
            <StatCard
              label="Most Recent"
              value={layoffSummary.mostRecent?.date.slice(0, 7) ?? "—"}
              subValue={layoffSummary.mostRecent ? `${formatNumber(layoffSummary.mostRecent.employeesAffected)} affected` : undefined}
            />
          </div>

          {/* Layoff Timeline */}
          <div className="space-y-3">
            {layoffs.map((event) => (
              <div key={event.id} className="bg-white/[0.02] border border-card-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-medium">{event.date}</span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded capitalize",
                        event.type === "layoff" ? "bg-red-500/10 text-red-400" :
                        event.type === "warn_act" ? "bg-orange-500/10 text-orange-400" :
                        event.type === "restructuring" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-blue-500/10 text-blue-400"
                      )}>
                        {event.type.replace("_", " ")}
                      </span>
                      {event.employeesAffected > 0 && (
                        <span className="text-[10px] text-red-400 font-medium">
                          {formatNumber(event.employeesAffected)} employees ({event.percentOfWorkforce}%)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted/80 leading-relaxed mb-2">{event.reason}</p>
                    <div className="flex items-center gap-3 text-[10px]">
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:underline"
                      >
                        <Newspaper className="w-2.5 h-2.5" />
                        {event.source}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      {event.warnFilingUrl && (
                        <a
                          href={event.warnFilingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-orange-400 hover:underline"
                        >
                          WARN Filing <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  {/* Visual impact bar */}
                  <div className="ml-4 flex flex-col items-end">
                    <div className="text-[10px] text-muted mb-1">Impact</div>
                    <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          event.percentOfWorkforce >= 20 ? "bg-red-500" :
                          event.percentOfWorkforce >= 10 ? "bg-orange-500" :
                          event.percentOfWorkforce >= 5 ? "bg-yellow-500" :
                          "bg-white/20"
                        )}
                        style={{ width: `${Math.min(event.percentOfWorkforce * 4, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-[10px] text-muted/40">
            Sources: Reuters, Bloomberg, CNBC, The Verge, WSJ, TechCrunch, and state WARN Act filings.
            Dates and figures based on publicly reported information.
          </div>
        </section>
      )}

      {/* ========== ROW 4: Comp + Peers + Founders ========== */}
      <div className="grid grid-cols-2 gap-4">
        {/* Compensation */}
        <section className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4">Compensation</h2>
          {company.compensation ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <div className="text-[10px] text-muted uppercase tracking-wider">Median Total</div>
                  <div className="text-xl font-bold text-emerald-400">{formatCurrency(company.compensation.medianTotalComp)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase tracking-wider">Median Base</div>
                  <div className="text-xl font-bold">{formatCurrency(company.compensation.medianBase)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase tracking-wider">vs Peers</div>
                  <div className={cn("text-xl font-bold", company.compensation.compVsPeers > 70 ? "text-emerald-400" : company.compensation.compVsPeers < 40 ? "text-red-400" : "")}>
                    P{company.compensation.compVsPeers}
                  </div>
                </div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="text-left text-[10px] text-muted uppercase tracking-wider py-2">Level</th>
                    <th className="text-right text-[10px] text-muted uppercase tracking-wider py-2">Median Total</th>
                    <th className="text-right text-[10px] text-muted uppercase tracking-wider py-2">Reports</th>
                  </tr>
                </thead>
                <tbody>
                  {company.compensation.compByLevel.map((lvl) => (
                    <tr key={lvl.level} className="border-b border-card-border/30">
                      <td className="py-2 text-sm">{lvl.level}</td>
                      <td className="py-2 text-sm text-right text-emerald-400 font-medium">{formatCurrency(lvl.medianTotal)}</td>
                      <td className="py-2 text-sm text-right text-muted">{lvl.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {compEntries.length > 0 && (
                <div className="mt-3 text-[10px] text-muted/40">
                  {compEntries.length} individual comp reports · Sources: levels.fyi, Glassdoor
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted/50 py-8 text-center">No compensation data available</div>
          )}
        </section>

        {/* Peers + Founders */}
        <div className="space-y-4">
          {/* Related Founders */}
          {relatedFounders.length > 0 && (
            <section className="bg-card border border-card-border rounded-xl p-6">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> Related Founders
              </h2>
              <div className="space-y-2">
                {relatedFounders.map((founder) => {
                  const impact = founder.companyImpacts.find((i) => i.company === company.name);
                  return (
                    <Link
                      key={founder.id}
                      href="/founders"
                      className="flex items-center justify-between p-3 bg-white/[0.02] border border-card-border rounded-lg hover:border-red-500/20 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-sm">{founder.name}</div>
                        <div className="text-[10px] text-muted">
                          {founder.companies.find((c) => c.name === company.name)?.role ?? founder.title}
                          {impact && (
                            <span className="ml-2 text-red-400">
                              Glassdoor: {impact.glassdoorBefore} → {impact.glassdoorAfter} · Lawsuits +{impact.lawsuitSpikePct}%
                            </span>
                          )}
                        </div>
                      </div>
                      <RiskBadge
                        level={founder.impactScore >= 80 ? "high" : founder.impactScore >= 60 ? "elevated" : founder.impactScore >= 40 ? "moderate" : "low"}
                        score={founder.impactScore}
                        size="sm"
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Peer Comparison */}
          <section className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-3">Peer Comparison</h2>
            {peers.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="text-left text-[10px] text-muted uppercase tracking-wider py-2">Company</th>
                    <th className="text-right text-[10px] text-muted uppercase tracking-wider py-2">Risk</th>
                    <th className="text-right text-[10px] text-muted uppercase tracking-wider py-2">Glassdoor</th>
                    <th className="text-right text-[10px] text-muted uppercase tracking-wider py-2">Lawsuits/1K</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Current company row highlighted */}
                  <tr className="border-b border-red-500/20 bg-red-500/5">
                    <td className="py-2 text-sm font-medium text-red-400">{company.name} (current)</td>
                    <td className={cn("py-2 text-sm text-right font-bold", getRiskColor(company.riskScore.riskLevel))}>{company.riskScore.overall}</td>
                    <td className="py-2 text-sm text-right">{company.glassdoor.overall}</td>
                    <td className="py-2 text-sm text-right">{company.lawsuits.filingsPerThousandEmployees.toFixed(2)}</td>
                  </tr>
                  {peers.map((peer) => (
                    <tr key={peer.id} className="border-b border-card-border/30 hover:bg-white/[0.02]">
                      <td className="py-2">
                        <Link href={`/dashboard/${peer.id}`} className="text-sm hover:text-red-400 transition-colors">{peer.name}</Link>
                      </td>
                      <td className={cn("py-2 text-sm text-right font-bold", getRiskColor(peer.riskScore.riskLevel))}>{peer.riskScore.overall}</td>
                      <td className="py-2 text-sm text-right">{peer.glassdoor.overall}</td>
                      <td className="py-2 text-sm text-right">{peer.lawsuits.filingsPerThousandEmployees.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-muted/50 py-4 text-center">No peers found in same industry/size</div>
            )}
          </section>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted/30 text-center mt-8">
        Risk scores reflect publicly available data patterns and do not imply wrongdoing. Not legal advice.
        Lawsuit data from federal courts via CourtListener/RECAP. Compensation data from public aggregators.
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { forbes30u30 as staticForbes, forbes30u30YearStats as staticYearStats } from "@/data/mock";
import type { Forbes30u30, Forbes30u30YearStats } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { cn, getStatusColor } from "@/lib/utils";
import { Award, Filter } from "lucide-react";

export default function WatchlistPage() {
  const [people, setPeople] = useState<Forbes30u30[]>(staticForbes);
  const [yearStats, setYearStats] = useState<Forbes30u30YearStats[]>(staticYearStats);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then((data) => {
        if (data.people?.length > 0) setPeople(data.people);
        if (data.yearStats?.length > 0) setYearStats(data.yearStats);
      })
      .catch(() => {});
  }, []);

  const filtered = statusFilter === "all"
    ? people
    : people.filter((p) => p.currentStatus === statusFilter);

  const convictedCount = people.filter((p) => p.currentStatus === "convicted").length;
  const chargedCount = people.filter((p) => p.currentStatus === "charged" || p.currentStatus === "under_investigation").length;
  const cleanCount = people.filter((p) => p.currentStatus === "clean").length;
  const totalEvents = people.reduce((s, p) => s + (p.events?.length ?? 0), 0);

  const worstYear = yearStats.length > 0 ? yearStats.reduce((max, y) => y.fraudRatePct > max.fraudRatePct ? y : max, yearStats[0]) : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          30 Under 30. <span className="text-red-400">Under Investigation.</span>
        </h1>
        <p className="text-muted text-sm">Tracking Forbes 30 Under 30 alumni and their legal adventures.</p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard label="Alumni Tracked" value={people.length} />
        <StatCard label="Convicted" value={convictedCount} trend="up" />
        <StatCard label="Charged / Investigated" value={chargedCount} />
        <StatCard label="Clean Record" value={cleanCount} />
        <StatCard label="Worst Class Year" value={worstYear?.listYear ?? "—"} subValue={worstYear ? `${worstYear.fraudRatePct}% fraud rate` : undefined} />
      </div>

      {/* Year Stats Bar */}
      <div className="bg-card border border-card-border rounded-xl p-5 mb-8">
        <h3 className="text-xs text-muted uppercase tracking-wider mb-4">Fraud Rate by Class Year</h3>
        <div className="flex items-end gap-3 h-24">
          {yearStats.map((year) => (
            <div key={year.listYear} className="flex flex-col items-center gap-1 flex-1">
              <div className="text-[10px] font-bold text-muted">{year.fraudRatePct}%</div>
              <div
                className={cn(
                  "w-full rounded-t transition-all",
                  year.fraudRatePct >= 10 ? "bg-red-500" :
                  year.fraudRatePct >= 5 ? "bg-orange-500" :
                  year.fraudRatePct > 0 ? "bg-yellow-500" :
                  "bg-emerald-500"
                )}
                style={{ height: `${Math.max(year.fraudRatePct * 8, 4)}px` }}
              />
              <div className="text-[10px] text-muted">{year.listYear}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-muted" />
        {["all", "convicted", "charged", "settled", "clean"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
              statusFilter === status ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-card border border-card-border text-muted hover:text-white"
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Person Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((person) => (
          <div key={person.id} className="bg-card border border-card-border rounded-xl p-5 hover:border-card-border/80 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-muted" />
                </div>
                <div>
                  <h3 className="font-semibold">{person.name}</h3>
                  <div className="text-xs text-muted">{person.companyName}</div>
                </div>
              </div>
              <span className={cn("text-[10px] px-2 py-1 rounded-full font-medium capitalize", getStatusColor(person.currentStatus))}>
                {person.currentStatus.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4 text-xs text-muted">
              <span>Class of {person.listYear}</span>
              <span>·</span>
              <span>{person.category}</span>
              <span>·</span>
              <span>Age {person.ageAtListing}</span>
            </div>

            {/* Events */}
            {person.events.length > 0 ? (
              <div className="space-y-2 border-t border-card-border pt-3">
                {person.events.map((event, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="text-[10px] text-muted w-16 flex-shrink-0">{event.date}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded capitalize",
                          event.severity === "criminal" ? "bg-red-500/10 text-red-400" :
                          event.severity === "major" ? "bg-orange-500/10 text-orange-400" :
                          "bg-yellow-500/10 text-yellow-400"
                        )}>
                          {event.eventType.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted/70 mt-1 leading-relaxed">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-t border-card-border pt-3 text-xs text-emerald-400/60 text-center py-4">
                No legal events found
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted/30 text-center mt-8">
        This tracker reflects publicly available legal records only. Inclusion does not imply wrongdoing. Most 30 Under 30 alumni have clean records.
      </p>
    </div>
  );
}

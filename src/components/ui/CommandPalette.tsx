"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { searchAll } from "@/lib/data";
import { cn, getRiskColor } from "@/lib/utils";
import { Search, Building2, Users, Award, X } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = searchAll(query);
  const allResults = [
    ...results.companies.map((c) => ({ type: "company" as const, id: c.id, name: c.name, sub: `${c.ticker ?? ""} · ${c.industry}`, riskLevel: c.riskScore.riskLevel, href: `/dashboard/${c.id}` })),
    ...results.founders.map((f) => ({ type: "founder" as const, id: f.id, name: f.name, sub: f.companies.map((c) => c.name).join(", "), riskLevel: undefined, href: "/founders" })),
    ...results.watchlist.map((w) => ({ type: "watchlist" as const, id: w.id, name: w.name, sub: `${w.companyName} · ${w.listYear}`, riskLevel: undefined, href: "/watchlist" })),
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const navigate = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      navigate(allResults[selectedIndex].href);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-[#111] border border-card-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-card-border">
          <Search className="w-4 h-4 text-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search companies, founders, Forbes 30u30..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted/50"
          />
          <kbd className="text-[10px] text-muted bg-white/5 px-1.5 py-0.5 rounded">ESC</kbd>
          <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-muted" /></button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query && allResults.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted">No results for &quot;{query}&quot;</div>
          )}

          {!query && (
            <div className="px-4 py-6 text-center text-sm text-muted/50">
              Start typing to search across all data...
            </div>
          )}

          {results.companies.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] text-muted uppercase tracking-wider bg-white/[0.02]">Companies</div>
              {allResults.filter((r) => r.type === "company").map((result, i) => {
                const globalIndex = allResults.indexOf(result);
                return (
                  <button
                    key={result.id}
                    onClick={() => navigate(result.href)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors",
                      globalIndex === selectedIndex ? "bg-red-500/10" : "hover:bg-white/[0.03]"
                    )}
                  >
                    <Building2 className="w-4 h-4 text-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{result.name}</div>
                      <div className="text-[10px] text-muted truncate">{result.sub}</div>
                    </div>
                    {result.riskLevel && (
                      <span className={cn("text-[10px] font-medium capitalize", getRiskColor(result.riskLevel))}>
                        {result.riskLevel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {results.founders.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] text-muted uppercase tracking-wider bg-white/[0.02]">Founders</div>
              {allResults.filter((r) => r.type === "founder").map((result) => {
                const globalIndex = allResults.indexOf(result);
                return (
                  <button
                    key={result.id}
                    onClick={() => navigate(result.href)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors",
                      globalIndex === selectedIndex ? "bg-red-500/10" : "hover:bg-white/[0.03]"
                    )}
                  >
                    <Users className="w-4 h-4 text-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{result.name}</div>
                      <div className="text-[10px] text-muted truncate">{result.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {results.watchlist.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] text-muted uppercase tracking-wider bg-white/[0.02]">30 Under 30</div>
              {allResults.filter((r) => r.type === "watchlist").map((result) => {
                const globalIndex = allResults.indexOf(result);
                return (
                  <button
                    key={result.id}
                    onClick={() => navigate(result.href)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors",
                      globalIndex === selectedIndex ? "bg-red-500/10" : "hover:bg-white/[0.03]"
                    )}
                  >
                    <Award className="w-4 h-4 text-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{result.name}</div>
                      <div className="text-[10px] text-muted truncate">{result.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-card-border text-[10px] text-muted">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}

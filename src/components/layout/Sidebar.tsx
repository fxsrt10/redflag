"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  TriangleAlert,
  LayoutDashboard,
  Users,
  Award,
  DollarSign,
  Flag,
  ArrowLeftRight,
  Trophy,
  FileCheck,
  Search,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Companies", icon: LayoutDashboard, description: "Risk Intelligence" },
  { href: "/founders", label: "The Founders", icon: Users, description: "Founder Tracker" },
  { href: "/watchlist", label: "The Watchlist", icon: Award, description: "30 Under 30" },
  { href: "/compensation", label: "Risk vs Reward", icon: DollarSign, description: "Compensation" },
  { href: "/compare", label: "Compare", icon: ArrowLeftRight, description: "Side by Side" },
  { href: "/leaderboards", label: "Leaderboards", icon: Trophy, description: "Industry Rankings" },
  { href: "/evaluate", label: "Offer Evaluator", icon: FileCheck, description: "Should You Accept?" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#080808] border-r border-card-border flex flex-col z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-6 py-5 border-b border-card-border">
        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
          <Flag className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">RedFlag</h1>
          <p className="text-[10px] text-muted uppercase tracking-widest">Risk Intelligence</p>
        </div>
      </Link>

      {/* Search Hint */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-card-border text-xs text-muted">
          <Search className="w-3 h-3" />
          <span className="flex-1">Search...</span>
          <kbd className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                isActive
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "text-muted hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <div>
                <div className="font-medium text-[13px]">{item.label}</div>
                <div className="text-[10px] opacity-60">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-card-border">
        <div className="flex items-center gap-2 text-[10px] text-muted">
          <TriangleAlert className="w-3 h-3" />
          <span>Based on public data only. Not legal advice.</span>
        </div>
      </div>
    </aside>
  );
}

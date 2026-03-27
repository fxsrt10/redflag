import Link from "next/link";
import {
  Flag, LayoutDashboard, Users, Award, DollarSign,
  ArrowLeftRight, Trophy, FileCheck, Search, ArrowRight,
  Scale, TrendingDown, Scissors, AlertTriangle, Building2,
} from "lucide-react";

const STATS = [
  { label: "Companies Tracked", value: "100+", icon: Building2 },
  { label: "Industries Covered", value: "10+", icon: LayoutDashboard },
  { label: "Lawsuits Monitored", value: "500+", icon: Scale },
  { label: "Layoff Events", value: "50+", icon: Scissors },
];

const FEATURES = [
  {
    href: "/dashboard",
    label: "Company Risk Dashboard",
    description: "Real-time risk scores combining lawsuits, sentiment, and layoff data for 100+ companies across every industry.",
    icon: LayoutDashboard,
    tag: "Core",
  },
  {
    href: "/evaluate",
    label: "Job Offer Evaluator",
    description: "Paste your offer. See the risk. Get a verdict on whether the pay is worth the workplace risk.",
    icon: FileCheck,
    tag: "Popular",
  },
  {
    href: "/founders",
    label: "The Founders",
    description: "Does founder behavior predict employee pain? Track Musk, Zuckerberg, Kalanick, and more.",
    icon: Users,
    tag: "Trending",
  },
  {
    href: "/watchlist",
    label: "30 Under 30. Under Investigation.",
    description: "Track Forbes 30 Under 30 alumni and their legal adventures. Which class year should you avoid?",
    icon: Award,
    tag: "Viral",
  },
  {
    href: "/compare",
    label: "Compare Companies",
    description: "Side-by-side comparison of risk scores, compensation, sentiment, and lawsuits.",
    icon: ArrowLeftRight,
    tag: "Tool",
  },
  {
    href: "/leaderboards",
    label: "Industry Leaderboards",
    description: "Who's the riskiest employer? Best paying? Worst leadership? Rankings across every metric.",
    icon: Trophy,
    tag: "Rankings",
  },
];

const SPOTLIGHT_COMPANIES = [
  { name: "X (Twitter)", stat: "12.0 lawsuits/1K emp", risk: "95", level: "high" },
  { name: "Tesla", stat: "7 active court cases", risk: "82", level: "high" },
  { name: "Meta", stat: "27K+ jobs cut since 2022", risk: "72", level: "elevated" },
  { name: "Boeing", stat: "17K layoffs Nov 2024", risk: "72", level: "elevated" },
  { name: "Activision", stat: "$100M harassment settlement", risk: "78", level: "high" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero — compact, no wasted space */}
      <section className="flex flex-col items-center justify-center py-12 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent" />

        <div className="relative text-center max-w-3xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <Flag className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              Red<span className="text-red-500">Flag</span>
            </h1>
          </div>
          <p className="text-base text-muted/60 mb-6 max-w-md mx-auto leading-relaxed">
            See the lawsuits. Track the layoffs. Know the risk.
            <span className="text-foreground/80"> Before you accept the offer.</span>
          </p>

          <div className="flex items-center justify-center gap-3 mb-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
            >
              Explore Companies <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/evaluate"
              className="flex items-center gap-2 px-5 py-2.5 bg-card border border-card-border text-foreground rounded-lg font-medium text-sm hover:border-red-500/30 transition-all"
            >
              Evaluate an Offer <FileCheck className="w-4 h-4 text-red-400" />
            </Link>
          </div>

          <p className="text-xs text-muted/40 flex items-center justify-center gap-1.5">
            <Search className="w-3 h-3" /> Press <kbd className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded mx-0.5">Cmd+K</kbd> to search any company
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-card-border bg-card/50 py-5 px-8">
        <div className="grid grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-[10px] text-muted uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Spotlight: Riskiest Companies */}
      <section className="py-8 px-8">
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" /> Highest Risk Right Now
              </h2>
              <p className="text-sm text-muted mt-1">Companies with the most elevated workplace risk signals</p>
            </div>
            <Link href="/leaderboards" className="text-xs text-red-400 hover:underline flex items-center gap-1">
              Full Leaderboard <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {SPOTLIGHT_COMPANIES.map((co) => (
              <Link
                key={co.name}
                href="/dashboard"
                className="bg-card border border-card-border rounded-xl p-4 hover:border-red-500/20 transition-all group"
              >
                <div className="text-sm font-semibold mb-2 group-hover:text-red-400 transition-colors">{co.name}</div>
                <div className="text-2xl font-bold text-red-400 mb-1">{co.risk}<span className="text-xs text-muted">/100</span></div>
                <div className="text-[10px] text-muted">{co.stat}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-8 px-8 border-t border-card-border">
        <div>
          <h2 className="text-xl font-bold mb-2">What You Can Do</h2>
          <p className="text-sm text-muted mb-8">Seven tools to help you understand workplace risk before it&apos;s too late.</p>

          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="flex gap-4 p-5 bg-card border border-card-border rounded-xl hover:border-red-500/20 hover:bg-red-500/[0.02] transition-all group"
              >
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm group-hover:text-red-400 transition-colors">{feature.label}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-muted uppercase tracking-wider">{feature.tag}</span>
                  </div>
                  <p className="text-xs text-muted/70 leading-relaxed">{feature.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-8 border-t border-card-border">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-3">Got a job offer?</h2>
          <p className="text-muted mb-6">Check the company&apos;s risk score before you sign. It&apos;s free.</p>
          <Link
            href="/evaluate"
            className="inline-flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
            Evaluate Your Offer <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[10px] text-muted/30 mt-8">
            Based on publicly available federal court data, SEC filings, and employee sentiment.
            Not legal or career advice. Patterns shown do not imply causation.
          </p>
        </div>
      </section>
    </div>
  );
}

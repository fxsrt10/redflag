import Link from "next/link";
import { Flag, LayoutDashboard, Users, Award, DollarSign } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center -ml-64 px-8">
      <div className="text-center max-w-2xl">
        <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Flag className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Red<span className="text-red-500">Flag</span>
        </h1>
        <p className="text-lg text-muted mb-2">Workplace Risk Intelligence</p>
        <p className="text-sm text-muted/60 mb-12 max-w-md mx-auto">
          Track company lawsuits, employee sentiment, founder controversies, and compensation.
          See the signals before you take the job.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 p-4 rounded-xl border border-card-border bg-card hover:border-red-500/30 hover:bg-red-500/5 transition-all"
          >
            <LayoutDashboard className="w-5 h-5 text-red-400" />
            <div className="text-left">
              <div className="font-medium text-sm">Companies</div>
              <div className="text-[10px] text-muted">Risk Dashboard</div>
            </div>
          </Link>
          <Link
            href="/founders"
            className="flex items-center gap-3 p-4 rounded-xl border border-card-border bg-card hover:border-red-500/30 hover:bg-red-500/5 transition-all"
          >
            <Users className="w-5 h-5 text-red-400" />
            <div className="text-left">
              <div className="font-medium text-sm">The Founders</div>
              <div className="text-[10px] text-muted">Founder Tracker</div>
            </div>
          </Link>
          <Link
            href="/watchlist"
            className="flex items-center gap-3 p-4 rounded-xl border border-card-border bg-card hover:border-red-500/30 hover:bg-red-500/5 transition-all"
          >
            <Award className="w-5 h-5 text-red-400" />
            <div className="text-left">
              <div className="font-medium text-sm">The Watchlist</div>
              <div className="text-[10px] text-muted">30 Under 30</div>
            </div>
          </Link>
          <Link
            href="/compensation"
            className="flex items-center gap-3 p-4 rounded-xl border border-card-border bg-card hover:border-red-500/30 hover:bg-red-500/5 transition-all"
          >
            <DollarSign className="w-5 h-5 text-red-400" />
            <div className="text-left">
              <div className="font-medium text-sm">Risk vs Reward</div>
              <div className="text-[10px] text-muted">Compensation</div>
            </div>
          </Link>
        </div>

        <p className="text-[10px] text-muted/40 mt-12">
          Based on publicly available data. Not legal advice. Patterns shown do not imply causation.
        </p>
      </div>
    </div>
  );
}

import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getRiskColor(level: string): string {
  switch (level) {
    case "low": return "text-emerald-400";
    case "moderate": return "text-yellow-400";
    case "elevated": return "text-orange-400";
    case "high": return "text-red-400";
    default: return "text-gray-400";
  }
}

export function getRiskBg(level: string): string {
  switch (level) {
    case "low": return "bg-emerald-400/10 border-emerald-400/30";
    case "moderate": return "bg-yellow-400/10 border-yellow-400/30";
    case "elevated": return "bg-orange-400/10 border-orange-400/30";
    case "high": return "bg-red-400/10 border-red-400/30";
    default: return "bg-gray-400/10 border-gray-400/30";
  }
}

export function getRiskBgSolid(level: string): string {
  switch (level) {
    case "low": return "bg-emerald-500";
    case "moderate": return "bg-yellow-500";
    case "elevated": return "bg-orange-500";
    case "high": return "bg-red-500";
    default: return "bg-gray-500";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "clean": return "text-emerald-400 bg-emerald-400/10";
    case "active": return "text-blue-400 bg-blue-400/10";
    case "settled": return "text-yellow-400 bg-yellow-400/10";
    case "charged": case "under_investigation": return "text-orange-400 bg-orange-400/10";
    case "convicted": return "text-red-400 bg-red-400/10";
    case "defunct_company": return "text-gray-400 bg-gray-400/10";
    default: return "text-gray-400 bg-gray-400/10";
  }
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case "discrimination": return "bg-red-500";
    case "harassment": return "bg-pink-500";
    case "retaliation": return "bg-orange-500";
    case "wage_hour": return "bg-yellow-500";
    case "wrongful_termination": return "bg-purple-500";
    case "class_action": return "bg-blue-500";
    case "sec_action": return "bg-cyan-500";
    default: return "bg-gray-500";
  }
}

export function getCategoryBg(category: string): string {
  switch (category) {
    case "discrimination": return "bg-red-500/10 text-red-400";
    case "harassment": return "bg-pink-500/10 text-pink-400";
    case "retaliation": return "bg-orange-500/10 text-orange-400";
    case "wage_hour": return "bg-yellow-500/10 text-yellow-400";
    case "wrongful_termination": return "bg-purple-500/10 text-purple-400";
    case "class_action": return "bg-blue-500/10 text-blue-400";
    case "sec_action": return "bg-cyan-500/10 text-cyan-400";
    default: return "bg-gray-500/10 text-gray-400";
  }
}

export function getTrendInfo(trend: string): { label: string; color: string; arrow: string } {
  switch (trend) {
    case "improving": return { label: "Improving", color: "text-emerald-400", arrow: "▲" };
    case "stable": return { label: "Stable", color: "text-muted", arrow: "—" };
    case "declining": return { label: "Declining", color: "text-orange-400", arrow: "▼" };
    case "rapidly_declining": return { label: "Rapidly Declining", color: "text-red-400", arrow: "▼▼" };
    default: return { label: "Unknown", color: "text-muted", arrow: "—" };
  }
}

export function getScoreLevel(score: number): "low" | "moderate" | "elevated" | "high" {
  if (score >= 75) return "high";
  if (score >= 50) return "elevated";
  if (score >= 30) return "moderate";
  return "low";
}

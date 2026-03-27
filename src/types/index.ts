// ============================================
// RedFlag — Core Types
// ============================================

// --- Companies ---
export interface Company {
  id: string;
  name: string;
  ticker: string | null;
  legalName: string;
  industry: string;
  sizeBucket: "micro" | "small" | "mid" | "large" | "mega";
  employeeCount: number;
  hqState: string;
  website: string;
  logoUrl?: string;
  glassdoor: GlassdoorSnapshot;
  lawsuits: LawsuitSummary;
  riskScore: RiskScore;
  compensation?: CompensationSummary;
}

export interface GlassdoorSnapshot {
  overall: number;
  culture: number;
  leadership: number;
  workLife: number;
  compensation: number;
  careerOpportunities: number;
  recommendPct: number;
  ceoApprovalPct: number;
  reviewCount: number;
  trend: "improving" | "stable" | "declining" | "rapidly_declining";
}

export interface LawsuitSummary {
  totalFilings12mo: number;
  employmentFilings12mo: number;
  filingsPerThousandEmployees: number;
  topCategories: LawsuitCategory[];
  filingAcceleration: number; // ratio recent 90d vs prior 90d
  recentCases: Lawsuit[];
}

export type LawsuitCategoryType =
  | "discrimination"
  | "harassment"
  | "retaliation"
  | "wage_hour"
  | "wrongful_termination"
  | "class_action"
  | "sec_action"
  | "other";

export interface LawsuitCategory {
  category: LawsuitCategoryType;
  count: number;
}

export interface Lawsuit {
  id: string;
  caseNumber: string;
  court: string;
  filedDate: string;
  category: LawsuitCategoryType;
  status: "open" | "closed" | "settled";
  plaintiffType: "individual" | "class_action" | "eeoc" | "government";
  description: string;
  sourceUrl?: string;
}

// --- Risk Score ---
export interface RiskScore {
  overall: number; // 0-100
  filingRate: number;
  sentimentTrend: number;
  themeConcentration: number;
  filingAcceleration: number;
  warnSignal: number;
  industryPercentile: number;
  sizePercentile: number;
  riskLevel: "low" | "moderate" | "elevated" | "high";
}

// --- Founders ---
export interface Founder {
  id: string;
  name: string;
  title: string;
  netWorthBand: string;
  photoUrl?: string;
  companies: FounderCompany[];
  legalEvents: FounderLegalEvent[];
  controversyEvents: FounderControversyEvent[];
  impactScore: number; // 0-100
  companyImpacts: CompanyImpact[];
}

export interface FounderCompany {
  companyId?: string;
  name: string;
  role: string;
  startYear: number;
  endYear: number | null;
}

export interface FounderLegalEvent {
  date: string;
  eventType: "personal_lawsuit" | "sec_action" | "regulatory" | "criminal" | "settlement";
  description: string;
  severity: "minor" | "moderate" | "major" | "criminal";
  outcome: "pending" | "settled" | "convicted" | "dismissed" | "ongoing";
  relatedCompany?: string;
}

export interface FounderControversyEvent {
  date: string;
  eventType: "public_statement" | "policy_change" | "mass_layoff" | "social_media" | "congressional" | "acquisition" | "resignation";
  headline: string;
  impactLevel: "low" | "medium" | "high" | "viral";
  relatedCompany?: string;
}

export interface CompanyImpact {
  company: string;
  eventDescription: string;
  glassdoorBefore: number;
  glassdoorAfter: number;
  lawsuitSpikePct: number;
}

// --- Forbes 30 Under 30 ---
export interface Forbes30u30 {
  id: string;
  name: string;
  listYear: number;
  category: string;
  companyName: string;
  ageAtListing: number;
  photoUrl?: string;
  currentStatus: "active" | "defunct_company" | "convicted" | "charged" | "settled" | "under_investigation" | "clean";
  events: Forbes30u30Event[];
}

export interface Forbes30u30Event {
  date: string;
  eventType: "lawsuit" | "sec_action" | "criminal_charge" | "settlement" | "conviction" | "acquittal" | "bankruptcy" | "fraud";
  description: string;
  severity: "minor" | "moderate" | "major" | "criminal";
  outcome: "pending" | "settled" | "convicted" | "dismissed" | "acquitted";
}

export interface Forbes30u30YearStats {
  listYear: number;
  totalListed: number;
  legalEventsCount: number;
  personsWithEvents: number;
  fraudRatePct: number;
  avgYearsToEvent: number;
  mostCommonEvent: string;
}

// --- Compensation ---
export interface CompensationEntry {
  companyId: string;
  companyName: string;
  title: string;
  level: string;
  department: string;
  baseSalary: number;
  totalComp: number; // base + stock + bonus
  stockValue: number;
  bonus: number;
  location: string;
  yearsExperience: number;
  source: "levels.fyi" | "glassdoor" | "self_reported";
  reportDate: string;
}

export interface CompensationSummary {
  medianTotalComp: number;
  medianBase: number;
  compByLevel: { level: string; medianTotal: number; count: number }[];
  compVsPeers: number; // percentile vs industry
}

export interface RiskRewardEntry {
  companyId: string;
  companyName: string;
  ticker: string | null;
  riskScore: number;
  riskLevel: "low" | "moderate" | "elevated" | "high";
  medianTotalComp: number;
  glassdoorOverall: number;
  industry: string;
  sizeBucket: string;
  employeeCount: number;
}

// --- Layoffs ---
export interface LayoffEvent {
  id: string;
  companyId: string;
  date: string;
  employeesAffected: number;
  percentOfWorkforce: number;
  reason: string;
  type: "layoff" | "warn_act" | "restructuring" | "office_closure";
  source: string; // article title
  sourceUrl: string; // link to article
  warnFilingUrl?: string; // direct link to WARN filing if applicable
}

// --- Financial Data ---
export interface FinancialSnapshot {
  companyId: string;
  snapshotDate: string;
  stockPrice: number | null;
  stockPrice30dAgo: number | null;
  stockPrice90dAgo: number | null;
  priceChange30dPct: number | null;
  priceChange90dPct: number | null;
  marketCap: number | null;
  revenueQuarterly: number | null;
  revenueTTM: number | null;
  revenueGrowthYoYPct: number | null;
  netIncomeQuarterly: number | null;
  netIncomeTTM: number | null;
  employeeCount: number | null;
  employeeCountPrior: number | null;
  employeeChangePct: number | null;
  revenuePerEmployee: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  freeCashFlow: number | null;
  source: "sec_edgar" | "fmp" | "alpha_vantage";
  fetchedAt: string;
}

export interface FinancialSummary {
  latestPrice: number | null;
  priceChange30dPct: number | null;
  priceChange90dPct: number | null;
  marketCap: number | null;
  revenueGrowthYoYPct: number | null;
  employeeChangePct: number | null;
  revenuePerEmployee: number | null;
  debtToEquity: number | null;
  freeCashFlow: number | null;
  financialHealthSignal: "strong" | "stable" | "weakening" | "distressed";
}

// --- Layoff Predictions ---
export interface LayoffPrediction {
  companyId: string;
  predictionDate: string;
  probability: number;
  riskTier: "very_low" | "low" | "moderate" | "high" | "very_high";
  confidence: number;
  timeHorizon: "30d" | "90d" | "180d";
  signals: LayoffSignals;
  topFactors: string[];
}

export interface LayoffSignals {
  financialStress: number;
  workforceContraction: number;
  stockDecline: number;
  sentimentDeterioration: number;
  lawsuitAcceleration: number;
  warnHistory: number;
  newsSignal: number;
  industryContagion: number;
  executiveSignals: number;
}

// --- News ---
export interface NewsItem {
  id: string;
  companyId: string;
  publishedDate: string;
  title: string;
  source: string;
  url: string;
  sentiment: "positive" | "neutral" | "negative";
  isLayoffRelated: boolean;
}

// --- Timeline ---
export interface TimelineEvent {
  date: string;
  type: "lawsuit" | "sentiment" | "controversy" | "layoff" | "legal" | "compensation";
  title: string;
  description: string;
  severity?: "low" | "medium" | "high";
  relatedEntity?: string;
}

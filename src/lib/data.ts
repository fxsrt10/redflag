import { companies, founders, forbes30u30, compensationEntries } from "@/data/mock";
import type { Company, Founder, Forbes30u30, CompensationEntry } from "@/types";

export function getCompanyById(id: string): Company | undefined {
  return companies.find((c) => c.id === id);
}

export function getFoundersByCompany(companyName: string): Founder[] {
  return founders.filter(
    (f) =>
      f.companies.some((c) => c.name === companyName) ||
      f.companyImpacts.some((i) => i.company === companyName)
  );
}

export function getCompensationByCompany(companyId: string): CompensationEntry[] {
  return compensationEntries.filter((e) => e.companyId === companyId);
}

export function getPeerCompanies(company: Company, limit = 6): Company[] {
  return companies
    .filter((c) => c.id !== company.id)
    .map((c) => {
      let score = 0;
      if (c.industry === company.industry) score += 3;
      if (c.sizeBucket === company.sizeBucket) score += 2;
      // partial industry match (e.g. "Tech" in "Tech / Cloud")
      const baseIndustry = company.industry.split("/")[0].trim();
      if (c.industry.includes(baseIndustry)) score += 1;
      return { company: c, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.company);
}

export function searchAll(query: string): {
  companies: Company[];
  founders: Founder[];
  watchlist: Forbes30u30[];
} {
  const q = query.toLowerCase();
  if (!q) return { companies: [], founders: [], watchlist: [] };

  return {
    companies: companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.ticker?.toLowerCase().includes(q) ||
        c.legalName.toLowerCase().includes(q)
    ).slice(0, 8),
    founders: founders.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 5),
    watchlist: forbes30u30.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.companyName.toLowerCase().includes(q)
    ).slice(0, 5),
  };
}

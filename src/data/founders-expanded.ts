import { Founder } from "@/types";

export const expandedFounders: Founder[] = [
  {
    id: "altman",
    name: "Sam Altman",
    title: "CEO",
    netWorthBand: "$1B+",
    companies: [
      { name: "OpenAI", role: "CEO", startYear: 2019, endYear: null },
      { name: "Y Combinator", role: "Former President", startYear: 2014, endYear: 2019 },
    ],
    legalEvents: [
      { date: "2023-11", eventType: "personal_lawsuit", description: "Briefly fired by OpenAI board over concerns about candor — reinstated days later after employee revolt and Microsoft intervention", severity: "major", outcome: "dismissed", relatedCompany: "OpenAI" },
      { date: "2024-01", eventType: "personal_lawsuit", description: "Altman's sister filed lawsuit alleging years of sexual abuse — Altman publicly denied all allegations", severity: "major", outcome: "ongoing" },
      { date: "2024-11", eventType: "personal_lawsuit", description: "Elon Musk filed lawsuit against Altman and OpenAI alleging breach of founding agreement to remain nonprofit", severity: "major", outcome: "ongoing", relatedCompany: "OpenAI" },
    ],
    controversyEvents: [
      { date: "2023-11", eventType: "resignation", headline: "OpenAI board fires Altman citing loss of confidence — 700+ employees threaten to quit, Microsoft offers to hire all of them", impactLevel: "viral", relatedCompany: "OpenAI" },
      { date: "2023-11", eventType: "policy_change", headline: "Altman reinstated as CEO with new board after 5-day crisis that nearly destroyed OpenAI", impactLevel: "viral", relatedCompany: "OpenAI" },
      { date: "2024-05", eventType: "resignation", headline: "Key safety researchers (Ilya Sutskever, Jan Leike) depart OpenAI citing disagreements over safety priorities", impactLevel: "high", relatedCompany: "OpenAI" },
      { date: "2024-09", eventType: "policy_change", headline: "OpenAI restructures from nonprofit to for-profit capped entity, drawing criticism from co-founders", impactLevel: "high", relatedCompany: "OpenAI" },
    ],
    impactScore: 78,
    companyImpacts: [
      { company: "OpenAI", eventDescription: "Board crisis + safety team departures", glassdoorBefore: 4.0, glassdoorAfter: 3.6, lawsuitSpikePct: 120 },
    ],
  },
  {
    id: "nadella",
    name: "Satya Nadella",
    title: "CEO",
    netWorthBand: "$1B+",
    companies: [
      { name: "Microsoft", role: "CEO", startYear: 2014, endYear: null },
    ],
    legalEvents: [
      { date: "2022-01", eventType: "regulatory", description: "FTC attempted to block Microsoft's $69B Activision acquisition — ultimately approved after court challenge", severity: "moderate", outcome: "dismissed", relatedCompany: "Microsoft" },
    ],
    controversyEvents: [
      { date: "2023-01", eventType: "mass_layoff", headline: "Microsoft lays off 10,000 employees (5% of workforce)", impactLevel: "high", relatedCompany: "Microsoft" },
      { date: "2024-06", eventType: "mass_layoff", headline: "Microsoft lays off 1,900 Activision Blizzard and Xbox employees post-acquisition", impactLevel: "medium", relatedCompany: "Microsoft" },
    ],
    impactScore: 25,
    companyImpacts: [
      { company: "Microsoft", eventDescription: "Layoffs during AI pivot", glassdoorBefore: 4.3, glassdoorAfter: 4.2, lawsuitSpikePct: 5 },
    ],
  },
  {
    id: "huang",
    name: "Jensen Huang",
    title: "CEO",
    netWorthBand: "$100B+",
    companies: [
      { name: "Nvidia", role: "Co-founder & CEO", startYear: 1993, endYear: null },
    ],
    legalEvents: [
      { date: "2022-05", eventType: "sec_action", description: "SEC fined Nvidia $5.5M for inadequate disclosure of crypto mining impact on gaming GPU revenue", severity: "moderate", outcome: "settled", relatedCompany: "Nvidia" },
    ],
    controversyEvents: [
      { date: "2022-09", eventType: "policy_change", headline: "US government restricts Nvidia AI chip exports to China — major revenue impact", impactLevel: "high", relatedCompany: "Nvidia" },
    ],
    impactScore: 15,
    companyImpacts: [
      { company: "Nvidia", eventDescription: "Minimal founder controversy — company risk largely external/regulatory", glassdoorBefore: 4.4, glassdoorAfter: 4.4, lawsuitSpikePct: 0 },
    ],
  },
  {
    id: "hastings",
    name: "Reed Hastings",
    title: "Executive Chairman",
    netWorthBand: "$5B+",
    companies: [
      { name: "Netflix", role: "Co-founder & Executive Chairman", startYear: 1997, endYear: null },
    ],
    legalEvents: [],
    controversyEvents: [
      { date: "2022-04", eventType: "mass_layoff", headline: "Netflix loses 200K subscribers for first time — stock crashes 35%, layoffs of ~450 follow", impactLevel: "high", relatedCompany: "Netflix" },
      { date: "2022-05", eventType: "policy_change", headline: "Netflix fires employees who leaked Dave Chappelle special meeting details — free speech debate erupts", impactLevel: "high", relatedCompany: "Netflix" },
      { date: "2023-01", eventType: "resignation", headline: "Hastings steps down as co-CEO, transitions to Executive Chairman", impactLevel: "medium", relatedCompany: "Netflix" },
    ],
    impactScore: 30,
    companyImpacts: [
      { company: "Netflix", eventDescription: "Subscriber loss + culture memo controversy", glassdoorBefore: 4.1, glassdoorAfter: 3.9, lawsuitSpikePct: 15 },
    ],
  },
  {
    id: "cook",
    name: "Tim Cook",
    title: "CEO",
    netWorthBand: "$2B+",
    companies: [
      { name: "Apple", role: "CEO", startYear: 2011, endYear: null },
    ],
    legalEvents: [
      { date: "2024-03", eventType: "regulatory", description: "DOJ sued Apple for monopolistic practices in smartphone market", severity: "major", outcome: "ongoing", relatedCompany: "Apple" },
      { date: "2024-03", eventType: "regulatory", description: "EU fined Apple $2B for anti-competitive App Store music streaming restrictions", severity: "major", outcome: "settled", relatedCompany: "Apple" },
    ],
    controversyEvents: [
      { date: "2022-09", eventType: "policy_change", headline: "Apple mandates 3-day return-to-office — internal petition with 1,000+ signatures pushes back", impactLevel: "medium", relatedCompany: "Apple" },
      { date: "2023-01", eventType: "policy_change", headline: "Apple settles employee surveillance and social media policy NLRB case", impactLevel: "medium", relatedCompany: "Apple" },
    ],
    impactScore: 20,
    companyImpacts: [
      { company: "Apple", eventDescription: "RTO mandate + regulatory pressure", glassdoorBefore: 4.3, glassdoorAfter: 4.2, lawsuitSpikePct: 8 },
    ],
  },
  {
    id: "khosrowshahi",
    name: "Dara Khosrowshahi",
    title: "CEO",
    netWorthBand: "$500M+",
    companies: [
      { name: "Uber", role: "CEO", startYear: 2017, endYear: null },
      { name: "Expedia", role: "Former CEO", startYear: 2005, endYear: 2017 },
    ],
    legalEvents: [
      { date: "2022-07", eventType: "regulatory", description: "Uber files revealed Khosrowshahi era cover-up of 2016 data breach affecting 57M users — company paid $148M settlement", severity: "major", outcome: "settled", relatedCompany: "Uber" },
    ],
    controversyEvents: [
      { date: "2020-05", eventType: "mass_layoff", headline: "Uber lays off 6,700 employees (25% of workforce) during COVID pandemic", impactLevel: "viral", relatedCompany: "Uber" },
      { date: "2023-02", eventType: "policy_change", headline: "Uber achieves first-ever operating profit — but gig worker classification battles continue", impactLevel: "medium", relatedCompany: "Uber" },
    ],
    impactScore: 45,
    companyImpacts: [
      { company: "Uber", eventDescription: "Post-Kalanick recovery — improving but lawsuit legacy persists", glassdoorBefore: 3.1, glassdoorAfter: 3.5, lawsuitSpikePct: -25 },
    ],
  },
  {
    id: "chesky",
    name: "Brian Chesky",
    title: "CEO",
    netWorthBand: "$10B+",
    companies: [
      { name: "Airbnb", role: "Co-founder & CEO", startYear: 2008, endYear: null },
    ],
    legalEvents: [
      { date: "2020-08", eventType: "personal_lawsuit", description: "Multiple discrimination lawsuits alleging Airbnb platform enabled racial profiling by hosts", severity: "moderate", outcome: "settled", relatedCompany: "Airbnb" },
    ],
    controversyEvents: [
      { date: "2020-05", eventType: "mass_layoff", headline: "Airbnb lays off 1,900 employees (25%) — Chesky's empathetic layoff memo goes viral as 'how to do it right'", impactLevel: "viral", relatedCompany: "Airbnb" },
      { date: "2023-04", eventType: "policy_change", headline: "Chesky announces permanent remote work policy — 'live and work anywhere'", impactLevel: "medium", relatedCompany: "Airbnb" },
    ],
    impactScore: 28,
    companyImpacts: [
      { company: "Airbnb", eventDescription: "COVID layoffs handled well — recovery strong", glassdoorBefore: 4.0, glassdoorAfter: 4.0, lawsuitSpikePct: 10 },
    ],
  },
  {
    id: "ek",
    name: "Daniel Ek",
    title: "CEO",
    netWorthBand: "$5B+",
    companies: [
      { name: "Spotify", role: "Co-founder & CEO", startYear: 2006, endYear: null },
    ],
    legalEvents: [
      { date: "2024-01", eventType: "regulatory", description: "EU fined Spotify-related Apple antitrust case resulted in $2B Apple fine — Spotify was complainant, not defendant", severity: "minor", outcome: "settled" },
    ],
    controversyEvents: [
      { date: "2023-01", eventType: "mass_layoff", headline: "Spotify lays off 600 employees (6% of workforce)", impactLevel: "high", relatedCompany: "Spotify" },
      { date: "2023-06", eventType: "mass_layoff", headline: "Spotify lays off another 200 from podcast division after $1B+ podcast investment writedowns", impactLevel: "high", relatedCompany: "Spotify" },
      { date: "2023-12", eventType: "mass_layoff", headline: "Spotify lays off 1,500 employees (17% of workforce) — third round in 2023", impactLevel: "viral", relatedCompany: "Spotify" },
    ],
    impactScore: 48,
    companyImpacts: [
      { company: "Spotify", eventDescription: "Three rounds of layoffs in 2023 — 1/4 of company cut", glassdoorBefore: 4.1, glassdoorAfter: 3.5, lawsuitSpikePct: 45 },
    ],
  },
  {
    id: "collison",
    name: "Patrick Collison",
    title: "CEO",
    netWorthBand: "$10B+",
    companies: [
      { name: "Stripe", role: "Co-founder & CEO", startYear: 2010, endYear: null },
    ],
    legalEvents: [],
    controversyEvents: [
      { date: "2022-11", eventType: "mass_layoff", headline: "Stripe lays off 14% of employees (~1,100 people) — Collison takes personal responsibility in widely praised memo", impactLevel: "high", relatedCompany: "Stripe" },
    ],
    impactScore: 18,
    companyImpacts: [
      { company: "Stripe", eventDescription: "One layoff round, handled transparently", glassdoorBefore: 4.0, glassdoorAfter: 3.8, lawsuitSpikePct: 5 },
    ],
  },
];

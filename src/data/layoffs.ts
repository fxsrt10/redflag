import type { LayoffEvent } from "@/types";

export const layoffEvents: LayoffEvent[] = [
  // ===== TESLA =====
  {
    id: "tesla-2024-04",
    companyId: "tesla",
    date: "2024-04-15",
    employeesAffected: 14000,
    percentOfWorkforce: 10,
    reason: "Cost reduction amid EV demand slowdown and price cuts",
    type: "layoff",
    source: "Tesla lays off more than 10% of its global workforce — Reuters",
    sourceUrl: "https://www.reuters.com/business/autos-transportation/tesla-lay-off-more-than-10-its-global-workforce-electrek-reports-2024-04-15/",
  },
  {
    id: "tesla-2023-01",
    companyId: "tesla",
    date: "2023-01-18",
    employeesAffected: 6000,
    percentOfWorkforce: 4,
    reason: "Salaried workforce reduction amid economic uncertainty",
    type: "layoff",
    source: "Tesla to lay off about 6% of salaried workforce — Bloomberg",
    sourceUrl: "https://www.bloomberg.com/news/articles/2023-01-18/tesla-to-cut-about-6-of-salaried-workforce",
  },
  {
    id: "tesla-2024-06",
    companyId: "tesla",
    date: "2024-06-20",
    employeesAffected: 600,
    percentOfWorkforce: 0.4,
    reason: "Supercharger team eliminated, Energy team cuts",
    type: "layoff",
    source: "Elon Musk disbanded Tesla's entire Supercharger team — The Verge",
    sourceUrl: "https://www.theverge.com/2024/4/30/24145370/tesla-supercharger-layoffs-network-ev-charging",
  },

  // ===== META =====
  {
    id: "meta-2022-11",
    companyId: "meta",
    date: "2022-11-09",
    employeesAffected: 11000,
    percentOfWorkforce: 13,
    reason: "Overhiring during pandemic, metaverse investment losses",
    type: "layoff",
    source: "Mark Zuckerberg announces 11,000 layoffs at Meta — CNN",
    sourceUrl: "https://www.cnn.com/2022/11/09/tech/meta-layoffs/index.html",
  },
  {
    id: "meta-2023-03",
    companyId: "meta",
    date: "2023-03-14",
    employeesAffected: 10000,
    percentOfWorkforce: 13,
    reason: "Year of Efficiency — flattening organization, cutting middle management",
    type: "layoff",
    source: "Meta to lay off 10,000 more workers — NY Times",
    sourceUrl: "https://www.nytimes.com/2023/03/14/technology/meta-layoffs.html",
  },
  {
    id: "meta-2023-05",
    companyId: "meta",
    date: "2023-05-24",
    employeesAffected: 6000,
    percentOfWorkforce: 8,
    reason: "Third round of Year of Efficiency cuts",
    type: "layoff",
    source: "Meta begins third round of layoffs — The Verge",
    sourceUrl: "https://www.theverge.com/2023/5/24/23736187/meta-layoffs-third-round-year-of-efficiency",
  },

  // ===== AMAZON =====
  {
    id: "amazon-2023-01",
    companyId: "amazon",
    date: "2023-01-04",
    employeesAffected: 18000,
    percentOfWorkforce: 1.2,
    reason: "Overhiring during pandemic, economic uncertainty",
    type: "layoff",
    source: "Amazon to lay off more than 18,000 employees — WSJ",
    sourceUrl: "https://www.wsj.com/articles/amazon-to-lay-off-over-17-000-workers-more-than-first-planned-11672874304",
  },
  {
    id: "amazon-2024-01",
    companyId: "amazon",
    date: "2024-01-10",
    employeesAffected: 500,
    percentOfWorkforce: 0.03,
    reason: "Twitch streaming division cuts",
    type: "layoff",
    source: "Amazon's Twitch to lay off 500 employees — Bloomberg",
    sourceUrl: "https://www.bloomberg.com/news/articles/2024-01-09/amazon-s-twitch-to-cut-about-500-employees",
  },

  // ===== GOOGLE =====
  {
    id: "google-2023-01",
    companyId: "google",
    date: "2023-01-20",
    employeesAffected: 12000,
    percentOfWorkforce: 6,
    reason: "Hired for a different economic reality — Sundar Pichai memo",
    type: "layoff",
    source: "Google to lay off 12,000 workers — NY Times",
    sourceUrl: "https://www.nytimes.com/2023/01/20/technology/google-layoffs.html",
  },
  {
    id: "google-2024-01",
    companyId: "google",
    date: "2024-01-11",
    employeesAffected: 1000,
    percentOfWorkforce: 0.5,
    reason: "Cuts across hardware, voice assistant, and engineering teams",
    type: "layoff",
    source: "Google lays off hundreds across engineering and hardware — The Verge",
    sourceUrl: "https://www.theverge.com/2024/1/11/24034124/google-layoffs-engineering-assistant-hardware",
  },

  // ===== X (TWITTER) =====
  {
    id: "twitter-2022-11",
    companyId: "twitter",
    date: "2022-11-04",
    employeesAffected: 3700,
    percentOfWorkforce: 50,
    reason: "Post-acquisition cost reduction under Elon Musk ownership",
    type: "layoff",
    source: "Elon Musk begins mass layoffs at Twitter — Washington Post",
    sourceUrl: "https://www.washingtonpost.com/technology/2022/11/03/twitter-layoffs-elon-musk/",
  },
  {
    id: "twitter-2022-12",
    companyId: "twitter",
    date: "2022-12-15",
    employeesAffected: 1200,
    percentOfWorkforce: 30,
    reason: "Continued reductions post-acquisition — including contractors",
    type: "layoff",
    source: "Twitter slashes more staff, bringing total cuts past 60% — Bloomberg",
    sourceUrl: "https://www.bloomberg.com/news/articles/2022-12-15/twitter-said-to-slash-more-staff-bringing-total-cuts-past-60",
  },

  // ===== MICROSOFT =====
  {
    id: "microsoft-2023-01",
    companyId: "microsoft",
    date: "2023-01-18",
    employeesAffected: 10000,
    percentOfWorkforce: 5,
    reason: "Macroeconomic conditions, workforce realignment",
    type: "layoff",
    source: "Microsoft lays off 10,000 employees — The Verge",
    sourceUrl: "https://www.theverge.com/2023/1/18/23560315/microsoft-job-cuts-layoffs-2023-10000",
  },
  {
    id: "microsoft-2024-01",
    companyId: "microsoft",
    date: "2024-01-25",
    employeesAffected: 1900,
    percentOfWorkforce: 0.8,
    reason: "Activision Blizzard and Xbox gaming division post-acquisition restructuring",
    type: "layoff",
    source: "Microsoft lays off 1,900 Activision Blizzard and Xbox employees — The Verge",
    sourceUrl: "https://www.theverge.com/2024/1/25/24049050/microsoft-activision-blizzard-layoffs",
  },

  // ===== SALESFORCE =====
  {
    id: "salesforce-2023-01",
    companyId: "salesforce",
    date: "2023-01-04",
    employeesAffected: 7000,
    percentOfWorkforce: 10,
    reason: "Hired too many people during pandemic, economic downturn",
    type: "layoff",
    source: "Salesforce to cut 10% of workforce — CNBC",
    sourceUrl: "https://www.cnbc.com/2023/01/04/salesforce-to-cut-10percent-of-staff-close-some-offices.html",
    warnFilingUrl: "https://edd.ca.gov/en/jobs_and_training/Layoff_Services_WARN/",
  },

  // ===== SPOTIFY =====
  {
    id: "spotify-2023-01",
    companyId: "spotify",
    date: "2023-01-23",
    employeesAffected: 600,
    percentOfWorkforce: 6,
    reason: "Economic slowdown, reduce costs ahead of profitability push",
    type: "layoff",
    source: "Spotify to cut 6% of workforce — TechCrunch",
    sourceUrl: "https://techcrunch.com/2023/01/23/spotify-is-laying-off-6-of-its-workforce/",
  },
  {
    id: "spotify-2023-06",
    companyId: "spotify",
    date: "2023-06-05",
    employeesAffected: 200,
    percentOfWorkforce: 2,
    reason: "Podcast division restructuring after $1B+ investment writedowns",
    type: "layoff",
    source: "Spotify lays off 200 employees in podcast division — WSJ",
    sourceUrl: "https://www.wsj.com/articles/spotify-is-laying-off-podcast-staff-8f9b74c3",
  },
  {
    id: "spotify-2023-12",
    companyId: "spotify",
    date: "2023-12-04",
    employeesAffected: 1500,
    percentOfWorkforce: 17,
    reason: "Efficiency drive — CEO Daniel Ek said company still too large",
    type: "layoff",
    source: "Spotify to cut 17% of workforce in third round of 2023 layoffs — CNBC",
    sourceUrl: "https://www.cnbc.com/2023/12/04/spotify-to-lay-off-17percent-of-employees-in-third-round-of-cuts.html",
  },

  // ===== STRIPE =====
  {
    id: "stripe-2022-11",
    companyId: "stripe",
    date: "2022-11-03",
    employeesAffected: 1120,
    percentOfWorkforce: 14,
    reason: "Overhired for optimistic forecast — CEO took personal responsibility",
    type: "layoff",
    source: "Stripe to lay off 14% of workers — TechCrunch",
    sourceUrl: "https://techcrunch.com/2022/11/03/stripe-is-laying-off-14-of-its-workforce/",
  },

  // ===== COINBASE =====
  {
    id: "coinbase-2022-06",
    companyId: "coinbase",
    date: "2022-06-14",
    employeesAffected: 1100,
    percentOfWorkforce: 18,
    reason: "Crypto winter, need to manage costs through downturn",
    type: "layoff",
    source: "Coinbase cuts 18% of workforce as crypto winter hits — CNBC",
    sourceUrl: "https://www.cnbc.com/2022/06/14/coinbase-lays-off-18percent-of-workforce-as-execs-brace-for-crypto-winter.html",
  },
  {
    id: "coinbase-2023-01",
    companyId: "coinbase",
    date: "2023-01-10",
    employeesAffected: 950,
    percentOfWorkforce: 20,
    reason: "Second round amid prolonged crypto downturn and FTX fallout",
    type: "layoff",
    source: "Coinbase to lay off another 20% of staff — Reuters",
    sourceUrl: "https://www.reuters.com/technology/coinbase-lay-off-about-20-workforce-2023-01-10/",
  },

  // ===== SNAP =====
  {
    id: "snap-2022-08",
    companyId: "snap",
    date: "2022-08-31",
    employeesAffected: 1200,
    percentOfWorkforce: 20,
    reason: "Revenue slowdown, restructuring around core products",
    type: "layoff",
    source: "Snap to lay off 20% of employees — The Verge",
    sourceUrl: "https://www.theverge.com/2022/8/31/23329610/snap-layoffs-20-percent-restructuring",
  },

  // ===== LYFT =====
  {
    id: "lyft-2022-11",
    companyId: "lyft",
    date: "2022-11-03",
    employeesAffected: 700,
    percentOfWorkforce: 13,
    reason: "Rising costs, economic uncertainty in rideshare market",
    type: "layoff",
    source: "Lyft to lay off 13% of workforce — CNN",
    sourceUrl: "https://www.cnn.com/2022/11/03/tech/lyft-layoffs/index.html",
  },
  {
    id: "lyft-2023-04",
    companyId: "lyft",
    date: "2023-04-27",
    employeesAffected: 1072,
    percentOfWorkforce: 26,
    reason: "New CEO David Risher restructuring — deep cuts to compete with Uber",
    type: "layoff",
    source: "Lyft lays off 26% of workforce under new CEO — TechCrunch",
    sourceUrl: "https://techcrunch.com/2023/04/27/lyft-lays-off-more-than-1000-employees/",
  },

  // ===== DISNEY =====
  {
    id: "disney-2023-03",
    companyId: "disney",
    date: "2023-03-27",
    employeesAffected: 7000,
    percentOfWorkforce: 3,
    reason: "CEO Bob Iger restructuring plan to save $5.5B",
    type: "layoff",
    source: "Disney begins laying off 7,000 employees — CNN",
    sourceUrl: "https://www.cnn.com/2023/03/27/media/disney-layoffs-begin/index.html",
  },

  // ===== NIKE =====
  {
    id: "nike-2024-02",
    companyId: "nike",
    date: "2024-02-15",
    employeesAffected: 1600,
    percentOfWorkforce: 2,
    reason: "$2B cost reduction plan amid consumer spending slowdown",
    type: "layoff",
    source: "Nike to lay off 2% of workforce as part of $2B cost-cutting plan — Reuters",
    sourceUrl: "https://www.reuters.com/business/retail-consumer/nike-cut-jobs-part-2-bln-cost-savings-plan-2024-02-15/",
  },

  // ===== RIOT GAMES =====
  {
    id: "riot-2024-01",
    companyId: "riot-games",
    date: "2024-01-22",
    employeesAffected: 530,
    percentOfWorkforce: 11,
    reason: "Game cancellations (Project L delays), refocusing on core titles",
    type: "layoff",
    source: "Riot Games lays off 11% of workforce — The Verge",
    sourceUrl: "https://www.theverge.com/2024/1/22/24047364/riot-games-layoffs-11-percent",
  },

  // ===== DOORDASH =====
  {
    id: "doordash-2022-11",
    companyId: "doordash",
    date: "2022-11-30",
    employeesAffected: 1250,
    percentOfWorkforce: 6,
    reason: "Overhired during pandemic delivery boom",
    type: "layoff",
    source: "DoorDash to lay off 1,250 employees — CNBC",
    sourceUrl: "https://www.cnbc.com/2022/11/30/doordash-to-lay-off-1250-employees.html",
  },

  // ===== ACTIVISION BLIZZARD =====
  {
    id: "activision-2024-01",
    companyId: "activision",
    date: "2024-01-25",
    employeesAffected: 1900,
    percentOfWorkforce: 8,
    reason: "Post-Microsoft acquisition restructuring",
    type: "restructuring",
    source: "Microsoft lays off 1,900 Activision Blizzard employees — Kotaku",
    sourceUrl: "https://kotaku.com/microsoft-activision-layoffs-blizzard-xbox-1851194게임-1851194782",
  },

  // ===== BOEING =====
  {
    id: "boeing-2024-11",
    companyId: "boeing",
    date: "2024-11-01",
    employeesAffected: 17000,
    percentOfWorkforce: 10,
    reason: "737 MAX production issues, machinist strike, financial losses",
    type: "layoff",
    source: "Boeing to cut 17,000 jobs as losses mount — BBC",
    sourceUrl: "https://www.bbc.com/news/articles/czxrxr9q0q5o",
  },

  // ===== WELLS FARGO =====
  {
    id: "wellsfargo-2023-q1",
    companyId: "wells-fargo",
    date: "2023-03-15",
    employeesAffected: 5000,
    percentOfWorkforce: 2,
    reason: "Ongoing restructuring after fake accounts scandal consent orders",
    type: "layoff",
    source: "Wells Fargo continues restructuring with thousands of additional layoffs — Reuters",
    sourceUrl: "https://www.reuters.com/business/finance/wells-fargo-lays-off-more-workers-part-ongoing-restructuring-2023-03-15/",
  },

  // ===== OPENAI =====
  {
    id: "openai-2023-11",
    companyId: "openai",
    date: "2023-11-17",
    employeesAffected: 0,
    percentOfWorkforce: 0,
    reason: "Board crisis — CEO Sam Altman fired then rehired within 5 days. Not a layoff but 700+ employees threatened to resign.",
    type: "restructuring",
    source: "OpenAI staff threaten mass resignation unless board resigns — The Verge",
    sourceUrl: "https://www.theverge.com/2023/11/20/23969586/openai-staff-letter-board-resign-sam-altman",
  },

  // ===== TIKTOK =====
  {
    id: "tiktok-2024-q1",
    companyId: "tiktok",
    date: "2024-01-20",
    employeesAffected: 60,
    percentOfWorkforce: 0.9,
    reason: "US operations restructuring amid divestiture/ban legislation",
    type: "layoff",
    source: "TikTok lays off workers as ban legislation advances — Bloomberg",
    sourceUrl: "https://www.bloomberg.com/news/articles/2024-01-20/tiktok-lays-off-workers-as-us-ban-legislation-advances",
  },

  // ===== UBER =====
  {
    id: "uber-2020-05",
    companyId: "uber",
    date: "2020-05-06",
    employeesAffected: 6700,
    percentOfWorkforce: 25,
    reason: "COVID-19 pandemic collapse in ridership",
    type: "layoff",
    source: "Uber to cut 3,700 employees, about 14% of workforce — NY Times",
    sourceUrl: "https://www.nytimes.com/2020/05/06/technology/uber-layoffs-coronavirus.html",
  },

  // ===== GOLDMAN SACHS =====
  {
    id: "goldman-2023-01",
    companyId: "goldman",
    date: "2023-01-11",
    employeesAffected: 3200,
    percentOfWorkforce: 6.5,
    reason: "Consumer banking retreat, dealmaking slowdown",
    type: "layoff",
    source: "Goldman Sachs begins laying off 3,200 employees — CNBC",
    sourceUrl: "https://www.cnbc.com/2023/01/11/goldman-sachs-begins-laying-off-thousands-of-employees.html",
  },

  // ===== WALMART =====
  {
    id: "walmart-2024-02",
    companyId: "walmart",
    date: "2024-02-13",
    employeesAffected: 2000,
    percentOfWorkforce: 0.1,
    reason: "E-commerce fulfillment center consolidation",
    type: "layoff",
    source: "Walmart to lay off hundreds at e-commerce warehouses — WSJ",
    sourceUrl: "https://www.wsj.com/articles/walmart-to-lay-off-hundreds-at-five-e-commerce-fulfillment-centers-46824b8a",
  },

  // ===== PALANTIR =====
  // No major layoffs — Palantir has been on a growth trajectory

  // ===== NVIDIA =====
  // No major layoffs — Nvidia has been on massive growth trajectory

  // ===== APPLE =====
  // Apple has not done significant public layoffs — one of the few big tech to avoid it
];

export function getLayoffsByCompany(companyId: string): LayoffEvent[] {
  return layoffEvents
    .filter((e) => e.companyId === companyId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getLayoffSummary(companyId: string): {
  totalAffected: number;
  eventCount: number;
  mostRecent: LayoffEvent | null;
  totalPctCut: number;
} {
  const events = getLayoffsByCompany(companyId);
  const totalAffected = events.reduce((sum, e) => sum + e.employeesAffected, 0);
  const totalPctCut = events.reduce((sum, e) => sum + e.percentOfWorkforce, 0);
  return {
    totalAffected,
    eventCount: events.length,
    mostRecent: events[0] ?? null,
    totalPctCut,
  };
}

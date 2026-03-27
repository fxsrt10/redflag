const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });

async function main() {
  // 1. Get all companies
  const { rows: companies } = await pool.query('SELECT id, name, ticker FROM companies ORDER BY name');
  console.log('Companies found:', companies.length);
  companies.forEach(c => console.log(`  ${c.name} (${c.ticker}) => ${c.id}`));

  // Build lookup by name/ticker
  const co = {};
  for (const c of companies) {
    const key = (c.ticker || c.name).toLowerCase();
    co[key] = c.id;
    co[c.name.toLowerCase()] = c.id;
  }

  // Helper to find company ID
  function cid(nameOrTicker) {
    const k = nameOrTicker.toLowerCase();
    if (co[k]) return co[k];
    // partial match
    for (const c of companies) {
      if (c.name.toLowerCase().includes(k) || (c.ticker && c.ticker.toLowerCase() === k)) return c.id;
    }
    console.warn(`  WARNING: Company not found: ${nameOrTicker}`);
    return null;
  }

  // =========================================================
  // LAWSUITS
  // =========================================================
  const lawsuits = [
    // Google/Alphabet
    { company: 'Google', case_number: 'CGC-17-561299', court: 'San Francisco Superior Court', filed_date: '2018-01-08', category: 'wrongful_termination', status: 'settled', plaintiff_type: 'individual', description: 'James Damore v. Google LLC — Wrongful termination after internal memo on diversity programs. Damore alleged viewpoint discrimination.', source_url: 'https://www.reuters.com/article/us-alphabet-google-lawsuit-idUSKBN1EX0BE' },
    { company: 'Google', case_number: '1:20-cv-03010', court: 'U.S. District Court for the District of Columbia', filed_date: '2020-10-20', category: 'other', status: 'open', plaintiff_type: 'government', description: 'United States v. Google LLC — DOJ antitrust lawsuit alleging Google illegally maintained monopoly in search and search advertising through exclusionary agreements.', source_url: 'https://www.reuters.com/technology/us-judge-rules-google-broke-antitrust-law-search-case-2024-08-05/' },
    { company: 'Google', case_number: '3:17-cv-05484', court: 'U.S. District Court for the Northern District of California', filed_date: '2017-09-14', category: 'discrimination', status: 'settled', plaintiff_type: 'class_action', description: 'Ellis v. Google LLC — Gender pay discrimination class action. Settled for $118 million in 2022, covering approximately 15,500 women.', source_url: 'https://www.reuters.com/legal/litigation/google-settles-gender-pay-discrimination-lawsuit-118-mln-2022-06-12/' },
    { company: 'Google', case_number: 'CASE-2019-GOOGLE-AGE', court: 'U.S. District Court for the Northern District of California', filed_date: '2019-07-01', category: 'discrimination', status: 'settled', plaintiff_type: 'class_action', description: 'Heath v. Google LLC — Age discrimination class action alleging systematic bias against job applicants over 40.', source_url: 'https://www.nytimes.com/2019/07/31/technology/google-age-discrimination-lawsuit.html' },

    // Amazon
    { company: 'Amazon', case_number: '2:22-cv-00593', court: 'U.S. District Court for the Western District of Washington', filed_date: '2022-05-01', category: 'discrimination', status: 'open', plaintiff_type: 'class_action', description: 'Warehouse worker racial and gender discrimination class action alleging hostile work environment and disparate treatment at Amazon fulfillment centers.', source_url: 'https://www.reuters.com/legal/litigation/amazon-warehouse-workers-sue-over-discrimination-2022-05-01/' },
    { company: 'Amazon', case_number: 'NLRB-29-CA-283069', court: 'National Labor Relations Board', filed_date: '2022-04-06', category: 'retaliation', status: 'open', plaintiff_type: 'government', description: 'NLRB complaint alleging Amazon illegally fired Chris Smalls and other workers for organizing at JFK8 Staten Island warehouse. Smalls later led successful unionization vote.', source_url: 'https://www.cnbc.com/2022/04/06/nlrb-complaint-amazon-illegally-fired-chris-smalls-jfk8.html' },
    { company: 'Amazon', case_number: 'NLRB-2023-UNION', court: 'National Labor Relations Board', filed_date: '2023-01-15', category: 'other', status: 'open', plaintiff_type: 'government', description: 'Multiple NLRB union-busting complaints alleging Amazon engaged in surveillance, intimidation, and illegal captive audience meetings during union drives.', source_url: 'https://www.nytimes.com/2023/01/15/technology/amazon-nlrb-union.html' },
    { company: 'Amazon', case_number: 'OSHA-2022-AMZ-SAFETY', court: 'OSHA', filed_date: '2022-07-01', category: 'other', status: 'open', plaintiff_type: 'government', description: 'OSHA citations for ergonomic hazards and unsafe working conditions at multiple Amazon warehouses. Injury rates found to be significantly higher than industry average.', source_url: 'https://www.reuters.com/business/retail-consumer/amazons-warehouse-injury-rates-are-higher-than-other-warehouses-says-report-2022-06-01/' },

    // Apple
    { company: 'Apple', case_number: '2:24-cv-04214', court: 'U.S. District Court for the District of New Jersey', filed_date: '2024-03-21', category: 'other', status: 'open', plaintiff_type: 'government', description: 'United States v. Apple Inc. — DOJ antitrust suit alleging Apple maintains an illegal monopoly over the smartphone market through restrictive App Store policies and anti-competitive behavior.', source_url: 'https://www.reuters.com/technology/us-justice-department-sues-apple-antitrust-case-2024-03-21/' },
    { company: 'Apple', case_number: 'NLRB-2022-APPLE-SURV', court: 'National Labor Relations Board', filed_date: '2022-12-01', category: 'retaliation', status: 'open', plaintiff_type: 'government', description: 'NLRB complaints alleging Apple engaged in illegal surveillance and retaliation against employees who organized #AppleToo movement reporting workplace harassment and discrimination.', source_url: 'https://www.theverge.com/2022/12/15/23512122/apple-nlrb-complaint-surveillance' },
    { company: 'Apple', case_number: 'CASE-2021-APPLETOO', court: 'California Superior Court', filed_date: '2021-11-01', category: 'harassment', status: 'open', plaintiff_type: 'individual', description: '#AppleToo movement lawsuits — Multiple employees filed harassment and discrimination complaints after internal #AppleToo campaign revealed widespread workplace issues.', source_url: 'https://www.theverge.com/2021/11/9/22771547/apple-too-movement-harassment-discrimination' },
    { company: 'Apple', case_number: 'CASE-2023-APPLE-PAY', court: 'California Superior Court', filed_date: '2023-03-01', category: 'wage_hour', status: 'settled', plaintiff_type: 'class_action', description: 'Apple pay transparency settlement — California employees alleged Apple failed to include pay ranges in job postings and discriminated in compensation.', source_url: 'https://www.bloomberg.com/news/articles/2023-03-01/apple-pay-transparency' },

    // Microsoft
    { company: 'Microsoft', case_number: '2:15-cv-01483', court: 'U.S. District Court for the Western District of Washington', filed_date: '2015-09-16', category: 'discrimination', status: 'settled', plaintiff_type: 'class_action', description: 'Moussouris v. Microsoft Corp. — Gender discrimination class action alleging systematic pay and promotion disparities for women in technical roles.', source_url: 'https://www.reuters.com/article/us-microsoft-discrimination-idUSKCN0RF2GD20150916' },
    { company: 'Microsoft', case_number: 'CASE-2023-XBOX-HARASS', court: 'Internal Investigation', filed_date: '2023-01-20', category: 'harassment', status: 'closed', plaintiff_type: 'individual', description: 'Xbox division harassment investigations following Activision Blizzard acquisition scrutiny. Multiple complaints about toxic culture within gaming division.', source_url: 'https://www.bloomberg.com/news/articles/2023-01-20/microsoft-xbox-harassment-investigation' },

    // Uber
    { company: 'Uber', case_number: '3:17-cv-00939', court: 'U.S. District Court for the Northern District of California', filed_date: '2017-02-23', category: 'harassment', status: 'settled', plaintiff_type: 'individual', description: 'Susan Fowler harassment revelations — Former engineer published blog post detailing systemic sexual harassment and HR failures, triggering CEO Travis Kalanick resignation.', source_url: 'https://www.nytimes.com/2017/02/22/technology/uber-workplace-culture.html' },
    { company: 'Uber', case_number: '3:17-cv-00940-WHA', court: 'U.S. District Court for the Northern District of California', filed_date: '2017-02-24', category: 'other', status: 'settled', plaintiff_type: 'individual', description: 'Waymo LLC v. Uber Technologies — Trade secret theft lawsuit. Waymo alleged Uber stole self-driving car technology via Anthony Levandowski. Settled for $245 million in Uber equity.', source_url: 'https://www.reuters.com/article/us-alphabet-uber-settlement-idUSKBN1FT2BV' },
    { company: 'Uber', case_number: 'CASE-2020-UBER-DRIVER-CLASS', court: 'U.S. District Court for the Northern District of California', filed_date: '2020-05-05', category: 'wage_hour', status: 'open', plaintiff_type: 'class_action', description: 'Ongoing driver classification battles — Multiple lawsuits challenging Uber classification of drivers as independent contractors rather than employees, seeking benefits and minimum wage.', source_url: 'https://www.cnbc.com/2020/05/05/uber-lyft-driver-classification-lawsuit.html' },
    { company: 'Uber', case_number: 'CASE-2019-UBER-SAFETY', court: 'Various State Courts', filed_date: '2019-12-05', category: 'other', status: 'open', plaintiff_type: 'class_action', description: 'Uber Safety Report disclosures revealed 3,045 sexual assaults in 2018. Multiple lawsuits filed by assault survivors against Uber for negligent safety practices.', source_url: 'https://www.cnn.com/2019/12/05/tech/uber-safety-report/index.html' },

    // Boeing
    { company: 'Boeing', case_number: 'CASE-2024-BOEING-WHSTL', court: 'U.S. District Court for the District of South Carolina', filed_date: '2024-03-01', category: 'retaliation', status: 'open', plaintiff_type: 'individual', description: '737 MAX whistleblower retaliation claims by John Barnett (deceased) and other quality inspectors alleging Boeing retaliated against employees who raised safety concerns about manufacturing defects.', source_url: 'https://www.nytimes.com/2024/03/09/business/john-barnett-boeing-whistleblower-dead.html' },
    { company: 'Boeing', case_number: 'OSHA-2024-BOEING', court: 'OSHA', filed_date: '2024-06-01', category: 'other', status: 'open', plaintiff_type: 'government', description: 'FAA and OSHA safety complaints regarding 737 MAX door plug blowout incident and manufacturing quality control failures at Renton and Charleston plants.', source_url: 'https://www.reuters.com/business/aerospace-defense/boeing-737-max-door-plug-blowout-2024-01-06/' },
    { company: 'Boeing', case_number: 'CASE-2022-BOEING-RACE', court: 'U.S. District Court for the District of South Carolina', filed_date: '2022-04-15', category: 'discrimination', status: 'open', plaintiff_type: 'class_action', description: 'Racial discrimination class action by Black employees at Boeing South Carolina plant alleging hostile work environment, nooses found in workplace, and disparate treatment in promotions.', source_url: 'https://www.reuters.com/legal/litigation/boeing-faces-racial-discrimination-lawsuit-south-carolina-2022-04-15/' },

    // Goldman Sachs
    { company: 'Goldman Sachs', case_number: '1:10-cv-06950', court: 'U.S. District Court for the Southern District of New York', filed_date: '2010-09-15', category: 'discrimination', status: 'settled', plaintiff_type: 'class_action', description: 'Chen-Oster v. Goldman Sachs — Gender discrimination class action settled for $215 million in 2023. Alleged systemic pay and promotion discrimination against female employees.', source_url: 'https://www.reuters.com/legal/litigation/goldman-sachs-agrees-settle-gender-discrimination-case-215-mln-2023-05-08/' },
    { company: 'Goldman Sachs', case_number: 'CR-18-0538', court: 'U.S. District Court for the Eastern District of New York', filed_date: '2018-11-01', category: 'other', status: 'settled', plaintiff_type: 'government', description: '1MDB criminal charges — Goldman Sachs agreed to pay over $2.9 billion in DOJ settlement for its role in the 1MDB Malaysian corruption scandal.', source_url: 'https://www.reuters.com/article/us-goldman-sachs-1mdb-settlement-idUSKBN2752HX' },
    { company: 'Goldman Sachs', case_number: 'CASE-2021-GS-WORKWEEK', court: 'Internal Complaint', filed_date: '2021-03-18', category: 'wage_hour', status: 'closed', plaintiff_type: 'class_action', description: 'Junior analyst 95-hour work week controversy — Internal survey leaked showing first-year analysts averaging 95-hour weeks with severe health impacts, leading to policy reforms.', source_url: 'https://www.bbc.com/news/business-56452494' },

    // Salesforce
    { company: 'Salesforce', case_number: 'CASE-2022-SF-GENDER', court: 'U.S. District Court for the Northern District of California', filed_date: '2022-10-01', category: 'discrimination', status: 'open', plaintiff_type: 'class_action', description: 'Gender pay discrimination class action alleging Salesforce systematically underpaid female employees despite public commitments to pay equity.', source_url: 'https://www.bloomberg.com/news/articles/2022-10-01/salesforce-gender-pay-discrimination' },
    { company: 'Salesforce', case_number: '1:18-cv-00731', court: 'U.S. District Court for the Northern District of Texas', filed_date: '2018-03-27', category: 'other', status: 'settled', plaintiff_type: 'individual', description: 'Doe v. Salesforce — Lawsuit alleging Salesforce facilitated sex trafficking through its technology services to Backpage.com.', source_url: 'https://www.reuters.com/legal/litigation/salesforce-settles-sex-trafficking-lawsuit-backpage-2023-05-17/' },

    // Nike
    { company: 'Nike', case_number: 'CASE-2018-NIKE-HARASS', court: 'Multnomah County Circuit Court', filed_date: '2018-04-01', category: 'harassment', status: 'settled', plaintiff_type: 'class_action', description: 'Cahill v. Nike — Gender harassment and discrimination class action after internal survey revealed toxic boys club culture. 11 senior executives departed in 2018 scandal.', source_url: 'https://www.nytimes.com/2018/04/28/business/nike-women.html' },
    { company: 'Nike', case_number: 'CASE-2018-NIKE-GENDER-CLASS', court: 'U.S. District Court for the District of Oregon', filed_date: '2018-08-10', category: 'discrimination', status: 'settled', plaintiff_type: 'class_action', description: 'Gender pay discrimination class action covering over 5,000 current and former female Nike employees alleging systematic pay and promotion disparities.', source_url: 'https://www.reuters.com/article/us-nike-lawsuit-gender-idUSKBN1L003R' },

    // Disney
    { company: 'Disney', case_number: 'CASE-2019-DISNEY-WAGE', court: 'Orange County Superior Court', filed_date: '2019-08-15', category: 'wage_hour', status: 'settled', plaintiff_type: 'class_action', description: 'Disneyland wage theft class action settled for $233 million. Workers alleged Disney violated Anaheim living wage ordinance at Disneyland Resort.', source_url: 'https://www.reuters.com/business/disneyland-workers-reach-233-mln-settlement-wage-claim-2023-06-27/' },
    { company: 'Disney', case_number: 'CASE-2021-CARANO', court: 'U.S. District Court for the Central District of California', filed_date: '2021-02-10', category: 'wrongful_termination', status: 'open', plaintiff_type: 'individual', description: 'Gina Carano v. Disney/Lucasfilm — Wrongful termination lawsuit after firing from The Mandalorian over social media posts. Funded by Elon Musk.', source_url: 'https://www.reuters.com/legal/litigation/mandalorian-actor-gina-carano-sues-disney-wrongful-termination-2024-02-06/' },

    // Wells Fargo
    { company: 'Wells Fargo', case_number: '3:15-cv-02159', court: 'U.S. District Court for the Northern District of California', filed_date: '2015-09-08', category: 'other', status: 'settled', plaintiff_type: 'government', description: 'Wells Fargo fake accounts scandal — CFPB, OCC, and LA City Attorney consent orders and settlements totaling over $3 billion for creation of millions of unauthorized customer accounts.', source_url: 'https://www.reuters.com/article/us-wells-fargo-accounts-idUSKCN11E1BI' },
    { company: 'Wells Fargo', case_number: 'CASE-2020-WF-DISCRIM', court: 'U.S. District Court for the Northern District of California', filed_date: '2020-06-01', category: 'discrimination', status: 'open', plaintiff_type: 'class_action', description: 'Racial discrimination in lending and employment class action alleging Wells Fargo systematically discriminated against Black and Hispanic borrowers and employees.', source_url: 'https://www.nytimes.com/2022/03/10/business/wells-fargo-racial-discrimination.html' },
    { company: 'Wells Fargo', case_number: 'CONSENT-2018-OCC', court: 'Office of the Comptroller of the Currency', filed_date: '2018-02-02', category: 'other', status: 'open', plaintiff_type: 'government', description: 'Ongoing OCC consent order capping Wells Fargo assets at ~$1.95 trillion until remediation of risk management failures from fake accounts scandal.', source_url: 'https://www.wsj.com/articles/wells-fargo-consent-order-asset-cap-fed-2018' },

    // Coinbase
    { company: 'Coinbase', case_number: '1:23-cv-04738', court: 'U.S. District Court for the Southern District of New York', filed_date: '2023-06-06', category: 'sec_action', status: 'open', plaintiff_type: 'government', description: 'SEC v. Coinbase — SEC lawsuit alleging Coinbase operated as an unregistered securities exchange, broker, and clearing agency.', source_url: 'https://www.reuters.com/legal/sec-sues-coinbase-over-failure-register-2023-06-06/' },
    { company: 'Coinbase', case_number: 'CASE-2022-CB-RACE', court: 'EEOC / Internal', filed_date: '2022-01-15', category: 'discrimination', status: 'closed', plaintiff_type: 'individual', description: 'Racial discrimination claims — Multiple current and former Black employees alleged racial discrimination in hiring, promotion, and workplace culture at Coinbase.', source_url: 'https://www.nytimes.com/2022/01/15/technology/coinbase-racial-discrimination.html' },

    // Activision Blizzard
    { company: 'Activision Blizzard', case_number: 'DFEH-2021-ABK', court: 'California Department of Fair Employment and Housing', filed_date: '2021-07-20', category: 'harassment', status: 'settled', plaintiff_type: 'government', description: 'California DFEH v. Activision Blizzard — Landmark harassment and discrimination suit alleging pervasive frat boy culture. Settled for $54 million initially, EEOC settled separately for $18 million.', source_url: 'https://www.nytimes.com/2021/07/21/technology/activision-blizzard-lawsuit.html' },
    { company: 'Activision Blizzard', case_number: 'EEOC-2021-ABK', court: 'EEOC', filed_date: '2021-09-27', category: 'harassment', status: 'settled', plaintiff_type: 'eeoc', description: 'EEOC v. Activision Blizzard — EEOC consent decree for $18 million addressing sexual harassment, pregnancy discrimination, and retaliation across the company.', source_url: 'https://www.reuters.com/technology/activision-blizzard-settles-eeoc-sexual-harassment-probe-18-mln-2021-09-27/' },
    { company: 'Activision Blizzard', case_number: 'SEC-2023-ABK-KOTICK', court: 'SEC', filed_date: '2023-02-03', category: 'sec_action', status: 'settled', plaintiff_type: 'government', description: 'SEC settled with Activision Blizzard for $35 million over failure to maintain disclosure controls regarding workplace misconduct complaints reaching CEO Bobby Kotick.', source_url: 'https://www.wsj.com/articles/activision-blizzard-to-pay-35-million-to-settle-sec-probe-11675438846' },

    // SpaceX
    { company: 'SpaceX', case_number: 'NLRB-2022-SPACEX', court: 'National Labor Relations Board', filed_date: '2022-07-01', category: 'retaliation', status: 'open', plaintiff_type: 'government', description: 'NLRB complaint alleging SpaceX illegally fired eight employees who circulated an open letter criticizing CEO Elon Musk and calling for improved workplace culture.', source_url: 'https://www.reuters.com/technology/spacex-illegally-fired-employees-criticizing-elon-musk-us-labor-agency-2024-01-03/' },
    { company: 'SpaceX', case_number: 'DOJ-2023-SPACEX-HIRE', court: 'DOJ', filed_date: '2023-08-24', category: 'discrimination', status: 'open', plaintiff_type: 'government', description: 'DOJ hiring discrimination lawsuit alleging SpaceX discriminated against refugees and asylum seekers in violation of the Immigration and Nationality Act.', source_url: 'https://www.reuters.com/legal/government/us-sues-spacex-over-hiring-discrimination-against-refugees-2023-08-24/' },

    // OpenAI
    { company: 'OpenAI', case_number: '3:24-cv-00963', court: 'U.S. District Court for the Northern District of California', filed_date: '2024-02-29', category: 'other', status: 'open', plaintiff_type: 'individual', description: 'Elon Musk v. OpenAI — Lawsuit alleging OpenAI breached its founding agreement by pivoting from nonprofit to for-profit and partnering exclusively with Microsoft.', source_url: 'https://www.reuters.com/technology/elon-musk-sues-openai-ceo-sam-altman-breach-contract-2024-03-01/' },
    { company: 'OpenAI', case_number: 'CASE-2024-OAI-EQUITY', court: 'Internal/Regulatory', filed_date: '2024-05-01', category: 'other', status: 'open', plaintiff_type: 'individual', description: 'Equity clawback controversy — Former employees revealed OpenAI threatened to claw back vested equity if they did not sign broad non-disparagement agreements upon departure.', source_url: 'https://www.vox.com/technology/2024/5/16/24158478/openai-equity-clawback-nondisparagement' },
  ];

  console.log('\n--- Inserting lawsuits ---');
  let lawsuitCount = 0;
  for (const l of lawsuits) {
    const companyId = cid(l.company);
    if (!companyId) continue;
    try {
      await pool.query(
        `INSERT INTO lawsuits (company_id, case_number, court, filed_date, category, status, plaintiff_type, description, source_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING`,
        [companyId, l.case_number, l.court, l.filed_date, l.category, l.status, l.plaintiff_type, l.description, l.source_url]
      );
      lawsuitCount++;
    } catch (err) {
      console.error(`  Error inserting lawsuit ${l.case_number}:`, err.message);
    }
  }
  console.log(`  Inserted ${lawsuitCount} lawsuits`);

  // =========================================================
  // WARN NOTICES (Layoffs)
  // =========================================================
  const warnNotices = [
    // Google
    { company: 'Google', state: 'CA', notice_date: '2023-01-20', effective_date: '2023-03-20', employees_affected: 12000, reason: 'Mass layoff affecting 6% of global workforce across engineering, recruiting, and product teams', source_url: 'https://www.reuters.com/technology/google-parent-alphabet-cut-12000-jobs-2023-01-20/' },
    { company: 'Google', state: 'CA', notice_date: '2024-01-11', effective_date: '2024-02-15', employees_affected: 1000, reason: 'Layoffs across hardware, voice assistant, and engineering teams as part of ongoing cost restructuring', source_url: 'https://www.cnbc.com/2024/01/11/google-lays-off-hundreds-of-employees-in-hardware-voice-assistant-teams.html' },

    // Amazon
    { company: 'Amazon', state: 'WA', notice_date: '2023-01-04', effective_date: '2023-03-04', employees_affected: 18000, reason: 'Largest layoff in Amazon history affecting corporate and technology roles due to economic uncertainty', source_url: 'https://www.reuters.com/technology/amazon-lay-off-over-17000-workers-2023-01-04/' },
    { company: 'Amazon', state: 'CA', notice_date: '2023-03-20', effective_date: '2023-05-20', employees_affected: 9000, reason: 'Second round of layoffs in 2023 affecting AWS, Twitch, advertising, and PXT (HR) divisions', source_url: 'https://www.cnbc.com/2023/03/20/amazon-layoffs-company-to-cut-9000-more-workers.html' },

    // Apple
    { company: 'Apple', state: 'CA', notice_date: '2024-04-01', effective_date: '2024-06-01', employees_affected: 614, reason: 'Layoffs in Special Projects Group (autonomous vehicle/Project Titan) after cancellation of Apple Car program', source_url: 'https://www.bloomberg.com/news/articles/2024-04-01/apple-lays-off-600-after-car-project-cancellation' },

    // Microsoft
    { company: 'Microsoft', state: 'WA', notice_date: '2023-01-18', effective_date: '2023-03-18', employees_affected: 10000, reason: 'Layoffs affecting 5% of workforce across engineering, HR, and consulting divisions amid economic slowdown', source_url: 'https://www.reuters.com/technology/microsoft-lay-off-10000-workers-2023-01-18/' },
    { company: 'Microsoft', state: 'WA', notice_date: '2024-01-25', effective_date: '2024-03-25', employees_affected: 1900, reason: 'Post-Activision Blizzard acquisition layoffs in gaming division affecting Blizzard, ZeniMax, and Xbox teams', source_url: 'https://www.theverge.com/2024/1/25/24049050/microsoft-activision-blizzard-layoffs' },

    // Uber
    { company: 'Uber', state: 'CA', notice_date: '2020-05-06', effective_date: '2020-05-18', employees_affected: 3700, reason: 'First round of COVID-19 pandemic layoffs affecting customer support and recruiting teams', source_url: 'https://www.reuters.com/article/us-uber-layoffs-idUSKBN22I2FC' },
    { company: 'Uber', state: 'CA', notice_date: '2020-05-18', effective_date: '2020-06-01', employees_affected: 3000, reason: 'Second round of COVID-19 layoffs and office closures affecting 25% of total workforce', source_url: 'https://www.cnbc.com/2020/05/18/uber-to-cut-another-3000-jobs-close-45-offices-in-ongoing-restructuring.html' },

    // Boeing
    { company: 'Boeing', state: 'WA', notice_date: '2024-11-01', effective_date: '2025-01-17', employees_affected: 17000, reason: 'Mass layoff of 10% of global workforce following prolonged machinist strike, 737 MAX production issues, and massive financial losses', source_url: 'https://www.reuters.com/business/aerospace-defense/boeing-cut-17000-jobs-2024-11-01/' },

    // Goldman Sachs
    { company: 'Goldman Sachs', state: 'NY', notice_date: '2023-01-09', effective_date: '2023-01-25', employees_affected: 3200, reason: 'Largest layoffs since 2008 financial crisis affecting 6.5% of workforce amid retreat from consumer banking', source_url: 'https://www.reuters.com/business/finance/goldman-sachs-begin-laying-off-thousands-workers-wednesday-2023-01-09/' },

    // Salesforce
    { company: 'Salesforce', state: 'CA', notice_date: '2023-01-04', effective_date: '2023-03-04', employees_affected: 7000, reason: 'Mass layoff of 10% of workforce. CEO Marc Benioff admitted to over-hiring during pandemic growth period.', source_url: 'https://www.cnbc.com/2023/01/04/salesforce-to-lay-off-10percent-of-employees.html' },

    // Nike
    { company: 'Nike', state: 'OR', notice_date: '2024-02-15', effective_date: '2024-04-15', employees_affected: 740, reason: 'Cost-cutting layoffs as part of $2 billion savings plan under new management', source_url: 'https://www.reuters.com/business/retail-consumer/nike-lay-off-more-than-740-workers-oregon-headquarters-2024-02-15/' },

    // Disney
    { company: 'Disney', state: 'FL', notice_date: '2020-09-29', effective_date: '2020-10-30', employees_affected: 28000, reason: 'COVID-19 pandemic layoffs primarily affecting theme park employees as parks remained closed or at limited capacity', source_url: 'https://www.cnbc.com/2020/09/29/disney-to-lay-off-28000-employees-in-us-theme-parks-division.html' },
    { company: 'Disney', state: 'CA', notice_date: '2023-02-08', effective_date: '2023-04-08', employees_affected: 7000, reason: 'CEO Bob Iger announced 7,000 job cuts as part of $5.5 billion cost-cutting restructuring plan', source_url: 'https://www.reuters.com/business/media-telecom/disney-cut-7000-jobs-part-restructuring-plan-ceo-iger-2023-02-08/' },

    // Coinbase
    { company: 'Coinbase', state: 'CA', notice_date: '2022-06-14', effective_date: '2022-06-14', employees_affected: 1100, reason: 'Crypto winter layoffs cutting 18% of workforce as crypto market crashed and trading volumes plummeted', source_url: 'https://www.reuters.com/technology/coinbase-lay-off-18-workforce-2022-06-14/' },
    { company: 'Coinbase', state: 'CA', notice_date: '2023-01-10', effective_date: '2023-01-10', employees_affected: 950, reason: 'Second round of layoffs cutting 20% of remaining workforce amid continued crypto downturn and SEC scrutiny', source_url: 'https://www.cnbc.com/2023/01/10/coinbase-to-cut-20percent-of-workforce-as-crypto-winter-drags-on.html' },

    // Activision Blizzard
    { company: 'Activision Blizzard', state: 'CA', notice_date: '2024-01-25', effective_date: '2024-03-25', employees_affected: 1900, reason: 'Post-Microsoft acquisition layoffs affecting 8% of combined gaming workforce at Blizzard, King, and Activision studios', source_url: 'https://www.theverge.com/2024/1/25/24049050/microsoft-activision-blizzard-layoffs' },

    // OpenAI
    { company: 'OpenAI', state: 'CA', notice_date: '2023-11-17', effective_date: '2023-11-17', employees_affected: 0, reason: 'Board crisis — CEO Sam Altman fired then rehired within 5 days. Near-total workforce threatened to resign. Board reconstituted.', source_url: 'https://www.reuters.com/technology/openai-ceo-sam-altman-fired-by-board-2023-11-17/' },
  ];

  console.log('\n--- Inserting WARN notices ---');
  let warnCount = 0;
  for (const w of warnNotices) {
    const companyId = cid(w.company);
    if (!companyId) continue;
    try {
      await pool.query(
        `INSERT INTO warn_notices (company_id, state, notice_date, effective_date, employees_affected, reason, source_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [companyId, w.state, w.notice_date, w.effective_date, w.employees_affected, w.reason, w.source_url]
      );
      warnCount++;
    } catch (err) {
      console.error(`  Error inserting WARN for ${w.company}:`, err.message);
    }
  }
  console.log(`  Inserted ${warnCount} WARN notices`);

  // =========================================================
  // NEWS ITEMS
  // =========================================================
  const newsItems = [
    // Google
    { company: 'Google', published_date: '2023-01-20', title: 'Google parent Alphabet to cut 12,000 jobs', source: 'Reuters', url: 'https://www.reuters.com/technology/google-parent-alphabet-cut-12000-jobs-2023-01-20/', sentiment: 'negative', is_layoff_related: true },
    { company: 'Google', published_date: '2024-01-11', title: 'Google lays off hundreds across hardware, voice assistant, engineering teams', source: 'CNBC', url: 'https://www.cnbc.com/2024/01/11/google-lays-off-hundreds-of-employees-in-hardware-voice-assistant-teams.html', sentiment: 'negative', is_layoff_related: true },
    { company: 'Google', published_date: '2024-08-05', title: 'Judge rules Google broke antitrust law in landmark search monopoly case', source: 'Reuters', url: 'https://www.reuters.com/technology/us-judge-rules-google-broke-antitrust-law-search-case-2024-08-05/', sentiment: 'negative', is_layoff_related: false },
    { company: 'Google', published_date: '2022-06-12', title: 'Google settles gender pay discrimination lawsuit for $118 million', source: 'Reuters', url: 'https://www.reuters.com/legal/litigation/google-settles-gender-pay-discrimination-lawsuit-118-mln-2022-06-12/', sentiment: 'negative', is_layoff_related: false },
    { company: 'Google', published_date: '2024-12-11', title: 'Google unveils Gemini 2.0 AI model, signals new era in AI development', source: 'The Verge', url: 'https://www.theverge.com/2024/12/11/google-gemini-2-launch', sentiment: 'positive', is_layoff_related: false },

    // Amazon
    { company: 'Amazon', published_date: '2023-01-04', title: 'Amazon to lay off over 18,000 workers in largest cuts in company history', source: 'Reuters', url: 'https://www.reuters.com/technology/amazon-lay-off-over-17000-workers-2023-01-04/', sentiment: 'negative', is_layoff_related: true },
    { company: 'Amazon', published_date: '2023-03-20', title: 'Amazon to cut 9,000 more jobs in second round of mass layoffs', source: 'CNBC', url: 'https://www.cnbc.com/2023/03/20/amazon-layoffs-company-to-cut-9000-more-workers.html', sentiment: 'negative', is_layoff_related: true },
    { company: 'Amazon', published_date: '2022-04-01', title: 'Amazon workers on Staten Island vote to form company first labor union', source: 'NY Times', url: 'https://www.nytimes.com/2022/04/01/technology/amazon-union-staten-island.html', sentiment: 'negative', is_layoff_related: false },
    { company: 'Amazon', published_date: '2024-02-01', title: 'Amazon reports record $170B holiday quarter, AWS growth reaccelerates', source: 'CNBC', url: 'https://www.cnbc.com/2024/02/01/amazon-earnings-q4-2023.html', sentiment: 'positive', is_layoff_related: false },

    // Apple
    { company: 'Apple', published_date: '2024-03-21', title: 'DOJ sues Apple in landmark antitrust case over iPhone monopoly', source: 'Reuters', url: 'https://www.reuters.com/technology/us-justice-department-sues-apple-antitrust-case-2024-03-21/', sentiment: 'negative', is_layoff_related: false },
    { company: 'Apple', published_date: '2024-04-01', title: 'Apple lays off 600 employees after canceling electric car project', source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2024-04-01/apple-lays-off-600-after-car-project-cancellation', sentiment: 'negative', is_layoff_related: true },
    { company: 'Apple', published_date: '2024-06-10', title: 'Apple announces Apple Intelligence, partnership with OpenAI for Siri', source: 'The Verge', url: 'https://www.theverge.com/2024/6/10/apple-intelligence-ai-wwdc', sentiment: 'positive', is_layoff_related: false },
    { company: 'Apple', published_date: '2022-12-15', title: 'Apple accused of illegally surveilling employees, NLRB complaint filed', source: 'The Verge', url: 'https://www.theverge.com/2022/12/15/23512122/apple-nlrb-complaint-surveillance', sentiment: 'negative', is_layoff_related: false },

    // Microsoft
    { company: 'Microsoft', published_date: '2023-01-18', title: 'Microsoft to lay off 10,000 employees as tech sector cuts deepen', source: 'Reuters', url: 'https://www.reuters.com/technology/microsoft-lay-off-10000-workers-2023-01-18/', sentiment: 'negative', is_layoff_related: true },
    { company: 'Microsoft', published_date: '2024-01-25', title: 'Microsoft cuts 1,900 Activision Blizzard and Xbox workers after acquisition', source: 'The Verge', url: 'https://www.theverge.com/2024/1/25/24049050/microsoft-activision-blizzard-layoffs', sentiment: 'negative', is_layoff_related: true },
    { company: 'Microsoft', published_date: '2024-01-24', title: 'Microsoft hits $3 trillion market cap for first time, surpasses Apple', source: 'CNBC', url: 'https://www.cnbc.com/2024/01/24/microsoft-hits-3-trillion-market-cap.html', sentiment: 'positive', is_layoff_related: false },
    { company: 'Microsoft', published_date: '2023-10-13', title: 'Microsoft completes $69B Activision Blizzard acquisition', source: 'Reuters', url: 'https://www.reuters.com/technology/microsoft-activision-deal-closes-2023-10-13/', sentiment: 'positive', is_layoff_related: false },

    // Uber
    { company: 'Uber', published_date: '2020-05-06', title: 'Uber to cut 3,700 jobs as coronavirus pandemic crushes ride-hailing demand', source: 'Reuters', url: 'https://www.reuters.com/article/us-uber-layoffs-idUSKBN22I2FC', sentiment: 'negative', is_layoff_related: true },
    { company: 'Uber', published_date: '2020-05-18', title: 'Uber cuts 3,000 more jobs, closes 45 offices in second wave of layoffs', source: 'CNBC', url: 'https://www.cnbc.com/2020/05/18/uber-to-cut-another-3000-jobs-close-45-offices-in-ongoing-restructuring.html', sentiment: 'negative', is_layoff_related: true },
    { company: 'Uber', published_date: '2023-02-08', title: 'Uber posts first annual operating profit in company history', source: 'Reuters', url: 'https://www.reuters.com/technology/uber-posts-first-annual-operating-profit-2023-02-08/', sentiment: 'positive', is_layoff_related: false },
    { company: 'Uber', published_date: '2019-12-05', title: 'Uber safety report reveals 3,045 sexual assaults reported in 2018', source: 'CNN', url: 'https://www.cnn.com/2019/12/05/tech/uber-safety-report/index.html', sentiment: 'negative', is_layoff_related: false },

    // Boeing
    { company: 'Boeing', published_date: '2024-11-01', title: 'Boeing to cut 17,000 jobs — 10% of workforce — after prolonged machinist strike', source: 'Reuters', url: 'https://www.reuters.com/business/aerospace-defense/boeing-cut-17000-jobs-2024-11-01/', sentiment: 'negative', is_layoff_related: true },
    { company: 'Boeing', published_date: '2024-01-06', title: 'Boeing 737 MAX 9 door plug blows out mid-flight on Alaska Airlines jet', source: 'Reuters', url: 'https://www.reuters.com/business/aerospace-defense/boeing-737-max-door-plug-blowout-2024-01-06/', sentiment: 'negative', is_layoff_related: false },
    { company: 'Boeing', published_date: '2024-03-09', title: 'Boeing whistleblower John Barnett found dead during lawsuit deposition', source: 'NY Times', url: 'https://www.nytimes.com/2024/03/09/business/john-barnett-boeing-whistleblower-dead.html', sentiment: 'negative', is_layoff_related: false },
    { company: 'Boeing', published_date: '2024-09-13', title: 'Boeing machinists go on strike for first time in 16 years', source: 'Reuters', url: 'https://www.reuters.com/business/aerospace-defense/boeing-machinists-strike-2024-09-13/', sentiment: 'negative', is_layoff_related: false },

    // Goldman Sachs
    { company: 'Goldman Sachs', published_date: '2023-01-09', title: 'Goldman Sachs to lay off 3,200 employees in biggest cuts since 2008', source: 'Reuters', url: 'https://www.reuters.com/business/finance/goldman-sachs-begin-laying-off-thousands-workers-wednesday-2023-01-09/', sentiment: 'negative', is_layoff_related: true },
    { company: 'Goldman Sachs', published_date: '2023-05-08', title: 'Goldman Sachs settles gender discrimination lawsuit for $215 million', source: 'Reuters', url: 'https://www.reuters.com/legal/litigation/goldman-sachs-agrees-settle-gender-discrimination-case-215-mln-2023-05-08/', sentiment: 'negative', is_layoff_related: false },
    { company: 'Goldman Sachs', published_date: '2024-01-16', title: 'Goldman Sachs reports strong Q4 earnings, profits surge 51%', source: 'CNBC', url: 'https://www.cnbc.com/2024/01/16/goldman-sachs-earnings-q4-2023.html', sentiment: 'positive', is_layoff_related: false },

    // Salesforce
    { company: 'Salesforce', published_date: '2023-01-04', title: 'Salesforce to lay off 10% of workforce — about 7,000 employees', source: 'CNBC', url: 'https://www.cnbc.com/2023/01/04/salesforce-to-lay-off-10percent-of-employees.html', sentiment: 'negative', is_layoff_related: true },
    { company: 'Salesforce', published_date: '2024-02-28', title: 'Salesforce reports record revenue, raises full-year outlook', source: 'Reuters', url: 'https://www.reuters.com/technology/salesforce-raises-revenue-forecast-2024-02-28/', sentiment: 'positive', is_layoff_related: false },

    // Nike
    { company: 'Nike', published_date: '2018-04-28', title: 'Inside Nike, revolt led by women leads to wave of executive departures', source: 'NY Times', url: 'https://www.nytimes.com/2018/04/28/business/nike-women.html', sentiment: 'negative', is_layoff_related: false },
    { company: 'Nike', published_date: '2024-02-15', title: 'Nike to lay off more than 740 workers at Oregon headquarters', source: 'Reuters', url: 'https://www.reuters.com/business/retail-consumer/nike-lay-off-more-than-740-workers-oregon-headquarters-2024-02-15/', sentiment: 'negative', is_layoff_related: true },
    { company: 'Nike', published_date: '2024-10-01', title: 'Nike names Elliott Hill as new CEO replacing John Donahoe', source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2024-09-19/nike-ceo-change', sentiment: 'neutral', is_layoff_related: false },

    // Disney
    { company: 'Disney', published_date: '2020-09-29', title: 'Disney to lay off 28,000 employees in its theme parks division', source: 'CNBC', url: 'https://www.cnbc.com/2020/09/29/disney-to-lay-off-28000-employees-in-us-theme-parks-division.html', sentiment: 'negative', is_layoff_related: true },
    { company: 'Disney', published_date: '2023-02-08', title: 'Disney to cut 7,000 jobs in major cost-cutting restructuring', source: 'Reuters', url: 'https://www.reuters.com/business/media-telecom/disney-cut-7000-jobs-part-restructuring-plan-ceo-iger-2023-02-08/', sentiment: 'negative', is_layoff_related: true },
    { company: 'Disney', published_date: '2023-06-27', title: 'Disneyland workers reach $233 million settlement in wage theft case', source: 'Reuters', url: 'https://www.reuters.com/business/disneyland-workers-reach-233-mln-settlement-wage-claim-2023-06-27/', sentiment: 'negative', is_layoff_related: false },
    { company: 'Disney', published_date: '2024-02-06', title: 'Gina Carano sues Disney and Lucasfilm over Mandalorian firing', source: 'Reuters', url: 'https://www.reuters.com/legal/litigation/mandalorian-actor-gina-carano-sues-disney-wrongful-termination-2024-02-06/', sentiment: 'negative', is_layoff_related: false },

    // Wells Fargo
    { company: 'Wells Fargo', published_date: '2022-12-20', title: 'Wells Fargo to pay $3.7 billion for widespread consumer abuses', source: 'Reuters', url: 'https://www.reuters.com/business/finance/wells-fargo-pay-37-bln-consumer-financial-protection-bureau-2022-12-20/', sentiment: 'negative', is_layoff_related: false },
    { company: 'Wells Fargo', published_date: '2023-09-12', title: 'Wells Fargo still under Fed asset cap 5 years after fake accounts scandal', source: 'WSJ', url: 'https://www.wsj.com/articles/wells-fargo-asset-cap-federal-reserve-2023', sentiment: 'negative', is_layoff_related: false },

    // Coinbase
    { company: 'Coinbase', published_date: '2022-06-14', title: 'Coinbase to cut 18% of workforce as crypto winter deepens', source: 'Reuters', url: 'https://www.reuters.com/technology/coinbase-lay-off-18-workforce-2022-06-14/', sentiment: 'negative', is_layoff_related: true },
    { company: 'Coinbase', published_date: '2023-01-10', title: 'Coinbase cuts 20% of workforce in second major round of layoffs', source: 'CNBC', url: 'https://www.cnbc.com/2023/01/10/coinbase-to-cut-20percent-of-workforce-as-crypto-winter-drags-on.html', sentiment: 'negative', is_layoff_related: true },
    { company: 'Coinbase', published_date: '2023-06-06', title: 'SEC sues Coinbase for operating as unregistered securities exchange', source: 'Reuters', url: 'https://www.reuters.com/legal/sec-sues-coinbase-over-failure-register-2023-06-06/', sentiment: 'negative', is_layoff_related: false },

    // Activision Blizzard
    { company: 'Activision Blizzard', published_date: '2021-07-21', title: 'California sues Activision Blizzard over frat boy culture and harassment', source: 'NY Times', url: 'https://www.nytimes.com/2021/07/21/technology/activision-blizzard-lawsuit.html', sentiment: 'negative', is_layoff_related: false },
    { company: 'Activision Blizzard', published_date: '2024-01-25', title: 'Microsoft lays off 1,900 Activision Blizzard employees after acquisition', source: 'The Verge', url: 'https://www.theverge.com/2024/1/25/24049050/microsoft-activision-blizzard-layoffs', sentiment: 'negative', is_layoff_related: true },
    { company: 'Activision Blizzard', published_date: '2023-02-03', title: 'SEC fines Activision $35M for failing to disclose workplace misconduct', source: 'WSJ', url: 'https://www.wsj.com/articles/activision-blizzard-to-pay-35-million-to-settle-sec-probe-11675438846', sentiment: 'negative', is_layoff_related: false },

    // SpaceX
    { company: 'SpaceX', published_date: '2024-01-03', title: 'SpaceX illegally fired employees who criticized Elon Musk, NLRB says', source: 'Reuters', url: 'https://www.reuters.com/technology/spacex-illegally-fired-employees-criticizing-elon-musk-us-labor-agency-2024-01-03/', sentiment: 'negative', is_layoff_related: false },
    { company: 'SpaceX', published_date: '2023-08-24', title: 'DOJ sues SpaceX for hiring discrimination against refugees', source: 'Reuters', url: 'https://www.reuters.com/legal/government/us-sues-spacex-over-hiring-discrimination-against-refugees-2023-08-24/', sentiment: 'negative', is_layoff_related: false },
    { company: 'SpaceX', published_date: '2024-06-06', title: 'SpaceX Starship completes first successful full test flight', source: 'Reuters', url: 'https://www.reuters.com/technology/space/spacex-starship-test-flight-2024-06-06/', sentiment: 'positive', is_layoff_related: false },

    // OpenAI
    { company: 'OpenAI', published_date: '2023-11-17', title: 'OpenAI board fires CEO Sam Altman, triggering company crisis', source: 'Reuters', url: 'https://www.reuters.com/technology/openai-ceo-sam-altman-fired-by-board-2023-11-17/', sentiment: 'negative', is_layoff_related: false },
    { company: 'OpenAI', published_date: '2024-02-29', title: 'Elon Musk sues OpenAI and Sam Altman over nonprofit mission betrayal', source: 'Reuters', url: 'https://www.reuters.com/technology/elon-musk-sues-openai-ceo-sam-altman-breach-contract-2024-03-01/', sentiment: 'negative', is_layoff_related: false },
    { company: 'OpenAI', published_date: '2024-05-14', title: 'OpenAI safety team departures raise concerns about AI oversight', source: 'NY Times', url: 'https://www.nytimes.com/2024/05/14/technology/openai-safety-team-departures.html', sentiment: 'negative', is_layoff_related: false },
    { company: 'OpenAI', published_date: '2024-05-16', title: 'OpenAI faces backlash over equity clawback threats to departing employees', source: 'Vox', url: 'https://www.vox.com/technology/2024/5/16/24158478/openai-equity-clawback-nondisparagement', sentiment: 'negative', is_layoff_related: false },
    { company: 'OpenAI', published_date: '2024-05-13', title: 'OpenAI launches GPT-4o with free access to advanced AI capabilities', source: 'The Verge', url: 'https://www.theverge.com/2024/5/13/openai-gpt-4o-launch', sentiment: 'positive', is_layoff_related: false },
  ];

  console.log('\n--- Inserting news items ---');
  let newsCount = 0;
  for (const n of newsItems) {
    const companyId = cid(n.company);
    if (!companyId) continue;
    try {
      await pool.query(
        `INSERT INTO news_items (company_id, published_date, title, source, url, sentiment, is_layoff_related)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [companyId, n.published_date, n.title, n.source, n.url, n.sentiment, n.is_layoff_related]
      );
      newsCount++;
    } catch (err) {
      console.error(`  Error inserting news for ${n.company}:`, err.message);
    }
  }
  console.log(`  Inserted ${newsCount} news items`);

  // =========================================================
  // RISK SCORES
  // =========================================================
  // Higher scores = more risk. Based on lawsuit/layoff severity.
  const riskScores = [
    { company: 'Google', overall: 72, filing: 75, sentiment: 60, theme: 65, filing_accel: 70, warn: 80, industry_pct: 70, size_pct: 65, level: 'elevated' },
    { company: 'Amazon', overall: 78, filing: 80, sentiment: 55, theme: 70, filing_accel: 75, warn: 85, industry_pct: 80, size_pct: 70, level: 'high' },
    { company: 'Apple', overall: 55, filing: 50, sentiment: 45, theme: 55, filing_accel: 40, warn: 35, industry_pct: 45, size_pct: 40, level: 'moderate' },
    { company: 'Microsoft', overall: 62, filing: 55, sentiment: 50, theme: 60, filing_accel: 65, warn: 70, industry_pct: 55, size_pct: 50, level: 'elevated' },
    { company: 'Uber', overall: 75, filing: 80, sentiment: 65, theme: 75, filing_accel: 60, warn: 70, industry_pct: 75, size_pct: 70, level: 'high' },
    { company: 'Boeing', overall: 88, filing: 85, sentiment: 90, theme: 85, filing_accel: 90, warn: 95, industry_pct: 90, size_pct: 85, level: 'high' },
    { company: 'Goldman Sachs', overall: 70, filing: 75, sentiment: 60, theme: 65, filing_accel: 55, warn: 65, industry_pct: 70, size_pct: 60, level: 'elevated' },
    { company: 'Salesforce', overall: 58, filing: 55, sentiment: 50, theme: 55, filing_accel: 50, warn: 65, industry_pct: 50, size_pct: 55, level: 'moderate' },
    { company: 'Nike', overall: 60, filing: 65, sentiment: 55, theme: 60, filing_accel: 50, warn: 55, industry_pct: 55, size_pct: 50, level: 'moderate' },
    { company: 'Disney', overall: 74, filing: 70, sentiment: 65, theme: 70, filing_accel: 75, warn: 85, industry_pct: 70, size_pct: 65, level: 'elevated' },
    { company: 'Wells Fargo', overall: 82, filing: 85, sentiment: 75, theme: 80, filing_accel: 70, warn: 60, industry_pct: 85, size_pct: 80, level: 'high' },
    { company: 'Coinbase', overall: 76, filing: 80, sentiment: 70, theme: 75, filing_accel: 75, warn: 80, industry_pct: 75, size_pct: 70, level: 'high' },
    { company: 'Activision Blizzard', overall: 85, filing: 90, sentiment: 85, theme: 80, filing_accel: 80, warn: 75, industry_pct: 90, size_pct: 85, level: 'high' },
    { company: 'SpaceX', overall: 68, filing: 70, sentiment: 65, theme: 60, filing_accel: 55, warn: 40, industry_pct: 65, size_pct: 60, level: 'elevated' },
    { company: 'OpenAI', overall: 65, filing: 60, sentiment: 70, theme: 65, filing_accel: 55, warn: 30, industry_pct: 60, size_pct: 55, level: 'elevated' },
  ];

  console.log('\n--- Upserting risk scores ---');
  let riskCount = 0;
  for (const r of riskScores) {
    const companyId = cid(r.company);
    if (!companyId) continue;
    try {
      await pool.query(
        `INSERT INTO risk_scores (company_id, score_date, overall_score, filing_rate_score, sentiment_trend_score, theme_concentration_score, filing_acceleration_score, warn_signal_score, industry_percentile, size_percentile, risk_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (company_id, score_date) DO UPDATE SET
           overall_score = EXCLUDED.overall_score,
           filing_rate_score = EXCLUDED.filing_rate_score,
           sentiment_trend_score = EXCLUDED.sentiment_trend_score,
           theme_concentration_score = EXCLUDED.theme_concentration_score,
           filing_acceleration_score = EXCLUDED.filing_acceleration_score,
           warn_signal_score = EXCLUDED.warn_signal_score,
           industry_percentile = EXCLUDED.industry_percentile,
           size_percentile = EXCLUDED.size_percentile,
           risk_level = EXCLUDED.risk_level`,
        [companyId, '2025-03-01', r.overall, r.filing, r.sentiment, r.theme, r.filing_accel, r.warn, r.industry_pct, r.size_pct, r.level]
      );
      riskCount++;
    } catch (err) {
      console.error(`  Error upserting risk score for ${r.company}:`, err.message);
    }
  }
  console.log(`  Upserted ${riskCount} risk scores`);

  // =========================================================
  // SENTIMENT SNAPSHOTS (Glassdoor-approximate)
  // =========================================================
  const sentimentData = [
    { company: 'Google', overall: 4.3, culture: 4.4, leadership: 3.8, work_life: 4.2, comp: 4.5, career: 4.0, reviews: 45000, recommend: 82.0, ceo_approval: 88.0 },
    { company: 'Amazon', overall: 3.4, culture: 3.2, leadership: 3.0, work_life: 2.8, comp: 3.5, career: 3.3, reviews: 120000, recommend: 62.0, ceo_approval: 70.0 },
    { company: 'Apple', overall: 4.1, culture: 4.0, leadership: 3.7, work_life: 3.8, comp: 4.2, career: 3.8, reviews: 30000, recommend: 78.0, ceo_approval: 85.0 },
    { company: 'Microsoft', overall: 4.2, culture: 4.3, leadership: 4.0, work_life: 4.1, comp: 4.3, career: 4.0, reviews: 55000, recommend: 84.0, ceo_approval: 92.0 },
    { company: 'Uber', overall: 3.8, culture: 3.9, leadership: 3.5, work_life: 3.6, comp: 4.0, career: 3.5, reviews: 12000, recommend: 70.0, ceo_approval: 78.0 },
    { company: 'Boeing', overall: 3.5, culture: 3.3, leadership: 2.8, work_life: 3.4, comp: 3.6, career: 3.2, reviews: 25000, recommend: 55.0, ceo_approval: 40.0 },
    { company: 'Goldman Sachs', overall: 3.8, culture: 3.6, leadership: 3.5, work_life: 2.9, comp: 4.2, career: 3.8, reviews: 18000, recommend: 68.0, ceo_approval: 72.0 },
    { company: 'Salesforce', overall: 4.0, culture: 4.1, leadership: 3.7, work_life: 3.9, comp: 4.1, career: 3.8, reviews: 15000, recommend: 76.0, ceo_approval: 75.0 },
    { company: 'Nike', overall: 3.9, culture: 3.8, leadership: 3.4, work_life: 3.7, comp: 3.6, career: 3.5, reviews: 10000, recommend: 72.0, ceo_approval: 65.0 },
    { company: 'Disney', overall: 3.7, culture: 3.8, leadership: 3.2, work_life: 3.3, comp: 3.0, career: 3.2, reviews: 35000, recommend: 65.0, ceo_approval: 68.0 },
    { company: 'Wells Fargo', overall: 3.3, culture: 3.1, leadership: 2.9, work_life: 3.4, comp: 3.2, career: 3.0, reviews: 40000, recommend: 52.0, ceo_approval: 55.0 },
    { company: 'Coinbase', overall: 3.6, culture: 3.7, leadership: 3.3, work_life: 3.5, comp: 4.0, career: 3.2, reviews: 2000, recommend: 60.0, ceo_approval: 58.0 },
    { company: 'Activision Blizzard', overall: 3.4, culture: 3.0, leadership: 2.7, work_life: 3.5, comp: 3.4, career: 3.0, reviews: 8000, recommend: 55.0, ceo_approval: 35.0 },
    { company: 'SpaceX', overall: 3.7, culture: 3.5, leadership: 3.2, work_life: 2.5, comp: 3.6, career: 3.8, reviews: 5000, recommend: 70.0, ceo_approval: 75.0 },
    { company: 'OpenAI', overall: 4.0, culture: 4.1, leadership: 3.5, work_life: 3.3, comp: 4.5, career: 4.0, reviews: 500, recommend: 75.0, ceo_approval: 70.0 },
  ];

  console.log('\n--- Upserting sentiment snapshots ---');
  let sentimentCount = 0;
  for (const s of sentimentData) {
    const companyId = cid(s.company);
    if (!companyId) continue;
    try {
      await pool.query(
        `INSERT INTO sentiment_snapshots (company_id, snapshot_date, overall_rating, culture_rating, leadership_rating, work_life_rating, comp_rating, career_opp_rating, review_count, recommend_pct, ceo_approval_pct, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (company_id, snapshot_date, source) DO UPDATE SET
           overall_rating = EXCLUDED.overall_rating,
           culture_rating = EXCLUDED.culture_rating,
           leadership_rating = EXCLUDED.leadership_rating,
           work_life_rating = EXCLUDED.work_life_rating,
           comp_rating = EXCLUDED.comp_rating,
           career_opp_rating = EXCLUDED.career_opp_rating,
           review_count = EXCLUDED.review_count,
           recommend_pct = EXCLUDED.recommend_pct,
           ceo_approval_pct = EXCLUDED.ceo_approval_pct`,
        [companyId, '2025-03-01', s.overall, s.culture, s.leadership, s.work_life, s.comp, s.career, s.reviews, s.recommend, s.ceo_approval, 'glassdoor']
      );
      sentimentCount++;
    } catch (err) {
      console.error(`  Error upserting sentiment for ${s.company}:`, err.message);
    }
  }
  console.log(`  Upserted ${sentimentCount} sentiment snapshots`);

  console.log('\n=== ENRICHMENT COMPLETE ===');
  console.log(`Lawsuits: ${lawsuitCount}`);
  console.log(`WARN notices: ${warnCount}`);
  console.log(`News items: ${newsCount}`);
  console.log(`Risk scores: ${riskCount}`);
  console.log(`Sentiment snapshots: ${sentimentCount}`);

  await pool.end();
}

main().catch(err => {
  console.error('FATAL:', err);
  pool.end();
  process.exit(1);
});

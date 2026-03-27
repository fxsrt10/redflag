-- ============================================
-- RedFlag — Full MVP Database Schema
-- ============================================

-- Core entity
CREATE TABLE companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    ticker          TEXT,
    legal_name      TEXT,
    industry        TEXT,
    size_bucket     TEXT CHECK (size_bucket IN ('micro','small','mid','large','mega')),
    employee_count  INT,
    hq_state        TEXT,
    website         TEXT,
    sec_cik         TEXT,
    logo_url        TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE company_aliases (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
    alias       TEXT NOT NULL,
    alias_type  TEXT CHECK (alias_type IN ('legal','brand','subsidiary','former'))
);

-- Federal lawsuit filings
CREATE TABLE lawsuits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
    case_number     TEXT NOT NULL,
    court           TEXT,
    filed_date      DATE NOT NULL,
    nature_of_suit  TEXT,
    category        TEXT CHECK (category IN ('discrimination','harassment','retaliation','wage_hour','wrongful_termination','class_action','sec_action','other')),
    status          TEXT CHECK (status IN ('open','closed','settled')),
    plaintiff_type  TEXT CHECK (plaintiff_type IN ('individual','class_action','eeoc','government')),
    description     TEXT,
    source_url      TEXT,
    raw_data        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Glassdoor rating snapshots
CREATE TABLE sentiment_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,
    snapshot_date       DATE NOT NULL,
    overall_rating      NUMERIC(2,1),
    culture_rating      NUMERIC(2,1),
    leadership_rating   NUMERIC(2,1),
    work_life_rating    NUMERIC(2,1),
    comp_rating         NUMERIC(2,1),
    career_opp_rating   NUMERIC(2,1),
    review_count        INT,
    recommend_pct       NUMERIC(4,1),
    ceo_approval_pct    NUMERIC(4,1),
    source              TEXT DEFAULT 'glassdoor',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, snapshot_date, source)
);

-- Review theme frequencies
CREATE TABLE review_themes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    theme           TEXT NOT NULL,
    mention_count   INT,
    review_count    INT,
    source          TEXT DEFAULT 'glassdoor',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- WARN Act layoff notices
CREATE TABLE warn_notices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,
    state               TEXT,
    notice_date         DATE,
    effective_date      DATE,
    employees_affected  INT,
    reason              TEXT,
    source_url          TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Computed risk scores
CREATE TABLE risk_scores (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id                  UUID REFERENCES companies(id) ON DELETE CASCADE,
    score_date                  DATE NOT NULL,
    overall_score               NUMERIC(4,1),
    filing_rate_score           NUMERIC(4,1),
    sentiment_trend_score       NUMERIC(4,1),
    theme_concentration_score   NUMERIC(4,1),
    filing_acceleration_score   NUMERIC(4,1),
    warn_signal_score           NUMERIC(4,1),
    industry_percentile         NUMERIC(4,1),
    size_percentile             NUMERIC(4,1),
    risk_level                  TEXT CHECK (risk_level IN ('low','moderate','elevated','high')),
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, score_date)
);

-- ============================================
-- Founders
-- ============================================

CREATE TABLE founders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    title           TEXT,
    net_worth_band  TEXT,
    public_profile  TEXT,
    photo_url       TEXT,
    wikipedia_url   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE founder_companies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id  UUID REFERENCES founders(id) ON DELETE CASCADE,
    company_id  UUID REFERENCES companies(id) ON DELETE SET NULL,
    role        TEXT,
    start_date  DATE,
    end_date    DATE,
    is_primary  BOOLEAN DEFAULT true
);

CREATE TABLE founder_legal_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id  UUID REFERENCES founders(id) ON DELETE CASCADE,
    company_id  UUID REFERENCES companies(id) ON DELETE SET NULL,
    event_date  DATE NOT NULL,
    event_type  TEXT CHECK (event_type IN ('personal_lawsuit','sec_action','regulatory','criminal','settlement')),
    role        TEXT CHECK (role IN ('defendant','plaintiff','witness','subject')),
    description TEXT,
    case_number TEXT,
    source_url  TEXT,
    outcome     TEXT,
    severity    TEXT CHECK (severity IN ('minor','moderate','major','criminal')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE founder_controversy_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id  UUID REFERENCES founders(id) ON DELETE CASCADE,
    company_id  UUID REFERENCES companies(id) ON DELETE SET NULL,
    event_date  DATE NOT NULL,
    event_type  TEXT CHECK (event_type IN ('public_statement','policy_change','mass_layoff','social_media','congressional','acquisition','resignation')),
    headline    TEXT,
    impact_level TEXT CHECK (impact_level IN ('low','medium','high','viral')),
    source_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE founder_impact_scores (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id              UUID REFERENCES founders(id) ON DELETE CASCADE,
    company_id              UUID REFERENCES companies(id) ON DELETE CASCADE,
    score_date              DATE NOT NULL,
    founder_risk_score      NUMERIC(4,1),
    controversy_count_12mo  INT,
    personal_legal_count    INT,
    sentiment_delta_post    NUMERIC(3,1),
    lawsuit_delta_post_pct  NUMERIC(5,1),
    avg_sentiment_lag_days  INT,
    avg_lawsuit_lag_days    INT,
    pattern_summary         TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(founder_id, company_id, score_date)
);

-- ============================================
-- Forbes 30 Under 30
-- ============================================

CREATE TABLE forbes_30u30 (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    list_year       INT NOT NULL,
    category        TEXT,
    company_name    TEXT,
    company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
    age_at_listing  INT,
    current_status  TEXT CHECK (current_status IN ('active','defunct_company','convicted','charged','settled','under_investigation','clean')),
    photo_url       TEXT,
    forbes_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forbes_30u30_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id   UUID REFERENCES forbes_30u30(id) ON DELETE CASCADE,
    event_date  DATE,
    event_type  TEXT CHECK (event_type IN ('lawsuit','sec_action','criminal_charge','settlement','conviction','acquittal','bankruptcy','fraud')),
    description TEXT,
    severity    TEXT CHECK (severity IN ('minor','moderate','major','criminal')),
    outcome     TEXT CHECK (outcome IN ('pending','settled','convicted','dismissed','acquitted')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forbes_30u30_year_stats (
    list_year           INT PRIMARY KEY,
    total_listed        INT DEFAULT 30,
    legal_events_count  INT,
    persons_with_events INT,
    fraud_rate_pct      NUMERIC(4,1),
    avg_years_to_event  NUMERIC(4,1),
    most_common_event   TEXT,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Compensation
-- ============================================

CREATE TABLE compensation_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    level               TEXT,
    department          TEXT,
    base_salary         INT,
    total_comp          INT,
    stock_value         INT,
    bonus               INT,
    location            TEXT,
    years_experience    INT,
    source              TEXT CHECK (source IN ('levels_fyi','glassdoor','self_reported')),
    report_date         DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE compensation_summaries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,
    snapshot_date       DATE NOT NULL,
    median_total_comp   INT,
    median_base         INT,
    p25_total_comp      INT,
    p75_total_comp      INT,
    comp_vs_peers_pct   NUMERIC(4,1),
    sample_size         INT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, snapshot_date)
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_lawsuits_company_date ON lawsuits(company_id, filed_date);
CREATE INDEX idx_lawsuits_category ON lawsuits(category);
CREATE INDEX idx_sentiment_company_date ON sentiment_snapshots(company_id, snapshot_date);
CREATE INDEX idx_risk_scores_company_date ON risk_scores(company_id, score_date);
CREATE INDEX idx_founder_events_date ON founder_legal_events(founder_id, event_date);
CREATE INDEX idx_founder_controversy_date ON founder_controversy_events(founder_id, event_date);
CREATE INDEX idx_founder_impact_date ON founder_impact_scores(founder_id, score_date);
CREATE INDEX idx_forbes_year ON forbes_30u30(list_year);
CREATE INDEX idx_comp_entries_company ON compensation_entries(company_id);
CREATE INDEX idx_comp_summaries_company ON compensation_summaries(company_id, snapshot_date);

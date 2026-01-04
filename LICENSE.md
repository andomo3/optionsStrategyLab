
## `docs/SYSTEM_DESIGN.md`
```md
# System Design — Options Strategy Lab

## 1. Goals
### Functional
- Let users define multi-leg strategies with an intuitive UI
- Compute pricing and Greeks accurately and quickly
- Provide interactive scenario analysis (spot/vol/time)
- Run Monte Carlo to estimate P/L distributions and tail risk
- Make assumptions explicit and results explainable

### Non-functional
- Responsive UX:
  - instant pricing: <300ms
  - risk runs: async job with progress and caching
- Reproducible results:
  - parameterized model inputs + seed stored for every run

## 2. Architecture Overview
### Components
1) **Next.js Frontend**
- Strategy builder table (spreadsheet-like)
- Payoff + Greeks dashboard
- Scenario scrubber for time/spot/vol
- Risk results: histogram, POP, VaR/CVaR, explanation panel

2) **Django API (DRF)**
- Auth + persistence (strategies, legs, snapshots, runs)
- Synchronous endpoints for fast pricing
- Async orchestration for Monte Carlo risk runs via Celery

3) **Risk Engine Workers (Celery)**
- Monte Carlo simulation
- Optional: calibrations and parameter fitting
- Writes results to DB + artifact storage

4) **PostgreSQL**
- Strategies, legs, run metadata, result summaries

5) **Redis**
- Cache:
  - recent pricing snapshots
  - payoff grids for common strategies
- Celery broker

6) **Artifact Storage**
- Large arrays (P/L distribution samples, path summaries)
- Stored externally; DB stores pointers + summary stats

## 3. Two-Tier Compute Model
### Tier 1 (Sync)
- Price and Greeks using fast formulas
- Return totals + per-leg breakdown
- Return payoff grid for display (computed quickly or cached)

### Tier 2 (Async)
- Monte Carlo outcomes for horizon H
- Computes:
  - distribution, expected P/L, POP
  - VaR and CVaR
  - sensitivity attribution (optional)
- Returns `job_id`, UI polls until ready

## 4. Key Design Choices
### Django + DRF
- Faster iteration with clean APIs and admin tooling
- Easy persistence for saved strategies and histories

### Postgres
- Robust indexing for strategy lookups and run histories
- JSON fields for model parameters

### Redis + Celery
- Enables realistic Monte Carlo without freezing UI
- Allows caching precomputed demo scenarios for recruiter mode

### Next.js + TS + Tailwind
- Strong UI/UX with type-safe handling of complex data structures
- Excellent for interactive dashboards and shareable permalinks

## 5. Caching Strategy
- Strategy hash key:
  - `strategy_hash = hash(legs + underlier + snapshot + model_params)`
- Cache:
  - `pricing:{strategy_hash}`
  - `payoff_grid:{strategy_hash}`
  - `risk_summary:{strategy_hash}:{horizon}`
- Warm caches for demo strategies

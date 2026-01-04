# Options Strategy Lab — Interactive Decision Platform

A trader-facing web platform to build multi-leg option strategies and quantify risk under model assumptions, with scenario controls and Monte Carlo outcome distributions.

## What this platform does
- Create/edit multi-leg strategies (spreads, straddles, condors, calendars)
- Price legs and compute Greeks (per-leg + aggregated)
- Interactive scenario analysis:
  - spot move, vol shift, time decay scrubber
- Monte Carlo risk analysis:
  - distribution of outcomes, probability of profit, VaR/CVaR
- “Explain” panels for each metric to make results interpretable

## Tech Stack
**Backend**
- Django + DRF
- PostgreSQL
- Redis (cache + Celery broker)
- Celery workers for Monte Carlo + heavy computations

**Frontend**
- Next.js + React + TypeScript
- Tailwind CSS + shadcn/ui
- Plotly.js (payoff, distributions) + simple chart libs as needed
- Framer Motion for UI polish

## Quickstart (Local)
### 1) Configure environment
```bash
cp .env.example .env

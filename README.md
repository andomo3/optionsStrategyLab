# Options Strategy Lab

Production-ready scaffold for a quant-oriented platform that lets users define multi-leg option strategies and explore pricing, Greeks, and risk. This repository contains boilerplate only.

## Purpose and scope
- Deliver a clean, production-leaning starter for a data-heavy web app.
- Provide placeholders for APIs, services, and UI surfaces.
- Defer all quant logic, market data ingestion, and charting to later phases.

## Tech stack
Backend:
- Python 3.11+, Django, DRF
- PostgreSQL, Redis, Celery (stubbed)
- WhiteNoise, Gunicorn

Frontend:
- Next.js (App Router), React, TypeScript
- Tailwind CSS, shadcn/ui baseline

Infra:
- Docker Compose (Postgres, Redis, API, worker, frontend)

## Local run
```bash
cp .env.example .env
cd infra
docker-compose up --build
```

Backend health: `http://localhost:8000/api/health/`
Frontend: `http://localhost:3000`

## Repository structure
```
backend/        Django project with app layer stubs
frontend/       Next.js app router + Tailwind
infra/          Docker Compose and infra placeholders
docs/           System design and API drafts
.github/        CI skeleton
```

## Roadmap
- Add real data models for strategies, legs, and market data
- Implement pricing services and Greeks aggregation
- Add scenario controls + charting (Plotly)
- Wire Monte Carlo jobs to Celery
- Add auth and multi-user permissions

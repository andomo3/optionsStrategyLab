# API Draft

## Health
- GET `/api/health/` -> `{ "status": "ok" }`

## Strategies (placeholders)
- GET `/api/strategies/`
- POST `/api/strategies/`
- GET `/api/strategies/{id}/`
- PATCH `/api/strategies/{id}/`
- DELETE `/api/strategies/{id}/`
- GET `/api/strategy-legs/`
- Filtering: `?strategy_kind=momentum`
- Search: `?search=condor`
- Ordering: `?ordering=-created_at`
- Pagination: `?page=1` (default page size 25)

## Market data (placeholders)
- GET `/api/market-data/`

## Pricing (placeholders)
- POST `/api/pricing/preview/`
- POST `/api/pricing/greeks/`

## Risk (placeholders)
- POST `/api/risk/scenario/`
- POST `/api/risk/monte-carlo/`

## Jobs (placeholders)
- POST `/api/jobs/`
- GET `/api/jobs/{id}/`

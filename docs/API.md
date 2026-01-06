# API Draft

## Health
- GET `/api/health/` -> `{ "status": "ok" }`

## Auth
- POST `/api/auth/token/` -> returns token
- GET `/api/auth/status/`
- POST `/api/auth/login/` (session)
- POST `/api/auth/logout/` (session)

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
- Writes require auth token

## Market data (placeholders)
- GET `/api/market-data/`

## Pricing (placeholders)
- POST `/api/pricing/preview/`
- POST `/api/pricing/greeks/`
- GET `/api/pricing-runs/`
- POST `/api/pricing-runs/`
 - Writes require auth token

## Risk (placeholders)
- POST `/api/risk/scenario/`
- POST `/api/risk/monte-carlo/`
- GET `/api/risk-scenarios/`
- POST `/api/risk-scenarios/`
- GET `/api/stress-tests/`
- POST `/api/stress-tests/`
- Scenario input fields: `spot_shift`, `vol_shift`, `time_shift`
- Writes require auth token

## Jobs (placeholders)
- POST `/api/jobs/`
- GET `/api/jobs/{id}/`

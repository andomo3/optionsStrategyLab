# API Draft

## Health
- GET `/api/health/` -> `{ "status": "ok" }`

## Auth
- POST `/api/auth/register/` -> returns `{ access, refresh }`
- POST `/api/auth/login/` -> returns `{ access, refresh }`
- POST `/api/auth/refresh/` -> returns `{ access }`
- GET `/api/auth/me/` -> current user (JWT)
- POST `/api/auth/demo/login/` -> returns `{ access, refresh, strategy_id }`
- GET `/api/auth/status/` (legacy)
- POST `/api/auth/session/login/` (legacy session)
- POST `/api/auth/session/logout/` (legacy session)
- POST `/api/auth/token/` (legacy DRF token)

## Strategies (placeholders)
- GET `/api/strategies/`
- POST `/api/strategies/`
- GET `/api/strategies/{id}/`
- PATCH `/api/strategies/{id}/`
- DELETE `/api/strategies/{id}/`
- GET `/api/strategies/{id}/legs/`
- POST `/api/strategies/{id}/legs/`
- PATCH `/api/strategies/{id}/legs/{leg_id}/`
- DELETE `/api/strategies/{id}/legs/{leg_id}/`
- Search: `?search=condor`
- Ordering: `?ordering=-created_at`
- Pagination: `?page=1` (default page size 25)
- Writes require auth (JWT)

## Market data (placeholders)
- GET `/api/market-data/`

## Pricing (placeholders)
- POST `/api/pricing/preview/`
- POST `/api/pricing/payoff-grid/`
- GET `/api/pricing-runs/`
- POST `/api/pricing-runs/`
- Writes require auth (JWT)

Preview request example:
```json
{
  "strategy_id": 123,
  "spot": 100.0,
  "r": 0.02,
  "q": 0.0,
  "as_of": "2026-01-06",
  "iv_mode": "global",
  "global_iv": 0.25,
  "leg_overrides": {
    "456": { "iv": 0.3 }
  }
}
```

Payoff grid request example:
```json
{
  "strategy_id": 123,
  "spot": 100,
  "spot_min_mult": 0.5,
  "spot_max_mult": 1.5,
  "num_points": 200
}
```

## Risk (placeholders)
- POST `/api/risk/scenario/`
- POST `/api/risk/run/`
- GET `/api/risk/{id}/`
- POST `/api/risk/monte-carlo/`
- GET `/api/risk-scenarios/`
- POST `/api/risk-scenarios/`
- GET `/api/stress-tests/`
- POST `/api/stress-tests/`
- Scenario input fields: `spot_shift`, `vol_shift`, `time_shift`
- Writes require auth token

Risk run request example:
```json
{
  "strategy_id": 123,
  "spot": 100,
  "r": 0.02,
  "q": 0.0,
  "sigma": 0.25,
  "as_of": "2026-01-06",
  "horizon_days": 30,
  "paths": 10000,
  "seed": 7
}
```

## Jobs (placeholders)
- POST `/api/jobs/`
- GET `/api/jobs/{id}/`

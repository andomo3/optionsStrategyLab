# API (Draft)

## Strategies
- `POST /api/strategies`
- `GET /api/strategies`
- `GET /api/strategies/{id}`
- `POST /api/strategies/{id}/legs`
- `PUT /api/strategies/{id}/legs/{leg_id}`
- `DELETE /api/strategies/{id}/legs/{leg_id}`

## Pricing (Sync)
- `POST /api/strategies/{id}/price`
  - body: `{ as_of, model: "BS", overrides?: {...} }`
  - returns: `{ per_leg, totals, payoff_grid, metadata }`

## Risk (Async)
- `POST /api/strategies/{id}/risk`
  - body: `{ as_of, horizon_days, model, params, paths, seed }`
  - returns: `{ job_id }`
- `GET /api/risk/{run_id}`
  - returns: `{ pop, exp_pnl, var, cvar, distribution_ref, params, seed }`

## Jobs
- `GET /api/jobs/{job_id}`

# Data Model Draft

## Strategy
- id
- name
- created_at
- legs (one-to-many)

## StrategyLeg
- id
- strategy_id
- name
- created_at

## Future entities (placeholders)
- MarketDataSnapshot
- PricingRun
- RiskScenario
- MonteCarloJob

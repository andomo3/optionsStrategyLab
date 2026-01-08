# Data Model Draft

## Core entities
### Strategy
- id
- name
- owner_id (nullable)
- created_at

### StrategyLeg
- id
- strategy_id (FK to Strategy)
- right (call/put)
- strike (nullable)
- expiry (nullable)
- quantity
- created_at

### PricingRun
- id
- strategy_id (FK to Strategy)
- created_at

### RiskScenario
- id
- name
- created_at

### StressTestResult (associative entity)
- id
- strategy_id (FK to Strategy)
- risk_scenario_id (FK to RiskScenario)
- created_at

## Relationships and constraints
- Strategy -> StrategyLeg is 1:N with mandatory participation on the leg side.
- Strategy -> PricingRun is 1:N with optional participation on Strategy, mandatory on PricingRun.
- Strategy -> StressTestResult is 1:N with optional participation on Strategy, mandatory on StressTestResult.
- RiskScenario -> StressTestResult is 1:N with optional participation on RiskScenario, mandatory on StressTestResult.

## Future entities (placeholders)
- MarketDataSnapshot
- MonteCarloJob

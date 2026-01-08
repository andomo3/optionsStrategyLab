# System Design

## Architecture overview
This scaffold separates concerns across presentation, content, services, and infrastructure layers.

- Presentation: Next.js app router pages, Django REST endpoints.
- Content: Django apps organized by domain (strategies, market_data, pricing, risk, jobs, users).
- Services: `services/` modules per app for business logic stubs.
- Infrastructure: env-driven settings, Redis cache, Celery worker stubs.

## Two-tier compute pattern
- Tier 1: Request-response APIs for fast data access and UI rendering.
- Tier 2: Background job queue for heavy computations (Celery), reserved for Monte Carlo and batch tasks.

## Caching plan
- Redis configured as the default cache backend.
- Strategy and pricing queries should be cacheable by request parameters.
- Cache invalidation will be tied to strategy edits and market data updates.

## Observability hooks
- Environment variable placeholders for future Sentry integration.
- Structured logging and tracing to be added in later phases.
 - Log output via stdout for container aggregation.

## Auth
- JWT is the primary API auth mechanism.
- Legacy session/token endpoints are retained for admin-only or transitional use.

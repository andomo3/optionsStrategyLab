# Deploy Checklist

- DEBUG is set to False
- SECRET_KEY, JWT_SECRET configured in environment
- ALLOWED_HOSTS, CSRF_TRUSTED_ORIGINS, CORS_ALLOWED_ORIGINS set for prod domains
- Database migrations applied on deploy
- Redis cache reachable (REDIS_URL / CELERY_BROKER_URL / CELERY_RESULT_BACKEND)
- Celery worker running
- Monitoring enabled (SENTRY_DSN optional)
- Log aggregation configured (stdout/centralized)
- Backups plan documented for Postgres

## Render (backend + worker)
- Set `DJANGO_SETTINGS_MODULE=config.settings.prod`
- Configure DB env vars (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`)
- Configure Redis env vars (`REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`)
- Run `python backend/manage.py migrate` on deploy

## Vercel (frontend)
- Set `NEXT_PUBLIC_API_BASE_URL` to the Render API URL
- Ensure build succeeds without backend availability (client-side fetch only)

## Demo mode
- Run `python backend/manage.py seed_demo`
- Optional: set `DEMO_USERNAME` and `DEMO_PASSWORD` via env

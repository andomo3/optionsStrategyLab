# Demo Script (2 minutes)

1) Start the stack
- `docker-compose -f infra/docker-compose.yml up --build`

2) Seed demo data
- `docker compose --env-file .env -f infra/docker-compose.yml exec backend python manage.py seed_demo`

3) Open the UI
- Visit `http://localhost:3000`
- Go to `Strategies` and click “Recruiter Mode” (or log in as the demo user).

4) Show the workflow
- Select a demo strategy
- Update spot/IV and show pricing + payoff
- Run a risk simulation and highlight POP, VaR, and histogram

## Demo credentials
- Username: `demo`
- Password: `demo1234`

Update credentials via `.env` using `DEMO_USERNAME` / `DEMO_PASSWORD`.

#!/usr/bin/env sh
set -e

docker compose -f infra/docker-compose.yml down -v

docker compose -f infra/docker-compose.yml up -d --build

docker compose -f infra/docker-compose.yml exec backend python manage.py migrate

echo "Run 'docker compose -f infra/docker-compose.yml exec backend python manage.py createsuperuser' if needed."

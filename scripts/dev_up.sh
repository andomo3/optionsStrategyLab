#!/usr/bin/env sh
set -e

docker compose -f infra/docker-compose.yml up --build

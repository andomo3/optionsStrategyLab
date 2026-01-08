#!/usr/bin/env sh
set -e

python -m pytest -q

cd frontend
npm run build

#!/usr/bin/env sh
set -e

python -m black backend
python -m isort backend

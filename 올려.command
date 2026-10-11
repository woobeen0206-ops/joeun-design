#!/bin/bash
set -e
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$ROOT_DIR/infra/scripts/release-and-deploy.sh"

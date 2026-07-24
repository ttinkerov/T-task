#!/bin/sh
set -e
mkdir -p /app/uploads
chown -R nestjs:nodejs /app/uploads 2>/dev/null || true
exec su-exec nestjs:nodejs "$@"

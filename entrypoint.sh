#!/bin/sh
# entrypoint.sh

set -e

echo "Waiting for database..."

# Wait for database to be ready
until npx prisma db push --skip-generate 2>/dev/null || npx prisma migrate deploy 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is up - running migrations"
npx prisma migrate deploy

echo "Starting application"
exec "$@"
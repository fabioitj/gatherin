#!/bin/sh
set -e

echo "‚è≥ Aplicando migrations..."
npx prisma migrate deploy

echo "Ì∫Ä Iniciando aplica√ß√£o..."
exec "$@"

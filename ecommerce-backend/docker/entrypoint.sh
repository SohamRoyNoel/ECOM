#!/bin/sh
set -e

# ---------------------------------------------------------------------
# Wait for Postgres to accept connections before running migrations.
# Uses a plain TCP probe (via Node) so no extra OS packages (netcat,
# postgresql-client) are needed in the slim runtime image.
# ---------------------------------------------------------------------
echo "Waiting for database at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
node -e "
const net = require('net');
const host = process.env.DB_HOST || 'postgres';
const port = parseInt(process.env.DB_PORT || '5432', 10);
const deadline = Date.now() + 60000;

function tryConnect() {
  const socket = net.createConnection(port, host);
  socket.once('connect', () => { socket.end(); process.exit(0); });
  socket.once('error', () => {
    socket.destroy();
    if (Date.now() > deadline) {
      console.error('Timed out waiting for database.');
      process.exit(1);
    }
    setTimeout(tryConnect, 1000);
  });
}
tryConnect();
"
echo "Database is reachable."

# ---------------------------------------------------------------------
# Run migrations (schema + seed) on every startup, against the COMPILED
# data source (dist/database/data-source.js). The production image only
# installs runtime dependencies (`npm install --omit=dev`), so ts-node /
# the typeorm-ts-node-commonjs CLI used in local dev (`npm run migration:run`)
# aren't available here - we invoke the plain typeorm CLI directly against
# compiled JS instead. Migrations are idempotent (TypeORM tracks applied
# migrations in its own table), so this is safe to run on every restart.
# ---------------------------------------------------------------------
echo "Running database migrations..."
node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js

echo "Migrations complete. Starting application..."
exec "$@"

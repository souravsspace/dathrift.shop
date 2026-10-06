#!/usr/bin/env bash
# TEST ONLY: loads demo pieces and orders into the local D1 and their photos into local R2.
# Run after `bun run db:local:setup`. Safe to run again; existing rows are left alone.
set -euo pipefail
cd "$(dirname "$0")/../.."
wrangler d1 execute DB --local -c wrangler.jsonc --file db/seed/demo-orders.sql -y
images=(olive-shirt cream-dress denim-jacket)
for n in $(seq 1 36); do
	key=$(printf 'test-only/demo/%02d.webp' "$n")
	wrangler r2 object put "dathrift-local-products/$key" --local -c wrangler.jsonc \
		--content-type image/webp --file "db/seed/assets/${images[$(((n - 1) % 3))]}.webp" >/dev/null
done
echo "TEST ONLY demo pieces and orders loaded."

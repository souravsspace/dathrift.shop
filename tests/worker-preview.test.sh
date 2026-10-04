#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
port="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')"
log="$(mktemp)"
worker_pid=''

cleanup() {
	if test -n "$worker_pid"; then
		kill "$worker_pid" >/dev/null 2>&1 || true
		wait "$worker_pid" >/dev/null 2>&1 || true
	fi
	rm -f "$log"
}
trap cleanup EXIT

if ! bun run build >"$log" 2>&1; then
	tail -n 40 "$log" >&2
	exit 1
fi
if ! test -f .svelte-kit/cloudflare/_worker.js; then
	echo 'Cloudflare Worker entry is missing from the production build.' >&2
	exit 1
fi

WRANGLER_SEND_METRICS=false ./node_modules/.bin/wrangler dev --local --ip 127.0.0.1 --port "$port" >"$log" 2>&1 &
worker_pid=$!
for _ in {1..40}; do
	if curl --fail --silent "http://127.0.0.1:$port/" | grep -q '<h1>Welcome to SvelteKit</h1>'; then
		echo 'PASS: Cloudflare Worker preview serves the server-rendered home page.'
		exit 0
	fi
	if ! kill -0 "$worker_pid" 2>/dev/null; then
		break
	fi
	sleep 1
done

tail -n 40 "$log" >&2
echo 'Worker preview failed to serve the home page.' >&2
exit 1

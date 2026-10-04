#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
project="dathrift-durability-$$"
compose_file="pocketbase/compose.yaml"
port="${PB_TEST_PORT:-$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')}"
backup_dir="$(mktemp -d)"
restore_container="${project}-restore"
restore_volume="${project}_restored"
email="durability@example.invalid"
password="$(openssl rand -hex 24)"
compose=(docker compose -f "$compose_file" -p "$project")

cleanup() {
	docker rm -f "$restore_container" >/dev/null 2>&1 || true
	"${compose[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
	docker volume rm "$restore_volume" >/dev/null 2>&1 || true
	rm -rf "$backup_dir"
}
trap cleanup EXIT

wait_for_health() {
	for _ in {1..40}; do
		if curl --fail --silent "http://127.0.0.1:$port/api/health" >/dev/null; then
			return 0
		fi
		sleep 1
	done
	echo "PocketBase did not become healthy" >&2
	return 1
}

assert_auth() {
	curl --fail --silent --show-error \
		-H 'content-type: application/json' \
		--data "{\"identity\":\"$email\",\"password\":\"$password\"}" \
		"http://127.0.0.1:$port/api/collections/_superusers/auth-with-password" \
		| python3 -c 'import json,sys; assert json.load(sys.stdin).get("token")'
}

export PB_HOST_PORT="$port"
"${compose[@]}" build
"${compose[@]}" run --rm --no-deps pocketbase /pb/pocketbase superuser create "$email" "$password"
"${compose[@]}" up -d --no-build
wait_for_health
assert_auth

public_status="$(curl --silent --output /dev/null --write-out '%{http_code}' "http://127.0.0.1:$port/api/collections")"
test "$public_status" != 200
test "$("${compose[@]}" port pocketbase 8080)" = "127.0.0.1:$port"

"${compose[@]}" stop
"${compose[@]}" up -d --no-build
wait_for_health
assert_auth

"${compose[@]}" stop
docker run --rm -v "${project}_pb_data:/data:ro" -v "$backup_dir:/backup" alpine:3.22.1 \
	tar -C /data -czf /backup/pb_data.tar.gz .
docker volume create "$restore_volume" >/dev/null
docker run --rm -v "$restore_volume:/data" -v "$backup_dir:/backup:ro" alpine:3.22.1 \
	tar -C /data -xzf /backup/pb_data.tar.gz
image="$("${compose[@]}" images -q pocketbase)"
docker run -d --name "$restore_container" -p "127.0.0.1:$port:8080" \
	-v "$restore_volume:/pb/pb_data" "$image" >/dev/null
wait_for_health
assert_auth

echo "PASS: PocketBase data survives restart and restores into an isolated volume; privileged API is not public."

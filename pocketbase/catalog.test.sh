#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
project="dathrift-catalog-$$"
port="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')"
email='catalog@example.invalid'
password="$(openssl rand -hex 24)"
compose=(docker compose -f pocketbase/compose.yaml -p "$project")
base="http://127.0.0.1:$port/api/collections/products/records"

cleanup() {
	"${compose[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

export PB_HOST_PORT="$port"
"${compose[@]}" build >/dev/null
"${compose[@]}" run --rm --no-deps pocketbase /pb/pocketbase superuser create "$email" "$password" >/dev/null
"${compose[@]}" up -d --no-build >/dev/null

for _ in {1..40}; do
	if curl --fail --silent "http://127.0.0.1:$port/api/health" >/dev/null; then
		break
	fi
	sleep 1
done
curl --fail --silent --show-error "http://127.0.0.1:$port/api/health" >/dev/null

token="$(curl --fail --silent --show-error \
	-H 'content-type: application/json' \
	--data "{\"identity\":\"$email\",\"password\":\"$password\"}" \
	"http://127.0.0.1:$port/api/collections/_superusers/auth-with-password" \
	| python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')"

create_product() {
	curl --fail --silent --show-error \
		-H "Authorization: $token" -H 'content-type: application/json' \
		--data "$1" "$base" \
		| python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])'
}

available_id="$(create_product '{"slug":"published-piece","title":"Published piece","description":"Vintage cotton shirt with a repaired cuff.","price_taka":1800,"published":true,"stock_state":"available","reservation_ref":"private-hold"}')"
sold_id="$(create_product '{"slug":"sold-piece","title":"Sold piece","price_taka":1600,"published":true,"stock_state":"sold"}')"
draft_id="$(create_product '{"slug":"draft-piece","title":"Draft piece","price_taka":2000,"published":false,"stock_state":"available"}')"

curl --fail --silent --show-error "$base?perPage=20" \
	| python3 -c 'import json,sys; items=json.load(sys.stdin)["items"]; assert {r["slug"] for r in items} == {"published-piece", "sold-piece"}; assert all("reservation_ref" not in r and "reserved_until" not in r for r in items)'
curl --fail --silent --show-error "$base/$available_id" \
	| python3 -c 'import json,sys; item=json.load(sys.stdin); assert item["slug"] == "published-piece"; assert item["description"] == "Vintage cotton shirt with a repaired cuff."; assert "reservation_ref" not in item and "reserved_until" not in item'
curl --fail --silent --show-error "$base/$sold_id" \
	| python3 -c 'import json,sys; assert json.load(sys.stdin)["stock_state"] == "sold"'
test "$(curl --silent --output /dev/null --write-out '%{http_code}' "$base/$draft_id")" = 404
test "$(curl --silent --output /dev/null --write-out '%{http_code}' -H 'content-type: application/json' --data '{"slug":"guest-write"}' "$base")" = 403
test "$(curl --silent --output /dev/null --write-out '%{http_code}' -X PATCH -H 'content-type: application/json' --data '{"price_taka":1}' "$base/$available_id")" = 403
test "$(curl --silent --output /dev/null --write-out '%{http_code}' -X DELETE "$base/$available_id")" = 403
test "$(curl --silent --output /dev/null --write-out '%{http_code}' -H "Authorization: $token" -H 'content-type: application/json' --data '{"slug":"fractional-price","title":"Invalid","price_taka":1.5,"published":true,"stock_state":"available"}' "$base")" = 400
test "$(curl --silent --output /dev/null --write-out '%{http_code}' -H "Authorization: $token" -H 'content-type: application/json' --data '{"slug":"published-piece","title":"Duplicate","price_taka":1800,"published":true,"stock_state":"available"}' "$base")" = 400

echo 'PASS: migration exposes published and sold products, hides drafts/private fields, blocks guest writes, and validates price/slug.'

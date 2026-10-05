# Phase 1 — Cloudflare durability and private-access proof

**Status:** incomplete. Old local PocketBase and Worker preview tests are not proof of the new remote D1/R2 architecture.

## Working evidence (2026-10-05; not an exit-gate pass)

- Git: started clean at `cdfc778`, 11 local commits ahead of `origin/main`. Phase 1 changes remain local; no push or Worker deployment.
- Confirmed Cloudflare account: `ec8d4a8a8415976daf6f8479a89aa529`. Read-only Access identity-provider listing returned `[]`; Google sign-in is not configured. Google-side OAuth app creation still needs separate owner approval.
- Isolated D1 primary test: `dathrift-phase1-primary-test` (`15af6bbd-631f-48e5-80f8-de382d626b50`), created with `--location apac`. `SELECT id, value FROM phase1_markers LIMIT 1` failed with `no such table` before `db/phase1/0001_markers.sql`, then succeeded remotely after applying it. This is **not** Worker→D1 proof.
- Isolated D1 restore target: `dathrift-phase1-restore-test` (`bcb26d1a-1b12-4699-a6a0-20f8763ccdb7`), created with `--location apac`; the manual private-R2 import below succeeded, but no **scheduled** export has been restored.
- Private R2 backup bucket: `dathrift-phase1-d1-backups-test`. `r2.dev` access is disabled and no custom domains are attached. Enabled lifecycle rules are `hourly/` expiry after 2 days and `daily/` expiry after 30 days. Two disposable prefix test objects were uploaded, fetched, and removed; the Cloudflare object API did not expose an expiry timestamp, so actual expiration is not yet proven.
- Local test-first seams: `src/phase1/preview.spec.ts` (4 passing tests) and `src/phase1/backup.spec.ts` (3 passing tests, including failed-export rejection). `bun run check`, `bun run lint`, and a Wrangler **dry-run only** passed after setting `WRANGLER_LOG_PATH` to writable `/tmp` for the sandbox. The dedicated Worker/Workflow is not deployed, no scheduled export has run, and no failure alert has been observed.
- Waiting on private `.env.local` inputs and permissions: owner/moderator Google addresses, Google OAuth setup approval, an account-scoped D1 Read export token, and a verified owner-email alert path. Do not claim authenticated access, remote persistence, RPO, RTO, or Phase 1 completion until the remaining gates below are recorded.

### Manual R2 restore drill (2026-10-05 UTC; scheduled-backup gate still open)

1. Queried both approved test databases before the drill: marker `drill-20261005-0718` was absent from the primary; the restore target had no `phase1_markers` table. Inserted `('drill-20261005-0718', 'known-value-0718')` **only** into the primary via `wrangler d1 execute dathrift-phase1-primary-test --remote --command ...`. D1 recorded `created_at = 2026-10-05 07:19:20` UTC.
2. Ran `wrangler d1 export dathrift-phase1-primary-test --remote --skip-confirmation --output /tmp/dathrift-phase1-drill-20261005-0718.sql`; uploaded it to private R2 at `drills/manual-20261005-0718.sql` using `wrangler r2 object put ... --remote`, then retrieved it with `wrangler r2 object get ... --remote`. Both local files had SHA-256 `f71ec8ea1f1d869ea16c75faea004b4c95a36fc74b1c8a2c09d7cf8e140e04a1` and byte comparison passed. The SQL contained the known marker.
3. Incident declaration was recorded at **07:20:31 UTC**; import began immediately afterward with `wrangler d1 execute dathrift-phase1-restore-test --remote --file /tmp/dathrift-phase1-drill-from-r2-20261005-0718.sql`. A remote query confirmed the marker, its value and timestamp in the **restore target** by **07:21:30 UTC**. Both databases had one row and identical `phase1_markers` schema. The primary was not overwritten.
4. Conservative drill **RPO upper bound = 07:20:31 − 07:19:20 = 71 seconds** using the latest verified recoverable row timestamp. **RTO upper bound = 07:21:30 − 07:20:31 = 59 seconds** from declaration to usable restored data. These measurements meet the numerical targets for this **manual** drill only; they do **not** prove the required scheduled-backup recovery point.
5. Cleanup: deleted only `drills/manual-20261005-0718.sql` and both temporary local SQL files; bucket info showed zero objects. The restored nonproduction D1 remains available for comparison. No production resources changed.

Core drill commands (run with repository-local Wrangler; the signed D1 download URL was intentionally not retained):

```sh
./node_modules/.bin/wrangler d1 execute dathrift-phase1-primary-test --remote --command "INSERT INTO phase1_markers (id, value) VALUES ('drill-20261005-0718', 'known-value-0718')"
./node_modules/.bin/wrangler d1 export dathrift-phase1-primary-test --remote --skip-confirmation --output /tmp/dathrift-phase1-drill-20261005-0718.sql
./node_modules/.bin/wrangler r2 object put dathrift-phase1-d1-backups-test/drills/manual-20261005-0718.sql --file /tmp/dathrift-phase1-drill-20261005-0718.sql --remote --force
./node_modules/.bin/wrangler r2 object get dathrift-phase1-d1-backups-test/drills/manual-20261005-0718.sql --file /tmp/dathrift-phase1-drill-from-r2-20261005-0718.sql --remote
shasum -a 256 /tmp/dathrift-phase1-drill-from-r2-20261005-0718.sql
./node_modules/.bin/wrangler d1 execute dathrift-phase1-restore-test --remote --file /tmp/dathrift-phase1-drill-from-r2-20261005-0718.sql
./node_modules/.bin/wrangler d1 execute dathrift-phase1-restore-test --remote --command "SELECT id, value, created_at FROM phase1_markers WHERE id = 'drill-20261005-0718'"
./node_modules/.bin/wrangler r2 object delete dathrift-phase1-d1-backups-test/drills/manual-20261005-0718.sql --remote
```

## Why PocketBase/Containers is retired

The owner chose Cloudflare-only hosting, but [Container writable disks are ephemeral](https://developers.cloudflare.com/containers/faq/) across sleep/replacement, [snapshots](https://developers.cloudflare.com/containers/guides/snapshots/) are point-in-time and time-limited, and [R2 FUSE lacks full POSIX semantics](https://developers.cloudflare.com/containers/examples/r2-fuse-mount/). A live PocketBase SQLite database cannot safely use those as its payment/inventory primary. D1 is the single primary; R2 holds separate backups. D1 Time Travel is additional recovery, not an independent R2 export or a non-destructive clone. R2 remains in the same Cloudflare account, so this is not cross-provider disaster recovery. [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)

## Authorized nonproduction resources only

The owner authorized two isolated D1 databases (primary test and restore target) with the `apac` **location hint**, one private R2 backup bucket, one nonproduction Worker preview, and one isolated scheduled backup Workflow/trigger attached to it. The hint is advisory, not a country/city residency guarantee. The current Cloudflare account is confirmed. No production database, product-image bucket, storefront deployment, bKash integration or checkout is authorized by this resource approval. [D1 locations](https://developers.cloudflare.com/d1/configuration/data-location/)

## Test-first slices and exit evidence

1. **Remote persistence and write isolation:** state the Worker HTTP seam, write a failing test, then bind a disposable remote D1 database. Write/read a unique marker through the preview and prove it survives a fresh Worker instance/version. Anonymous/public requests cannot write data. Do not ship the probe route in the storefront.
2. **Authenticated HTTPS:** first inspect whether Google is already configured as a Cloudflare Zero Trust identity provider. [Cloudflare's Google IdP setup](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/google/) supports personal Google accounts but otherwise needs a separate Google OAuth client/secret; creating that Google-side app requires fresh owner approval. Protect the preview/admin probe with Cloudflare Access. Exact owner and moderator Google emails are provided privately, not printed in Git/chat. Require **independent Access MFA** because Cloudflare does not enforce Google's IdP-reported MFA. Deny anonymous and non-allowlisted requests, including alternate preview/`workers.dev` URLs; validate identity in Worker code too. Owner and moderator each complete their own sign-in/MFA, with no password or code shared with the agent. [Worker Access protection](https://developers.cloudflare.com/workers/configuration/cloudflare-access/) · [MFA](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/independent-mfa/)
3. **Scheduled backup:** export remote D1 to the private R2 bucket at least hourly; retain hourly copies for 48 hours and daily copies for 30 days. Observe an actual scheduled export, not just a manual run. Verify retention rules with test objects/clock-controlled pruning rather than waiting 30 days. Monitor age/failure and prove a stale/failed run alerts the owner's email configured privately in Cloudflare. [D1 export to R2](https://developers.cloudflare.com/d1/reference/time-travel/#export-d1-into-r2-using-workflows)
4. **Isolated recovery:** import one R2 export into the second D1 database. Compare schema and known records/checksums. Record the simulated incident time, latest recoverable data timestamp, restore start/end and usable restored-data time. **RPO = incident time minus latest recoverable data time ≤1 hour; RTO = incident declaration through usable restored data ≤4 hours.** Never overwrite the primary for the drill.
5. **Document and stop:** record exact commands, tests, timestamps, resource IDs (not secrets), negative access results, backup/alert evidence, restore integrity and cleanup/rollback procedure. Keep Phase 1 **incomplete** if any result is missing. Do not enable checkout.

## Recovery operating rule

After any restore or uncertain outage, pause checkout and reconcile bKash transactions against orders before reopening; periodic backups cannot promise zero lost orders. Separate dev/staging/production bindings and secrets before any production release.

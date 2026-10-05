// Runs the reservation race on the real D1 engine (local workerd), not the SQLite stand-in.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { getPlatformProxy } from 'wrangler';
import type { D1Database } from '@cloudflare/workers-types';
import { markSoldExternally } from '../catalog/external-sale';
import { database } from '../db/client';
import { reserveCheckout } from './reserve';

let state: string;
let proxy: Awaited<ReturnType<typeof getPlatformProxy>>;
let d1: D1Database;

beforeAll(async () => {
	state = mkdtempSync(join(tmpdir(), 'dathrift-d1-'));
	const wrangler = (...args: string[]) =>
		execFileSync(
			'npx',
			['wrangler', ...args, '--local', '--persist-to', state, '-c', 'wrangler.jsonc'],
			{
				env: { ...process.env, CI: '1' },
				stdio: 'pipe'
			}
		);
	wrangler('d1', 'migrations', 'apply', 'DB');
	wrangler('d1', 'execute', 'DB', '--file', 'db/seed/local.sql', '-y');
	proxy = await getPlatformProxy({
		configPath: 'wrangler.jsonc',
		persist: { path: join(state, 'v3') },
		remoteBindings: false
	});
	d1 = (proxy.env as { DB: D1Database }).DB;
}, 120_000);

afterAll(async () => {
	await proxy?.dispose();
	rmSync(state, { recursive: true, force: true });
});

const address = {
	name: 'Test Buyer',
	phone: '01712345678',
	line1: 'Test building',
	district: 'test-dhaka',
	area: 'test-central'
};

it('lets exactly one of many concurrent checkouts hold a shared one-off piece', async () => {
	const db = database(d1);
	const attempts = await Promise.allSettled(
		Array.from({ length: 8 }, (_, index) =>
			reserveCheckout(db, index % 2 ? ['test-shirt', 'test-dress'] : ['test-shirt'], address, true)
		)
	);
	expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
	const orders = await d1.prepare('SELECT count(*) AS n FROM orders').first<{ n: number }>();
	expect(orders?.n).toBe(1);
	const held = await d1
		.prepare("SELECT count(*) AS n FROM inventory WHERE state = 'reserved'")
		.first<{ n: number }>();
	const winner = attempts.find(
		(attempt) => attempt.status === 'fulfilled'
	) as PromiseFulfilledResult<Awaited<ReturnType<typeof reserveCheckout>>>;
	expect(held?.n).toBe(winner.value.subtotal_bdt === 850 ? 1 : 2);
});

it('never lets an external sale and a checkout both take the same piece', async () => {
	const db = database(d1);
	await d1.prepare("UPDATE inventory SET state = 'available' WHERE product_id = 'test-sold'").run();
	await d1
		.prepare("UPDATE products SET publication_state = 'published' WHERE id = 'test-sold'")
		.run();
	const [sale, checkout] = await Promise.allSettled([
		markSoldExternally(db, 'test-sold', 'staff@example.com', 'Sold at a market'),
		reserveCheckout(db, ['test-sold'], address, true)
	]);
	expect([sale.status, checkout.status].filter((status) => status === 'fulfilled')).toHaveLength(1);
	const unit = await d1
		.prepare("SELECT state FROM inventory WHERE product_id = 'test-sold'")
		.first<{ state: string }>();
	expect(unit?.state).toBe(sale.status === 'fulfilled' ? 'sold' : 'reserved');
});

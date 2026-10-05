import { expect, it, vi } from 'vitest';
import { localD1 } from '../lib/server/testing/local-d1';
import worker from './preview';

const binding = (value: unknown) => value as Parameters<typeof worker.fetch>[1]['DB'];

it('denies anonymous marker writes before touching D1', async () => {
	const prepare = vi.fn();
	const response = await worker.fetch(
		new Request('https://foundation-dev.dathrift.shop/__foundation/markers', {
			method: 'POST',
			body: JSON.stringify({ id: 'probe-1', value: 'persisted' })
		}),
		{
			DB: binding({ prepare }),
			ALLOWED_HOST: 'foundation-dev.dathrift.shop',
			STAFF_EMAILS: 'owner@example.com'
		},
		{}
	);

	expect(response.status).toBe(403);
	expect(prepare).not.toHaveBeenCalled();
});

it('writes and reads a marker for an allowlisted Access identity', async () => {
	const db = localD1({ seed: false, migrations: 'db/foundation' }).db;
	const env = {
		DB: binding(db),
		ALLOWED_HOST: 'foundation-dev.dathrift.shop',
		STAFF_EMAILS: 'owner@example.com'
	};
	const ctx = { access: { getIdentity: async () => ({ email: 'owner@example.com' }) } };
	const write = await worker.fetch(
		new Request('https://foundation-dev.dathrift.shop/__foundation/markers', {
			method: 'POST',
			body: JSON.stringify({ id: 'probe-1', value: 'persisted' })
		}),
		env,
		ctx
	);
	const read = await worker.fetch(
		new Request('https://foundation-dev.dathrift.shop/__foundation/markers/probe-1'),
		env,
		ctx
	);

	expect(write.status).toBe(201);
	expect(read.status).toBe(200);
	expect(await read.json()).toEqual({ id: 'probe-1', value: 'persisted' });
});

it('denies writes when the staff allowlist secret is missing', async () => {
	const prepare = vi.fn();
	const response = await worker.fetch(
		new Request('https://foundation-dev.dathrift.shop/__foundation/markers', {
			method: 'POST',
			body: JSON.stringify({ id: 'probe-2', value: 'must-not-write' })
		}),
		{
			DB: binding({ prepare }),
			ALLOWED_HOST: 'foundation-dev.dathrift.shop',
			STAFF_EMAILS: undefined
		},
		{ access: { getIdentity: async () => ({ email: 'owner@example.com' }) } }
	);

	expect(response.status).toBe(403);
	expect(prepare).not.toHaveBeenCalled();
});

it('denies an alternate hostname and a non-allowlisted Access identity', async () => {
	const prepare = vi.fn();
	const env = {
		DB: binding({ prepare }),
		ALLOWED_HOST: 'foundation-dev.dathrift.shop',
		STAFF_EMAILS: 'owner@example.com'
	};
	const request = (host: string) =>
		new Request(`https://${host}/__foundation/markers`, {
			method: 'POST',
			body: JSON.stringify({ id: 'probe-3', value: 'must-not-write' })
		});
	const owner = { access: { getIdentity: async () => ({ email: 'owner@example.com' }) } };
	const stranger = { access: { getIdentity: async () => ({ email: 'stranger@example.com' }) } };

	expect((await worker.fetch(request('alternate.workers.dev'), env, owner)).status).toBe(404);
	expect((await worker.fetch(request('foundation-dev.dathrift.shop'), env, stranger)).status).toBe(
		403
	);
	expect(prepare).not.toHaveBeenCalled();
});

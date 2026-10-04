import { expect, it, vi } from 'vitest';
import worker from './preview';

it('denies anonymous marker writes before touching D1', async () => {
	const prepare = vi.fn();
	const response = await worker.fetch(
		new Request('https://phase1.dathrift.shop/__phase1/markers', {
			method: 'POST',
			body: JSON.stringify({ id: 'probe-1', value: 'persisted' })
		}),
		{ DB: { prepare }, ALLOWED_HOST: 'phase1.dathrift.shop', STAFF_EMAILS: 'owner@example.com' },
		{}
	);

	expect(response.status).toBe(403);
	expect(prepare).not.toHaveBeenCalled();
});

it('writes and reads a marker for an allowlisted Access identity', async () => {
	const markers = new Map<string, string>();
	const db = {
		prepare: (query: string) => ({
			bind: (id: string, value?: string) => ({
				run: async () => {
					if (!query.startsWith('INSERT')) throw new Error('Unexpected write');
					markers.set(id, value ?? '');
				},
				first: async () => {
					if (!query.startsWith('SELECT')) throw new Error('Unexpected read');
					return markers.has(id) ? { value: markers.get(id)! } : null;
				}
			})
		})
	};
	const env = { DB: db, ALLOWED_HOST: 'phase1.dathrift.shop', STAFF_EMAILS: 'owner@example.com' };
	const ctx = { access: { getIdentity: async () => ({ email: 'owner@example.com' }) } };
	const write = await worker.fetch(
		new Request('https://phase1.dathrift.shop/__phase1/markers', {
			method: 'POST',
			body: JSON.stringify({ id: 'probe-1', value: 'persisted' })
		}),
		env,
		ctx
	);
	const read = await worker.fetch(
		new Request('https://phase1.dathrift.shop/__phase1/markers/probe-1'),
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
		new Request('https://phase1.dathrift.shop/__phase1/markers', {
			method: 'POST',
			body: JSON.stringify({ id: 'probe-2', value: 'must-not-write' })
		}),
		{
			DB: { prepare },
			ALLOWED_HOST: 'phase1.dathrift.shop',
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
		DB: { prepare },
		ALLOWED_HOST: 'phase1.dathrift.shop',
		STAFF_EMAILS: 'owner@example.com'
	};
	const request = (host: string) =>
		new Request(`https://${host}/__phase1/markers`, {
			method: 'POST',
			body: JSON.stringify({ id: 'probe-3', value: 'must-not-write' })
		});
	const owner = { access: { getIdentity: async () => ({ email: 'owner@example.com' }) } };
	const stranger = { access: { getIdentity: async () => ({ email: 'stranger@example.com' }) } };

	expect((await worker.fetch(request('alternate.workers.dev'), env, owner)).status).toBe(404);
	expect((await worker.fetch(request('phase1.dathrift.shop'), env, stranger)).status).toBe(403);
	expect(prepare).not.toHaveBeenCalled();
});

import { env } from 'cloudflare:workers';
import { afterEach, expect, it, vi } from 'vitest';
import { localD1 } from '../../lib/server/testing/local-d1';
import { load } from './+page.server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
	vi.unstubAllEnvs();
});

const event = () => ({ setHeaders: vi.fn() }) as unknown as Parameters<typeof load>[0];

it('offers server-maintained areas and enables payment only with a configured provider', async () => {
	await expect(load(event())).rejects.toMatchObject({ status: 503 });
	(env as { DB?: unknown }).DB = localD1().db;
	expect(await load(event())).toEqual({
		checkout_enabled: true,
		areas: [
			{
				district: 'test-dhaka',
				area: 'test-central',
				name: 'TEST ONLY — Central area',
				fee_bdt: 80
			},
			{ district: 'test-other', area: 'test-town', name: 'TEST ONLY — Other town', fee_bdt: 130 }
		]
	});
	vi.stubEnv('DEV', false);
	expect(await load(event())).toEqual({ checkout_enabled: false, areas: [] });
});

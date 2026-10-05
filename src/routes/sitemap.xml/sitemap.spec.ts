import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../lib/server/testing/local-d1';
import { GET } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

it('serves XML without test fixtures and fails closed without D1', async () => {
	expect((await GET({} as Parameters<typeof GET>[0])).status).toBe(503);
	(env as { DB?: unknown }).DB = localD1().db;
	const response = await GET({} as Parameters<typeof GET>[0]);
	expect(response.status).toBe(200);
	expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
	const xml = await response.text();
	expect(xml).toContain('<loc>https://dathrift.shop/</loc>');
	expect(xml).not.toContain('test-');
});

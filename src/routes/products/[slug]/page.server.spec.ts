import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../lib/server/testing/local-d1';
import { load } from './+page.server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

it('does not turn missing D1 into an indexable empty product', async () => {
	await expect(
		load({ params: { slug: 'test-item' } } as Parameters<typeof load>[0])
	).rejects.toMatchObject({
		status: 503
	});
});

it('returns 404 for a draft and a sold product detail for a published slug', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const event = (slug: string) => ({ params: { slug } }) as Parameters<typeof load>[0];
	await expect(load(event('test-unpublished-skirt'))).rejects.toMatchObject({ status: 404 });
	expect(await load(event('test-sold-denim-jacket'))).toMatchObject({
		product: { stock_state: 'sold' }
	});
});

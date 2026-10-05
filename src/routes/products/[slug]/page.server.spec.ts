import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
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
	(env as { DB?: unknown }).DB = {
		prepare: () => ({
			bind: (slug: string) => ({
				first: async () =>
					slug === 'sold-item'
						? {
								id: 'test-sold',
								slug,
								name: 'TEST ONLY — Sold jacket',
								category: 'outerwear',
								price_bdt: 1750,
								stock_state: 'sold',
								measurements_json: '{"chest_cm":108,"length_cm":66}',
								photos_json: '[]'
							}
						: null
			})
		})
	};
	const event = (slug: string) => ({ params: { slug } }) as Parameters<typeof load>[0];
	await expect(load(event('draft-item'))).rejects.toMatchObject({ status: 404 });
	expect(await load(event('sold-item'))).toMatchObject({ product: { stock_state: 'sold' } });
});

import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { load } from './+page.server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

it('fails closed when the product database is unavailable', async () => {
	await expect(load({} as Parameters<typeof load>[0])).rejects.toMatchObject({ status: 503 });
});

it('loads only the server-selected catalog rows for storefront rendering', async () => {
	(env as { DB?: unknown }).DB = {
		prepare: () => ({
			all: async () => ({
				results: [
					{
						id: 'test-shirt',
						slug: 'test-olive-cotton-shirt',
						name: 'TEST ONLY — Olive cotton shirt',
						category: 'tops',
						price_bdt: 850,
						stock_state: 'available',
						size_label: 'L',
						condition_notes: 'Light fading at cuffs',
						photo_key: 'test-only/olive-shirt.webp',
						photo_alt: 'Olive shirt'
					}
				]
			})
		})
	};
	expect(await load({} as Parameters<typeof load>[0])).toMatchObject({
		products: [{ slug: 'test-olive-cotton-shirt', stock_state: 'available' }]
	});
});

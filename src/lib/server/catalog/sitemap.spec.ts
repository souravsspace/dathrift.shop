import { expect, it } from 'vitest';
import { localDatabase } from '../testing/local-d1';
import { sitemapEntries, sitemapXml } from './sitemap';

it('lists indexable published pieces, including sold ones, with their real change time', async () => {
	const { db, sqlite } = localDatabase();
	sqlite.exec(`INSERT INTO products (id, slug, name, category, price_bdt, publication_state, created_at)
		VALUES ('real-1', 'linen-shirt', 'Linen shirt', 'tops', 900, 'published', '2026-09-01 08:00:00'),
		       ('real-2', 'wool-coat', 'Wool coat', 'outerwear', 2500, 'published', '2026-09-02 08:00:00'),
		       ('real-3', 'silk-skirt', 'Silk skirt', 'bottoms', 1200, 'draft', '2026-09-03 08:00:00');
		INSERT INTO inventory (product_id, state) VALUES ('real-1', 'available'), ('real-2', 'available'),
		       ('real-3', 'available');`);
	expect((await sitemapEntries(db)).map((entry) => entry.path)).toEqual([
		'/',
		'/shop',
		'/shop/outerwear',
		'/shop/tops',
		'/products/linen-shirt',
		'/products/wool-coat'
	]);
	sqlite.exec("UPDATE inventory SET state = 'sold' WHERE product_id = 'real-2'");
	const coat = (await sitemapEntries(db)).find((entry) => entry.path === '/products/wool-coat');
	expect(coat?.lastmod).not.toBe('2026-09-02');
	expect(coat?.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	const xml = sitemapXml([{ path: '/products/a&b', lastmod: '2026-09-01' }]);
	expect(xml).toContain('<loc>https://dathrift.shop/products/a&amp;b</loc>');
	expect(xml).toContain('<lastmod>2026-09-01</lastmod>');
});

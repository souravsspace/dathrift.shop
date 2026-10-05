import { localDatabase } from '../testing/local-d1';
import { expect, it } from 'vitest';
import {
	browseFiltersFrom,
	getPublicProduct,
	isPublishedPhoto,
	listPublicProducts,
	publicFacets
} from './public-catalog';

it('hides drafts but keeps sold published products readable without private fields', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: false });
	db.exec(`
		INSERT INTO products (id, slug, name, category, price_bdt, publication_state)
		VALUES ('draft-1', 'draft', 'Private draft', 'tops', 900, 'draft'),
		       ('sold-1', 'sold', 'Published sold piece', 'dresses', 1400, 'published');
		INSERT INTO inventory (product_id, state)
		VALUES ('draft-1', 'available'), ('sold-1', 'sold');
	`);

	expect(await getPublicProduct(d1, 'draft')).toBeNull();
	expect(await getPublicProduct(d1, 'sold')).toEqual({
		id: 'sold-1',
		slug: 'sold',
		name: 'Published sold piece',
		category: 'dresses',
		category_name: 'Dresses',
		price_bdt: 1400,
		stock_state: 'sold'
	});

	db.close();
});

it('lists only published stock with first-photo metadata and durable sold state', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: true });
	const items = await listPublicProducts(d1);
	expect(items).toHaveLength(3);
	expect(items.map((item) => item.slug).sort()).toEqual([
		'test-cream-midi-dress',
		'test-olive-cotton-shirt',
		'test-sold-denim-jacket'
	]);
	expect(items.find((item) => item.slug === 'test-sold-denim-jacket')).toMatchObject({
		stock_state: 'sold',
		photo_key: 'test-only/denim-jacket.webp',
		photo_alt: 'Generated test-only denim jacket visual'
	});
	expect(items.every((item) => !('measurements_json' in item))).toBe(true);
	db.close();
});

it('serves photo keys only for published garments', async () => {
	const { db } = localDatabase();
	expect(await isPublishedPhoto(db, 'test-only/olive-shirt.webp')).toBe(true);
	expect(await isPublishedPhoto(db, 'test-only/unpublished-skirt.svg')).toBe(false);
	expect(await isPublishedPhoto(db, 'test-only/missing.webp')).toBe(false);
});

it('parses only known browse filters from the query string', () => {
	expect(browseFiltersFrom(new URLSearchParams(''))).toEqual({ filters: {}, active: false });
	expect(
		browseFiltersFrom(
			new URLSearchParams('category=tops&size=L&max_price=1000&available=1&utm_source=x')
		)
	).toEqual({
		filters: { category: 'tops', size: 'L', maxPrice: 1000, availableOnly: true },
		active: true
	});
	expect(
		browseFiltersFrom(new URLSearchParams('category=Sh%20oes&size=<b>&max_price=-5&available=yes'))
	).toEqual({ filters: {}, active: true });
});

it('filters published stock by category, size, price and availability, newest first', async () => {
	const { db, sqlite } = localDatabase();
	sqlite.exec("UPDATE products SET created_at = '2026-01-01' WHERE id = 'test-shirt'");
	sqlite.exec("UPDATE products SET created_at = '2026-02-01' WHERE id = 'test-dress'");
	sqlite.exec("UPDATE products SET created_at = '2026-03-01' WHERE id = 'test-sold'");
	const slugs = async (filters: Parameters<typeof listPublicProducts>[1]) =>
		(await listPublicProducts(db, filters)).map((item) => item.slug);
	expect(await slugs({})).toEqual([
		'test-sold-denim-jacket',
		'test-cream-midi-dress',
		'test-olive-cotton-shirt'
	]);
	expect(await slugs({ availableOnly: true })).toEqual([
		'test-cream-midi-dress',
		'test-olive-cotton-shirt'
	]);
	expect(await slugs({ category: 'tops' })).toEqual(['test-olive-cotton-shirt']);
	expect(await slugs({ size: 'M' })).toEqual(['test-sold-denim-jacket', 'test-cream-midi-dress']);
	expect(await slugs({ maxPrice: 1000 })).toEqual(['test-olive-cotton-shirt']);
	expect(await publicFacets(db)).toEqual({
		categories: [
			{ slug: 'dresses', name: 'Dresses' },
			{ slug: 'outerwear', name: 'Outerwear' },
			{ slug: 'tops', name: 'Tops' }
		],
		sizes: ['L', 'M']
	});
});

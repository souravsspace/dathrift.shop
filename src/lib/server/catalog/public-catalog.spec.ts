import { localDatabase } from '../testing/local-d1';
import { expect, it } from 'vitest';
import {
	browseFiltersFrom,
	getPublicProduct,
	browsePageFrom,
	countPublicProducts,
	isPublishedPhoto,
	listPublicProducts,
	publicFacets,
	sortSizes
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
			new URLSearchParams(
				'category=tops&size=L&size=M&min_price=500&max_price=1000&available=1&utm_source=x'
			)
		)
	).toEqual({
		filters: {
			category: 'tops',
			sizes: ['L', 'M'],
			minPrice: 500,
			maxPrice: 1000,
			availableOnly: true
		},
		active: true
	});
	expect(
		browseFiltersFrom(
			new URLSearchParams(
				'q=%20Olive%20shirt%20&sort=price-asc&chest_min=38&chest_max=42.5&waist_min=28&waist_max=32'
			)
		)
	).toEqual({
		filters: {
			query: 'Olive shirt',
			sort: 'price-asc',
			chestMin: 38,
			chestMax: 42.5,
			waistMin: 28,
			waistMax: 32
		},
		active: true
	});
	expect(
		browseFiltersFrom(
			new URLSearchParams(
				'category=Sh%20oes&size=<b>&max_price=-5&available=yes&sort=random&chest_min=abc&q=%20%20'
			)
		)
	).toEqual({ filters: {}, active: true });
	expect(browseFiltersFrom(new URLSearchParams('page=2')).active).toBe(true);
	expect(browseFiltersFrom(new URLSearchParams(`q=${'a'.repeat(200)}`)).filters.query).toHaveLength(
		80
	);
});

it('reads a positive page number and falls back to the first page', () => {
	expect(browsePageFrom(new URLSearchParams(''))).toBe(1);
	expect(browsePageFrom(new URLSearchParams('page=3'))).toBe(3);
	expect(browsePageFrom(new URLSearchParams('page=0'))).toBe(1);
	expect(browsePageFrom(new URLSearchParams('page=x'))).toBe(1);
	expect(browsePageFrom(new URLSearchParams('page=999'))).toBe(50);
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
	expect(await slugs({ sizes: ['M'] })).toEqual([
		'test-sold-denim-jacket',
		'test-cream-midi-dress'
	]);
	expect(await slugs({ sizes: ['L', 'M'] })).toHaveLength(3);
	expect(await slugs({ maxPrice: 1000 })).toEqual(['test-olive-cotton-shirt']);
	expect(await slugs({ minPrice: 1000, maxPrice: 1500 })).toEqual(['test-cream-midi-dress']);
	expect(await countPublicProducts(db, { sizes: ['M'] })).toBe(2);
	expect(await countPublicProducts(db, {})).toBe(3);
});

it('searches name, brand and piece ID, ignoring case and LIKE wildcards', async () => {
	const { db, sqlite } = localDatabase();
	sqlite.exec("UPDATE products SET brand = 'Aarong' WHERE id = 'test-dress'");
	const code = sqlite.prepare("SELECT code FROM products WHERE id = 'test-sold'").get() as {
		code: string;
	};
	const slugs = async (query: string) =>
		(await listPublicProducts(db, { query })).map((item) => item.slug);
	expect(await slugs('OLIVE')).toEqual(['test-olive-cotton-shirt']);
	expect(await slugs('aarong')).toEqual(['test-cream-midi-dress']);
	expect(await slugs(code.code.toLowerCase())).toEqual(['test-sold-denim-jacket']);
	expect(await slugs('%')).toEqual([]);
	expect(await slugs('shirt dress')).toEqual([]);
});

it('sorts by price and keeps newest as the default order', async () => {
	const { db } = localDatabase();
	const prices = async (sort: 'price-asc' | 'price-desc') =>
		(await listPublicProducts(db, { sort })).map((item) => item.price_bdt);
	expect(await prices('price-asc')).toEqual([850, 1450, 1750]);
	expect(await prices('price-desc')).toEqual([1750, 1450, 850]);
});

it('finds pieces by garment chest or waist in inches and returns parsed measurements', async () => {
	const { db, sqlite } = localDatabase();
	sqlite.exec(`UPDATE products SET publication_state = 'published' WHERE id = 'test-draft';`);
	const slugs = async (filters: Parameters<typeof listPublicProducts>[1]) =>
		(await listPublicProducts(db, filters)).map((item) => item.slug).sort();
	expect(await slugs({ chestMin: 40, chestMax: 42 })).toEqual(['test-olive-cotton-shirt']);
	expect(await slugs({ chestMin: 42 })).toEqual(['test-sold-denim-jacket']);
	expect(await slugs({ chestMax: 36 })).toEqual(['test-cream-midi-dress']);
	expect(await slugs({ waistMin: 29, waistMax: 31 })).toEqual(['test-unpublished-skirt']);
	const [shirt] = await listPublicProducts(db, { query: 'olive' });
	expect(shirt.measurements).toEqual({ chest_in: 41.5, length_in: 28.5 });
});

it('pages results without repeating pieces', async () => {
	const { db } = localDatabase();
	const first = await listPublicProducts(db, {}, { limit: 2 });
	const second = await listPublicProducts(db, {}, { limit: 2, offset: 2 });
	expect(first).toHaveLength(2);
	expect(second).toHaveLength(1);
	expect(first.map((item) => item.id)).not.toContain(second[0].id);
});

it('lists facets: categories with counts and a cover, sizes in fitting order, the price range', async () => {
	const { db, sqlite } = localDatabase();
	sqlite.exec("UPDATE products SET size_label = 'XL' WHERE id = 'test-shirt'");
	sqlite.exec("UPDATE products SET size_label = 'S' WHERE id = 'test-dress'");
	expect(await publicFacets(db)).toEqual({
		categories: [
			{
				slug: 'dresses',
				name: 'Dresses',
				measurement_set: 'top',
				count: 1,
				photo_key: 'test-only/cream-dress.webp',
				photo_alt: 'Generated test-only cream midi dress visual'
			},
			{
				slug: 'outerwear',
				name: 'Outerwear',
				measurement_set: 'top',
				count: 1,
				photo_key: 'test-only/denim-jacket.webp',
				photo_alt: 'Generated test-only denim jacket visual'
			},
			{
				slug: 'tops',
				name: 'Tops',
				measurement_set: 'top',
				count: 1,
				photo_key: 'test-only/olive-shirt.webp',
				photo_alt: 'Generated test-only olive shirt visual'
			}
		],
		sizes: ['S', 'M', 'XL'],
		price: { min: 850, max: 1750 }
	});
});

it('orders letter sizes small to large, then numbers, then anything else', () => {
	expect(sortSizes(['XL', '32', 'Free size', 'M', 'xs', '28', 'L', 'XXL', 'S'])).toEqual([
		'xs',
		'S',
		'M',
		'L',
		'XL',
		'XXL',
		'28',
		'32',
		'Free size'
	]);
});

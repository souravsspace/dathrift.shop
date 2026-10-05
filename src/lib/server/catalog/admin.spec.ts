import { localDatabase } from '../testing/local-d1';
import { expect, it } from 'vitest';
import {
	correctPublishedSlug,
	createDraft,
	getStaffProduct,
	listStaffProducts,
	publishProduct,
	unpublishProduct,
	updateDraftDetails
} from './admin';

it('creates one private draft and available unit atomically, rejecting invalid input', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: false });
	const input = {
		slug: 'test-new-jacket',
		name: 'TEST ONLY — New jacket',
		category: 'outerwear',
		price_bdt: 1300
	};
	await expect(createDraft(d1, { ...input, price_bdt: 0 })).rejects.toThrow('Invalid draft');
	const draft = await createDraft(d1, input);
	expect(draft).toMatchObject({ slug: input.slug, publication_state: 'draft' });
	expect(
		db
			.prepare(
				'SELECT p.slug, p.publication_state, i.state FROM products p JOIN inventory i ON i.product_id = p.id'
			)
			.all()
	).toEqual([{ slug: input.slug, publication_state: 'draft', state: 'available' }]);
	await expect(createDraft(d1, input)).rejects.toThrow();
	expect(db.prepare('SELECT COUNT(*) AS n FROM inventory').get()).toEqual({ n: 1 });
	db.close();
});

it('publishes only a complete photographed draft and can unpublish an available piece', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: false });
	db.exec(
		"INSERT INTO products (id, slug, name, category, price_bdt) VALUES ('a', 'test-top', 'TEST ONLY — Top', 'tops', 500)"
	);
	db.exec("INSERT INTO inventory (product_id) VALUES ('a')");
	await expect(publishProduct(d1, 'a')).rejects.toThrow('Incomplete product');
	db.exec(`UPDATE products SET description = 'Local fixture', condition_notes = 'Small mark',
		size_label = 'S', measurements_json = '{"chest_cm":90,"length_cm":60}', fit_note = 'Regular'
		WHERE id = 'a'`);
	await expect(publishProduct(d1, 'a')).rejects.toThrow('Incomplete product');
	db.exec(
		"INSERT INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('a', 1, 'test-only/top.webp', 'TEST ONLY top')"
	);
	expect(await publishProduct(d1, 'a')).toEqual({ id: 'a', publication_state: 'published' });
	expect(db.prepare("SELECT publication_state FROM products WHERE id = 'a'").get()).toEqual({
		publication_state: 'published'
	});
	expect(await unpublishProduct(d1, 'a')).toEqual({ id: 'a', publication_state: 'draft' });
	db.exec("UPDATE products SET publication_state = 'published' WHERE id = 'a'");
	db.exec("UPDATE inventory SET state = 'sold' WHERE product_id = 'a'");
	await expect(unpublishProduct(d1, 'a')).rejects.toThrow('Product not available');
	db.close();
});

it('updates a draft garment without changing its stable slug or publication state', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: true });
	const details = {
		name: 'TEST ONLY — Reworked skirt',
		category: 'bottoms',
		price_bdt: 875,
		brand: null,
		description: 'A local fixture.',
		condition_notes: 'Small mark at hem.',
		size_label: 'M',
		measurements_json: '{"waist_cm":78,"inseam_cm":70}',
		fit_note: 'Relaxed through the leg.'
	};
	await expect(updateDraftDetails(d1, 'test-draft', { ...details, price_bdt: 0 })).rejects.toThrow(
		'Invalid details'
	);
	await updateDraftDetails(d1, 'test-draft', details);
	expect(
		db
			.prepare('SELECT slug, name, price_bdt, publication_state FROM products WHERE id = ?')
			.get('test-draft')
	).toEqual({
		slug: 'test-unpublished-skirt',
		name: details.name,
		price_bdt: 875,
		publication_state: 'draft'
	});
	await expect(updateDraftDetails(d1, 'test-shirt', details)).rejects.toThrow('Draft not found');
	db.close();
});

it('lists every staff piece and reads one with ordered private photo metadata', async () => {
	const { db } = localDatabase();
	const rows = await listStaffProducts(db);
	expect(rows).toHaveLength(4);
	expect(rows).toContainEqual(
		expect.objectContaining({
			id: 'test-draft',
			publication_state: 'draft',
			stock_state: 'available'
		})
	);
	expect(await getStaffProduct(db, 'test-draft')).toMatchObject({
		id: 'test-draft',
		slug: 'test-unpublished-skirt',
		measurements_json: '{"waist_cm":76,"inseam_cm":67}',
		stock_state: 'available',
		photos: [
			{
				position: 1,
				r2_key: 'test-only/unpublished-skirt.svg',
				alt_text: 'TEST ONLY: skirt illustration'
			}
		]
	});
	expect(await getStaffProduct(db, 'missing')).toBeNull();
});

it('corrects a published slug once while keeping the old URL as a redirect', async () => {
	const { db, sqlite } = localDatabase();
	await expect(correctPublishedSlug(db, 'test-shirt', 'Bad Slug')).rejects.toThrow('Invalid slug');
	await expect(correctPublishedSlug(db, 'test-draft', 'new-skirt')).rejects.toThrow(
		'Product not published'
	);
	expect(await correctPublishedSlug(db, 'test-shirt', 'test-olive-shirt')).toEqual({
		id: 'test-shirt',
		slug: 'test-olive-shirt'
	});
	expect(sqlite.prepare('SELECT old_slug, product_id FROM slug_redirects').all()).toEqual([
		{ old_slug: 'test-olive-cotton-shirt', product_id: 'test-shirt' }
	]);
	await expect(correctPublishedSlug(db, 'test-dress', 'test-olive-cotton-shirt')).rejects.toThrow(
		'Slug unavailable'
	);
	await expect(correctPublishedSlug(db, 'test-dress', 'test-olive-shirt')).rejects.toThrow(
		'Slug unavailable'
	);
});

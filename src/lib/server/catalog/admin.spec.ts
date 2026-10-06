import { localDatabase } from '../testing/local-d1';
import { expect, it } from 'vitest';
import { createCategory } from './categories';
import {
	changeSlug,
	createDraft,
	getStaffProduct,
	listStaffProducts,
	publishProduct,
	removeProduct,
	unpublishProduct,
	updateProductDetails
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
	await expect(createDraft(d1, input)).rejects.toThrow('Slug unavailable');
	expect(db.prepare('SELECT COUNT(*) AS n FROM inventory').get()).toEqual({ n: 1 });
	const saree = { ...input, slug: 'test-red-saree', category: 'sarees' };
	await expect(createDraft(d1, saree)).rejects.toThrow('Unknown category');
	await createCategory(d1, { name: 'Sarees', measurement_set: 'none' });
	expect(await createDraft(d1, saree)).toMatchObject({ slug: 'test-red-saree' });
	db.close();
});

it('publishes a piece whose category needs no measurements', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: false });
	await createCategory(d1, { name: 'Bags', measurement_set: 'none' });
	db.exec(`INSERT INTO products (id, slug, name, category, price_bdt, description, condition_notes,
		size_label, fit_note) VALUES ('b', 'test-bag', 'TEST ONLY — Bag', 'bags', 700, 'Local fixture',
		'Scuffed base', 'One size', 'Long strap')`);
	db.exec("INSERT INTO inventory (product_id) VALUES ('b')");
	db.exec(
		"INSERT INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('b', 1, 'test-only/bag.webp', 'TEST ONLY bag')"
	);
	expect(await publishProduct(d1, 'b')).toEqual({ id: 'b', publication_state: 'published' });
	db.close();
});

it('publishes only a complete photographed draft and can unpublish any piece not held in checkout', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: false });
	db.exec(
		"INSERT INTO products (id, slug, name, category, price_bdt) VALUES ('a', 'test-top', 'TEST ONLY — Top', 'tops', 500)"
	);
	db.exec("INSERT INTO inventory (product_id) VALUES ('a')");
	await expect(publishProduct(d1, 'a')).rejects.toThrow('Incomplete product');
	db.exec(`UPDATE products SET description = 'Local fixture', condition_notes = 'Small mark',
		size_label = 'S', measurements_json = '{"chest_in":35.2,"length_in":23.5}', fit_note = 'Regular'
		WHERE id = 'a'`);
	await expect(publishProduct(d1, 'a')).rejects.toThrow('Incomplete product');
	db.exec(
		`UPDATE products SET measurements_json = '{"chest_in":35.5,"length_in":23.5}' WHERE id = 'a'`
	);
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
	expect(await unpublishProduct(d1, 'a')).toEqual({ id: 'a', publication_state: 'draft' });
	db.exec("UPDATE products SET publication_state = 'published' WHERE id = 'a'");
	db.exec("UPDATE inventory SET state = 'reserved' WHERE product_id = 'a'");
	await expect(unpublishProduct(d1, 'a')).rejects.toThrow('Product held');
	db.close();
});

const reworkedSkirt = {
	name: 'TEST ONLY — Reworked skirt',
	category: 'bottoms',
	price_bdt: 875,
	brand: null,
	description: 'A local fixture.',
	condition_notes: 'Small mark at hem.',
	size_label: 'M',
	measurements_json: '{"waist_in":30.5,"inseam_in":27.5}',
	fit_note: 'Relaxed through the leg.'
};

it('updates a draft garment without changing its stable slug or publication state', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: true });
	await expect(
		updateProductDetails(d1, 'test-draft', { ...reworkedSkirt, price_bdt: 0 })
	).rejects.toThrow('Invalid details');
	await updateProductDetails(d1, 'test-draft', reworkedSkirt);
	expect(
		db
			.prepare('SELECT slug, name, price_bdt, publication_state FROM products WHERE id = ?')
			.get('test-draft')
	).toEqual({
		slug: 'test-unpublished-skirt',
		name: reworkedSkirt.name,
		price_bdt: 875,
		publication_state: 'draft'
	});
	await expect(updateProductDetails(d1, 'missing', reworkedSkirt)).rejects.toThrow(
		'Product not found'
	);
	db.close();
});

it('edits a live piece in place while it stays complete and is not held in checkout', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: true });
	const shirt = {
		...reworkedSkirt,
		name: 'TEST ONLY — Olive shirt, relabelled',
		category: 'tops',
		price_bdt: 800,
		measurements_json: '{"chest_in":41.5,"length_in":28.5}'
	};
	expect(await updateProductDetails(d1, 'test-shirt', shirt)).toEqual({
		id: 'test-shirt',
		publication_state: 'published'
	});
	expect(
		db
			.prepare('SELECT name, price_bdt, publication_state FROM products WHERE id = ?')
			.get('test-shirt')
	).toEqual({ name: shirt.name, price_bdt: 800, publication_state: 'published' });
	// A live page may not lose the details a buyer relies on.
	await expect(
		updateProductDetails(d1, 'test-shirt', { ...shirt, condition_notes: null })
	).rejects.toThrow('Incomplete product');
	await expect(
		updateProductDetails(d1, 'test-shirt', { ...shirt, measurements_json: null })
	).rejects.toThrow('Incomplete product');
	db.exec("UPDATE inventory SET state = 'reserved' WHERE product_id = 'test-shirt'");
	await expect(updateProductDetails(d1, 'test-shirt', shirt)).rejects.toThrow('Product held');
	db.close();
});

it('deletes a never-sold piece outright and archives one with sales history', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: true });
	const removed: string[] = [];
	const bucket = { delete: async (key: string) => void removed.push(key) };

	expect(await removeProduct(d1, bucket, 'test-draft')).toEqual({ outcome: 'deleted' });
	expect(db.prepare("SELECT COUNT(*) AS n FROM products WHERE id = 'test-draft'").get()).toEqual({
		n: 0
	});
	expect(
		db.prepare("SELECT COUNT(*) AS n FROM product_photos WHERE product_id = 'test-draft'").get()
	).toEqual({ n: 0 });
	expect(removed).toEqual(['test-only/unpublished-skirt.svg']);

	removed.length = 0;
	expect(await removeProduct(d1, bucket, 'test-sold')).toEqual({ outcome: 'archived' });
	expect(
		db
			.prepare(
				"SELECT publication_state, archived_at IS NOT NULL AS archived FROM products WHERE id = 'test-sold'"
			)
			.get()
	).toEqual({ publication_state: 'draft', archived: 1 });
	expect(removed).toEqual([]);
	expect(await getStaffProduct(d1, 'test-sold')).toBeNull();
	expect((await listStaffProducts(d1)).map((row) => row.id)).not.toContain('test-sold');
	await expect(updateProductDetails(d1, 'test-sold', reworkedSkirt)).rejects.toThrow(
		'Product not found'
	);

	// The featured piece stops leading the home page when it is archived or deleted.
	expect(await removeProduct(d1, bucket, 'test-dress')).toEqual({ outcome: 'deleted' });
	expect(db.prepare('SELECT COUNT(*) AS n FROM home_feature').get()).toEqual({ n: 0 });

	db.exec("UPDATE inventory SET state = 'reserved' WHERE product_id = 'test-shirt'");
	await expect(removeProduct(d1, bucket, 'test-shirt')).rejects.toThrow('Product held');
	await expect(removeProduct(d1, bucket, 'missing')).rejects.toThrow('Product not found');
	db.close();
});

it('archives rather than deletes a piece that was ever ordered or sold elsewhere', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: true });
	const bucket = { delete: async () => undefined };
	db.exec(
		"INSERT INTO external_sales (id, product_id, actor_email, reason) VALUES ('s1', 'test-shirt', 'owner@example.com', 'TEST ONLY market stall')"
	);
	expect(await removeProduct(d1, bucket, 'test-shirt')).toEqual({ outcome: 'archived' });
	expect(await getStaffProduct(d1, 'test-dress')).toMatchObject({ has_history: false });
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
			stock_state: 'available',
			size_label: 'M',
			cover_key: 'test-only/unpublished-skirt.svg'
		})
	);
	expect(await getStaffProduct(db, 'test-draft')).toMatchObject({
		id: 'test-draft',
		slug: 'test-unpublished-skirt',
		category_name: 'Bottoms',
		measurement_set: 'bottom',
		measurements_json: '{"waist_in":30,"inseam_in":26.5}',
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

it('tells staff which piece leads the home page', async () => {
	const { db } = localDatabase();
	expect(await listStaffProducts(db)).toContainEqual(
		expect.objectContaining({ id: 'test-dress', featured: true })
	);
	expect(await getStaffProduct(db, 'test-dress')).toMatchObject({ featured: true });
	expect(await getStaffProduct(db, 'test-shirt')).toMatchObject({ featured: false });
});

it('changes a draft slug freely and corrects a published one while keeping a redirect', async () => {
	const { db, sqlite } = localDatabase();
	await expect(changeSlug(db, 'test-shirt', 'Bad Slug')).rejects.toThrow('Invalid slug');
	await expect(changeSlug(db, 'missing', 'new-skirt')).rejects.toThrow('Product not found');
	expect(await changeSlug(db, 'test-draft', 'test-new-skirt')).toEqual({
		id: 'test-draft',
		slug: 'test-new-skirt'
	});
	expect(await changeSlug(db, 'test-shirt', 'test-olive-shirt')).toEqual({
		id: 'test-shirt',
		slug: 'test-olive-shirt'
	});
	expect(sqlite.prepare('SELECT old_slug, product_id FROM slug_redirects').all()).toEqual([
		{ old_slug: 'test-olive-cotton-shirt', product_id: 'test-shirt' }
	]);
	await expect(changeSlug(db, 'test-dress', 'test-olive-cotton-shirt')).rejects.toThrow(
		'Slug unavailable'
	);
	await expect(changeSlug(db, 'test-dress', 'test-olive-shirt')).rejects.toThrow(
		'Slug unavailable'
	);
});

import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';

// D1 applies each migration file in its own transaction; mirror that so deferred keys behave.
function migrate(db: DatabaseSync, files: string[]) {
	for (const file of files) {
		db.exec('BEGIN');
		db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
		db.exec('COMMIT');
	}
}

function migratedDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');
	migrate(db, readdirSync('db/migrations').sort());
	return db;
}

it('stores product prices as positive integer BDT only', () => {
	const db = migratedDb();
	const insert = db.prepare(
		"INSERT INTO products (id, slug, name, category, price_bdt) VALUES (?, ?, 'Test-only top', 'tops', ?)"
	);

	insert.run('product-1', 'test-only-top', 1200);
	expect(() => insert.run('product-2', 'fractional-price', 1200.5)).toThrow();
	expect(() => insert.run('product-3', 'zero-price', 0)).toThrow();
	expect(db.prepare('SELECT price_bdt FROM products WHERE id = ?').get('product-1')).toEqual({
		price_bdt: 1200
	});

	db.close();
});

it('keeps one server-owned inventory state per product', () => {
	const db = migratedDb();
	db.prepare(
		"INSERT INTO products (id, slug, name, category, price_bdt) VALUES ('product-1', 'test-only-top', 'Test-only top', 'tops', 1200)"
	).run();
	const insert = db.prepare('INSERT INTO inventory (product_id, state) VALUES (?, ?)');

	insert.run('product-1', 'available');
	expect(() => insert.run('product-1', 'available')).toThrow();
	expect(() => insert.run('product-1', 'unknown')).toThrow();
	expect(db.prepare('SELECT state FROM inventory WHERE product_id = ?').get('product-1')).toEqual({
		state: 'available'
	});

	db.close();
});

it('stores up to ten ordered photo slots with nonblank alt text', () => {
	const db = migratedDb();
	db.prepare(
		"INSERT INTO products (id, slug, name, category, price_bdt) VALUES ('product-1', 'test-only-top', 'Test-only top', 'tops', 1200)"
	).run();
	const insert = db.prepare(
		'INSERT INTO product_photos (product_id, position, r2_key, alt_text) VALUES (?, ?, ?, ?)'
	);

	insert.run('product-1', 1, 'test-only/top-front.jpg', 'Front of test-only top');
	expect(() => insert.run('product-1', 1, 'test-only/duplicate.jpg', 'Duplicate slot')).toThrow();
	insert.run('product-1', 10, 'test-only/tenth.jpg', 'Tenth slot');
	expect(() => insert.run('product-1', 11, 'test-only/eleventh.jpg', 'Eleventh slot')).toThrow();
	expect(() => insert.run('product-1', 0, 'test-only/zero.jpg', 'Zero slot')).toThrow();
	expect(() => insert.run('product-1', 2, 'test-only/no-alt.jpg', '   ')).toThrow();
	expect(
		db
			.prepare('SELECT position, alt_text FROM product_photos WHERE product_id = ?')
			.all('product-1')
	).toEqual([
		{ position: 1, alt_text: 'Front of test-only top' },
		{ position: 10, alt_text: 'Tenth slot' }
	]);

	db.close();
});

it('stores the garment details needed for an honest product listing', () => {
	const db = migratedDb();
	db.prepare(
		`INSERT INTO products
		 (id, slug, name, category, price_bdt, brand, description, condition_notes, size_label, measurements_json, fit_note)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		'product-1',
		'test-only-top',
		'Test-only top',
		'tops',
		1200,
		null,
		'Cotton top used only in tests',
		'Small mark on left cuff',
		'M',
		'{"chest_in":20.5,"length_in":27}',
		'Fits relaxed'
	);

	expect(
		db.prepare('SELECT description, condition_notes, measurements_json FROM products').get()
	).toEqual({
		description: 'Cotton top used only in tests',
		condition_notes: 'Small mark on left cuff',
		measurements_json: '{"chest_in":20.5,"length_in":27}'
	});
	expect(() =>
		db.prepare("UPDATE products SET measurements_json = 'not JSON' WHERE id = 'product-1'").run()
	).toThrow();
	db.close();
});

it('keeps staff-managed categories, each with the measurements its pieces need', () => {
	const db = migratedDb();
	expect(
		db.prepare('SELECT slug, name, measurement_set FROM categories ORDER BY slug').all()
	).toEqual([
		{ slug: 'bottoms', name: 'Bottoms', measurement_set: 'bottom' },
		{ slug: 'dresses', name: 'Dresses', measurement_set: 'top' },
		{ slug: 'outerwear', name: 'Outerwear', measurement_set: 'top' },
		{ slug: 'tops', name: 'Tops', measurement_set: 'top' }
	]);
	const addCategory = db.prepare(
		'INSERT INTO categories (slug, name, measurement_set) VALUES (?, ?, ?)'
	);
	const addProduct = db.prepare(
		"INSERT INTO products (id, slug, name, category, price_bdt) VALUES (?, ?, 'Test-only piece', ?, 900)"
	);
	expect(() => addProduct.run('p1', 'test-only-bag', 'bags')).toThrow();
	addCategory.run('bags', 'Bags', 'none');
	addProduct.run('p1', 'test-only-bag', 'bags');
	expect(() => addCategory.run('Bad Slug', 'Bad', 'none')).toThrow();
	expect(() => addCategory.run('shoes', 'bags', 'none')).toThrow();
	expect(() => addCategory.run('shoes', 'Shoes', 'feet')).toThrow();
	expect(() => addCategory.run('shoes', '  ', 'none')).toThrow();
	db.close();
});

it('moves existing pieces onto the category table and their measurements into half inches', () => {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');
	const files = readdirSync('db/migrations').sort();
	const before = files.filter((file) => file < '0014');
	migrate(db, before);
	db.exec(`INSERT INTO products (id, slug, name, category, price_bdt, measurements_json)
		VALUES ('a', 'test-only-top', 'Test-only top', 'tops', 900, '{"chest_cm":90,"length_cm":60}'),
		       ('b', 'test-only-skirt', 'Test-only skirt', 'bottoms', 700, '{"waist_cm":76,"inseam_cm":67}'),
		       ('c', 'test-only-dress', 'Test-only dress', 'dresses', 1200, NULL);
		INSERT INTO inventory (product_id) VALUES ('a'), ('b'), ('c');
		INSERT INTO product_photos (product_id, position, r2_key, alt_text)
		VALUES ('a', 1, 'test-only/a.webp', 'Test-only top');
		INSERT INTO slug_redirects (old_slug, product_id) VALUES ('test-only-old-top', 'a');
		INSERT INTO home_feature (slot, product_id) VALUES ('hero', 'a');`);
	migrate(
		db,
		files.filter((file) => file >= '0014')
	);
	expect(
		db.prepare('SELECT id, category, measurements_json FROM products ORDER BY id').all()
	).toEqual([
		{ id: 'a', category: 'tops', measurements_json: '{"chest_in":35.5,"length_in":23.5}' },
		{ id: 'b', category: 'bottoms', measurements_json: '{"waist_in":30,"inseam_in":26.5}' },
		{ id: 'c', category: 'dresses', measurements_json: null }
	]);
	expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
	const triggers = db
		.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' ORDER BY name")
		.all()
		.map((row) => row.name);
	expect(triggers).toEqual(
		expect.arrayContaining([
			'product_slug_change_not_redirected',
			'product_slug_not_redirected',
			'reserve_one_off_item',
			'stamp_new_product',
			'touch_product',
			'touch_product_photos',
			'touch_product_stock'
		])
	);
	expect(() =>
		db
			.prepare(
				"INSERT INTO products (id, slug, name, category, price_bdt) VALUES ('d', 'test-only-old-top', 'X', 'tops', 1)"
			)
			.run()
	).toThrow('Slug unavailable');
	db.close();
});

it('never lets an archived piece become public again', () => {
	const db = migratedDb();
	db.exec(
		"INSERT INTO products (id, slug, name, category, price_bdt) VALUES ('p1', 'test-only-top', 'Test-only top', 'tops', 900)"
	);
	db.exec("UPDATE products SET archived_at = CURRENT_TIMESTAMP WHERE id = 'p1'");
	expect(() =>
		db.exec("UPDATE products SET publication_state = 'published' WHERE id = 'p1'")
	).toThrow('Archived product');
	db.exec("UPDATE products SET archived_at = NULL WHERE id = 'p1'");
	db.exec("UPDATE products SET publication_state = 'published' WHERE id = 'p1'");
	db.close();
});

it('gives every piece a month code that restarts each month and never reuses a number', () => {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');
	const files = readdirSync('db/migrations').sort();
	migrate(
		db,
		files.filter((file) => file < '0018')
	);
	const add = db.prepare(
		"INSERT INTO products (id, slug, name, category, price_bdt, created_at) VALUES (?, ?, 'Test-only piece', 'tops', 900, ?)"
	);
	// Existing pieces are numbered by when they were added, in Bangladesh time.
	add.run('old-1', 'test-old-1', '2026-09-30 17:59:00');
	add.run('old-2', 'test-old-2', '2026-09-30 18:00:00');
	add.run('old-3', 'test-old-3', '2026-10-05 08:00:00');
	migrate(
		db,
		files.filter((file) => file >= '0018')
	);
	const code = (id: string) =>
		(db.prepare('SELECT code FROM products WHERE id = ?').get(id) as { code: string }).code;
	expect([code('old-1'), code('old-2'), code('old-3')]).toEqual([
		'SE2026001',
		'OC2026001',
		'OC2026002'
	]);
	add.run('new-1', 'test-new-1', '2026-10-06 09:00:00');
	expect(code('new-1')).toBe('OC2026003');
	db.exec("DELETE FROM products WHERE id = 'new-1'");
	add.run('new-2', 'test-new-2', '2026-10-06 10:00:00');
	expect(code('new-2')).toBe('OC2026004');
	add.run('nov-1', 'test-nov-1', '2026-11-02 10:00:00');
	add.run('mar-1', 'test-mar-1', '2027-03-02 10:00:00');
	add.run('may-1', 'test-may-1', '2027-05-02 10:00:00');
	expect([code('nov-1'), code('mar-1'), code('may-1')]).toEqual([
		'NO2026001',
		'MR2027001',
		'MY2027001'
	]);
	expect(() => db.exec("UPDATE products SET code = 'OC2026001' WHERE id = 'new-2'")).toThrow();
	db.close();
});

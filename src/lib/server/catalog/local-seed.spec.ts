import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';

it('seeds unmistakably test-only stock locally, including available, sold, and draft pieces', () => {
	const db = new DatabaseSync(':memory:');
	for (const file of readdirSync('db/migrations').sort()) {
		db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
	}
	const seed = readFileSync('db/seed/local.sql', 'utf8');
	db.exec(seed);
	db.prepare(
		"UPDATE product_photos SET r2_key = 'test-only/old-dress.svg' WHERE product_id = 'test-dress'"
	).run();
	db.exec(seed);
	expect(
		db.prepare("SELECT r2_key FROM product_photos WHERE product_id = 'test-dress'").get()
	).toEqual({ r2_key: 'test-only/cream-dress.webp' });
	const products = db.prepare('SELECT id, slug, name, publication_state FROM products').all();
	expect(products).toHaveLength(4);
	for (const product of products) {
		expect(String(product.id)).toMatch(/^test-/);
		expect(String(product.slug)).toMatch(/^test-/);
		expect(String(product.name)).toMatch(/^TEST ONLY — /);
	}
	expect(
		db
			.prepare(
				`SELECT p.publication_state, i.state, count(photo.position) AS photos
				 FROM products p JOIN inventory i ON i.product_id = p.id
				 LEFT JOIN product_photos photo ON photo.product_id = p.id
				 GROUP BY p.id ORDER BY p.id`
			)
			.all()
	).toEqual([
		{ publication_state: 'draft', state: 'available', photos: 1 },
		{ publication_state: 'published', state: 'available', photos: 1 },
		{ publication_state: 'published', state: 'available', photos: 1 },
		{ publication_state: 'published', state: 'sold', photos: 1 }
	]);
	db.close();
});

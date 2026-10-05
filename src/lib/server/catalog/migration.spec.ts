import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';

function migratedDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');
	for (const file of readdirSync('db/migrations').sort()) {
		db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
	}
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

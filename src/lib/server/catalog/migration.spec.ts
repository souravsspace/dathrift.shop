import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';

it('stores product prices as positive integer BDT only', () => {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync('db/migrations/0001_catalog.sql', 'utf8'));
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

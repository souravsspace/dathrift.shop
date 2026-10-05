import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import { reserveCheckout } from './reserve';

function localDb() {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');
	for (const file of readdirSync('db/migrations').sort())
		db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
	db.exec(readFileSync('db/seed/local.sql', 'utf8'));
	return db;
}

function adapter(db: DatabaseSync) {
	return {
		prepare: (sql: string) => ({
			bind: (...args: (string | number)[]) => ({
				run: () => db.prepare(sql).run(...args),
				all: () => ({ results: db.prepare(sql).all(...args) })
			})
		}),
		batch: async (
			statements: { run(): unknown; all(): { results: Record<string, unknown>[] } }[]
		) => {
			db.exec('BEGIN');
			try {
				const result = statements.map((statement, index) =>
					index === statements.length - 1 ? statement.all() : statement.run()
				);
				db.exec('COMMIT');
				return result;
			} catch (error) {
				db.exec('ROLLBACK');
				throw error;
			}
		}
	};
}

const address = {
	name: 'Test Buyer',
	phone: '01712345678',
	line1: 'Test building',
	district: 'test-dhaka',
	area: 'test-central'
};

it('reserves two distinct available pieces with immutable D1 prices and one delivery fee', async () => {
	const db = localDb();
	const order = await reserveCheckout(adapter(db), ['test-shirt', 'test-dress'], address, true);
	expect(order).toMatchObject({
		subtotal_bdt: 2300,
		shipping_bdt: 80,
		total_bdt: 2380,
		status: 'pending_payment'
	});
	expect(
		db
			.prepare(
				'SELECT product_id, price_bdt FROM order_items WHERE order_id = ? ORDER BY product_id'
			)
			.all(order.id)
	).toEqual([
		{ product_id: 'test-dress', price_bdt: 1450 },
		{ product_id: 'test-shirt', price_bdt: 850 }
	]);
	expect(db.prepare("SELECT state FROM inventory WHERE product_id = 'test-shirt'").get()).toEqual({
		state: 'reserved'
	});
	await expect(reserveCheckout(adapter(db), ['test-shirt'], address, true)).rejects.toThrow();
	expect(db.prepare('SELECT count(*) AS n FROM orders').get()).toEqual({ n: 1 });
	db.close();
});

it('rolls back all items and the order when any one-off unit is unavailable', async () => {
	const db = localDb();
	await expect(
		reserveCheckout(adapter(db), ['test-dress', 'test-sold'], address, true)
	).rejects.toThrow();
	expect(db.prepare("SELECT state FROM inventory WHERE product_id = 'test-dress'").get()).toEqual({
		state: 'available'
	});
	expect(db.prepare('SELECT count(*) AS n FROM orders').get()).toEqual({ n: 0 });
	db.close();
});

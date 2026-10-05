import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import { markSoldExternally } from './external-sale';

it('atomically sells one available unit and audits actor, while rejecting held or repeat sales', async () => {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');
	for (const file of readdirSync('db/migrations').sort())
		db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
	db.exec(readFileSync('db/seed/local.sql', 'utf8'));
	const d1 = {
		prepare: (sql: string) => ({
			bind: (...args: (string | number)[]) => ({ run: async () => db.prepare(sql).run(...args) })
		})
	};
	await expect(markSoldExternally(d1, 'test-shirt', 'staff@example.com', '')).rejects.toThrow(
		'Invalid sale'
	);
	expect(
		await markSoldExternally(d1, 'test-shirt', 'staff@example.com', 'Sold in person')
	).toMatchObject({ product_id: 'test-shirt', state: 'sold' });
	expect(db.prepare("SELECT state FROM inventory WHERE product_id = 'test-shirt'").get()).toEqual({
		state: 'sold'
	});
	expect(
		db
			.prepare("SELECT actor_email, reason FROM external_sales WHERE product_id = 'test-shirt'")
			.all()
	).toEqual([{ actor_email: 'staff@example.com', reason: 'Sold in person' }]);
	await expect(
		markSoldExternally(d1, 'test-shirt', 'staff@example.com', 'Again')
	).rejects.toThrow();
	db.exec("UPDATE inventory SET state = 'reserved' WHERE product_id = 'test-dress'");
	await expect(
		markSoldExternally(d1, 'test-dress', 'staff@example.com', 'In person')
	).rejects.toThrow();
	expect(db.prepare('SELECT count(*) AS n FROM external_sales').get()).toEqual({ n: 1 });
	db.close();
});

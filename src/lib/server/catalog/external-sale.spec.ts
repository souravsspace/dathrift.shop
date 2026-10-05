import { localDatabase } from '../testing/local-d1';
import { expect, it } from 'vitest';
import { markSoldExternally } from './external-sale';

it('atomically sells one available unit and audits actor, while rejecting held or repeat sales', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: true });
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

import { expect, it } from 'vitest';
import { localDatabase } from '../testing/local-d1';
import { clearHomeFeature, featureOnHome, homeHero } from './feature';

it('leads the home page with the newest available piece when nothing is featured', async () => {
	const { db, sqlite } = localDatabase();
	sqlite.exec('DELETE FROM home_feature');
	sqlite.exec("UPDATE products SET created_at = '2026-01-01' WHERE id = 'test-dress'");
	sqlite.exec("UPDATE products SET created_at = '2026-02-01' WHERE id = 'test-shirt'");
	sqlite.exec("UPDATE products SET created_at = '2026-03-01' WHERE id = 'test-sold'");
	expect(await homeHero(db)).toMatchObject({
		slug: 'test-olive-cotton-shirt',
		stock_state: 'available',
		photo_key: 'test-only/olive-shirt.webp',
		featured: false
	});
});

it('leads with the owner-featured piece while it is published and available', async () => {
	const { db, sqlite } = localDatabase();
	sqlite.exec("UPDATE products SET created_at = '2026-01-01' WHERE id = 'test-dress'");
	sqlite.exec("UPDATE products SET created_at = '2026-02-01' WHERE id = 'test-shirt'");
	expect(await featureOnHome(db, 'test-dress')).toEqual({ id: 'test-dress', featured: true });
	expect(await homeHero(db)).toMatchObject({ slug: 'test-cream-midi-dress', featured: true });
	sqlite.exec("UPDATE inventory SET state = 'sold' WHERE product_id = 'test-dress'");
	expect(await homeHero(db)).toMatchObject({ slug: 'test-olive-cotton-shirt', featured: false });
});

it('features only one published, available piece at a time', async () => {
	const { db, sqlite } = localDatabase();
	await expect(featureOnHome(db, 'test-draft')).rejects.toThrow('Product not available');
	await expect(featureOnHome(db, 'test-sold')).rejects.toThrow('Product not available');
	await featureOnHome(db, 'test-dress');
	await featureOnHome(db, 'test-shirt');
	expect(sqlite.prepare('SELECT slot, product_id FROM home_feature').all()).toEqual([
		{ slot: 'hero', product_id: 'test-shirt' }
	]);
	expect(await clearHomeFeature(db)).toEqual({ featured: false });
	expect(sqlite.prepare('SELECT COUNT(*) AS count FROM home_feature').get()).toEqual({ count: 0 });
});

it('has no hero when no published piece is available', async () => {
	const { db } = localDatabase({ seed: false });
	expect(await homeHero(db)).toBeNull();
});

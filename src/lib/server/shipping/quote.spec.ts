import { localDatabase } from '../testing/local-d1';
import { expect, it } from 'vitest';
import { listDeliveryAreas, quoteShipping } from './quote';

it('uses the maintained area record, not a buyer-claimed cheap zone', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: true });
	const address = {
		name: 'Test Buyer',
		phone: '01712345678',
		line1: 'Test building',
		district: 'test-dhaka',
		area: 'test-central'
	};
	expect(await quoteShipping(d1, { ...address, claimed_zone: 'outside' })).toEqual({
		phone: '01712345678',
		fee_bdt: 80,
		preview_only: true
	});
	await expect(quoteShipping(d1, { ...address, district: 'unapproved' })).rejects.toThrow(
		'Unsupported area'
	);
	await expect(quoteShipping(d1, { ...address, phone: '123' })).rejects.toThrow('Invalid address');
	// The same phone rule as the checkout form: a mobile number, written any common way.
	expect(await quoteShipping(d1, { ...address, phone: '+880 1712-345678' })).toMatchObject({
		phone: '01712345678'
	});
	await expect(quoteShipping(d1, { ...address, phone: '0255667788' })).rejects.toThrow(
		'Invalid address'
	);
	expect(await quoteShipping(d1, { ...address, phone: '০১৭১২৩৪৫৬৭৮' })).toMatchObject({
		phone: '01712345678'
	});
	db.close();
});

it('lists active delivery areas, keeping test-only areas out of non-preview checkout', async () => {
	const { db, sqlite } = localDatabase({ seed: true });
	const testAreas = async (preview: boolean) =>
		(await listDeliveryAreas(db, preview)).filter((area) => area.district.startsWith('test-'));
	expect(await testAreas(true)).toEqual([
		{ district: 'test-dhaka', area: 'test-central', name: 'TEST ONLY — Central area', fee_bdt: 80 },
		{ district: 'test-other', area: 'test-town', name: 'TEST ONLY — Other town', fee_bdt: 130 }
	]);
	expect(await testAreas(false)).toEqual([]);
	expect(await listDeliveryAreas(db, false)).toContainEqual({
		district: 'dhaka-city',
		area: 'all',
		name: 'Dhaka City',
		fee_bdt: 75
	});
	sqlite.exec("UPDATE delivery_areas SET active = 0 WHERE area_key = 'test-town'");
	expect(await testAreas(true)).toHaveLength(1);
});

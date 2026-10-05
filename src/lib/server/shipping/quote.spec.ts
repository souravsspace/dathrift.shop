import { localDatabase } from '../testing/local-d1';
import { expect, it } from 'vitest';
import { quoteShipping } from './quote';

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
	db.close();
});

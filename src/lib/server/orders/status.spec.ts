import { expect, it } from 'vitest';
import { localDatabase } from '../testing/local-d1';
import { reserveCheckout } from '../reservation/reserve';
import { orderForStatusToken } from './status';

it('shows a scoped order summary without the full address or phone', async () => {
	const { db } = localDatabase();
	const order = await reserveCheckout(
		db,
		['test-shirt'],
		{
			name: 'Private Buyer',
			phone: '01712345678',
			line1: 'House 9, Private Road',
			district: 'test-dhaka',
			area: 'test-central'
		},
		true
	);
	const summary = await orderForStatusToken(db, order.status_token);
	expect(summary).toMatchObject({
		reference: order.id.slice(0, 8).toUpperCase(),
		status: 'pending_payment',
		subtotal_bdt: 850,
		shipping_bdt: 80,
		total_bdt: 930,
		area: 'TEST ONLY — Central area',
		phone_hint: '••••••••678',
		fulfillment: null,
		items: [
			{ name: 'TEST ONLY — Olive cotton shirt', slug: 'test-olive-cotton-shirt', price_bdt: 850 }
		]
	});
	expect(JSON.stringify(summary)).not.toMatch(/Private|House 9|01712345678/);
	expect(await orderForStatusToken(db, 'not-a-token')).toBeNull();
	expect(await orderForStatusToken(db, crypto.randomUUID())).toBeNull();
});

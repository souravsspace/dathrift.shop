import { expect, it } from 'vitest';
import { reserveCheckout } from '../reservation/reserve';
import { localDatabase } from '../testing/local-d1';
import { attachPayment, holdForReview, settleVerifiedPayment } from './lifecycle';
import { getStaffOrder, listStaffOrders, recordFulfillment } from './admin';

const address = {
	name: 'Test Buyer',
	phone: '01712345678',
	line1: 'House 1, Test Road',
	district: 'test-dhaka',
	area: 'test-central'
};

async function paidOrder(db: ReturnType<typeof localDatabase>['db']) {
	const order = await reserveCheckout(db, ['test-shirt'], address, true);
	await attachPayment(db, order.id, 'mock', 'TESTpay1', order.total_bdt);
	await settleVerifiedPayment(db, 'TESTpay1', 'TESTtrx1');
	return order;
}

it('lists orders and shows staff the delivery contact, payment proof and history', async () => {
	const { db } = localDatabase();
	const order = await paidOrder(db);
	const held = await reserveCheckout(db, ['test-dress'], address, true);
	await holdForReview(db, held.id);
	const rows = await listStaffOrders(db);
	expect(rows.map((row) => row.status).sort()).toEqual(['paid', 'payment_review']);
	expect(rows.find((row) => row.id === order.id)).toMatchObject({
		reference: order.id.slice(0, 8).toUpperCase(),
		total_bdt: 930,
		item_count: 1,
		fulfillment_state: null
	});
	expect(await getStaffOrder(db, order.id)).toMatchObject({
		status: 'paid',
		address: { name: 'Test Buyer', phone: '01712345678', line1: 'House 1, Test Road' },
		area: 'TEST ONLY — Central area',
		items: [{ name: 'TEST ONLY — Olive cotton shirt', price_bdt: 850 }],
		payment: { provider: 'mock', status: 'completed', trx_id: 'TESTtrx1', amount_bdt: 930 },
		events: [{ actor: 'system', action: 'paid' }]
	});
	expect(await getStaffOrder(db, 'missing')).toBeNull();
});

it('moves fulfillment forward only for paid orders and requires tracking at dispatch', async () => {
	const { db } = localDatabase();
	const order = await paidOrder(db);
	const unpaid = await reserveCheckout(db, ['test-dress'], address, true);
	await expect(
		recordFulfillment(db, unpaid.id, 'staff@example.com', { state: 'preparing' })
	).rejects.toThrow('Order not paid');
	await recordFulfillment(db, order.id, 'staff@example.com', { state: 'preparing' });
	await expect(
		recordFulfillment(db, order.id, 'staff@example.com', { state: 'dispatched' })
	).rejects.toThrow('Invalid fulfillment');
	await recordFulfillment(db, order.id, 'staff@example.com', {
		state: 'dispatched',
		courier: 'Steadfast',
		tracking_code: 'TEST-TRACK-1'
	});
	await expect(
		recordFulfillment(db, order.id, 'staff@example.com', { state: 'preparing' })
	).rejects.toThrow('Invalid fulfillment transition');
	expect((await getStaffOrder(db, order.id))?.fulfillment).toMatchObject({
		state: 'dispatched',
		courier: 'Steadfast',
		tracking_code: 'TEST-TRACK-1'
	});
	expect((await getStaffOrder(db, order.id))?.events.map((event) => event.action)).toEqual([
		'paid',
		'fulfillment_preparing',
		'fulfillment_dispatched'
	]);
});

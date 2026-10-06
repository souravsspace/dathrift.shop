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
	const { items: rows } = await listStaffOrders(db);
	expect(rows.map((row) => row.status).sort()).toEqual(['paid', 'payment_review']);
	expect(rows.find((row) => row.id === order.id)).toMatchObject({
		reference: order.id.slice(0, 8).toUpperCase(),
		total_bdt: 930,
		item_count: 1,
		fulfillment_state: null,
		customer_name: 'Test Buyer',
		phone: '01712345678'
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

it('pages orders twenty at a time and finds one by reference, buyer, phone, address or piece', async () => {
	const { db, sqlite } = localDatabase();
	const piece = sqlite.prepare(`INSERT INTO products (id, slug, name, category, price_bdt,
		publication_state) VALUES (?, ?, ?, 'tops', 500, 'published')`);
	const stock = sqlite.prepare('INSERT INTO inventory (product_id) VALUES (?)');
	const ids: string[] = [];
	for (let n = 1; n <= 23; n++) {
		piece.run(
			`demo-${n}`,
			`test-demo-${n}`,
			`TEST ONLY — Demo ${n === 7 ? 'velvet blazer' : 'piece'}`
		);
		stock.run(`demo-${n}`);
		const order = await reserveCheckout(
			db,
			[`demo-${n}`],
			{
				...address,
				name: n === 5 ? 'Nusrat Jahan' : 'Test Buyer',
				phone: n === 9 ? '01898765432' : address.phone,
				line1: n === 11 ? 'Flat 4B, Lake Road' : address.line1
			},
			true
		);
		ids.push(order.id);
		sqlite
			.prepare('UPDATE orders SET created_at = ? WHERE id = ?')
			.run(`2026-10-01 00:${String(n).padStart(2, '0')}:00`, order.id);
	}
	const first = await listStaffOrders(db);
	expect(first).toMatchObject({ total: 23, page: 1, page_size: 20 });
	expect(first.items[0].id).toBe(ids[22]);
	expect((await listStaffOrders(db, { page: 2 })).items.map((row) => row.id)).toEqual([
		ids[2],
		ids[1],
		ids[0]
	]);
	const found = async (query: string) =>
		(await listStaffOrders(db, { query })).items.map((row) => row.id);
	expect(await found(ids[3].slice(0, 8).toUpperCase())).toEqual([ids[3]]);
	expect(await found('nusrat')).toEqual([ids[4]]);
	expect(await found('+880 1898-765432')).toEqual([ids[8]]);
	expect(await found('lake road')).toEqual([ids[10]]);
	expect(await found('velvet')).toEqual([ids[6]]);
	const code = (
		sqlite.prepare("SELECT code FROM products WHERE id = 'demo-13'").get() as { code: string }
	).code;
	expect(await found(code)).toEqual([ids[12]]);
	expect(await found('_')).toEqual([]);
});

it('sorts orders into the tabs staff work from and counts each one', async () => {
	const { db } = localDatabase();
	const shipped = await paidOrder(db);
	await recordFulfillment(db, shipped.id, 'staff@example.com', {
		state: 'dispatched',
		courier: 'Steadfast',
		tracking_code: 'TEST-TRACK-1'
	});
	const review = await reserveCheckout(db, ['test-dress'], address, true);
	await holdForReview(db, review.id);
	const { counts } = await listStaffOrders(db);
	expect(counts).toEqual({ review: 1, to_ship: 0, shipped: 1, awaiting: 0, closed: 0 });
	const ids = async (filter: 'review' | 'shipped' | 'to_ship') =>
		(await listStaffOrders(db, { filter })).items.map((row) => row.id);
	expect(await ids('review')).toEqual([review.id]);
	expect(await ids('shipped')).toEqual([shipped.id]);
	expect(await ids('to_ship')).toEqual([]);
	expect((await listStaffOrders(db, { query: 'nobody' })).counts).toEqual({
		review: 0,
		to_ship: 0,
		shipped: 0,
		awaiting: 0,
		closed: 0
	});
});

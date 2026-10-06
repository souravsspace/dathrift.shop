import { expect, it } from 'vitest';
import { readSavedOrders, saveOrder, type SavedOrder } from './device-orders';

const memory = () => {
	const data = new Map<string, string>();
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => void data.set(key, value)
	};
};

const order = (n: number, extra: Partial<SavedOrder> = {}): SavedOrder => ({
	token: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
	reference: `REF${n}`,
	status: 'pending_payment',
	total_bdt: 1000 + n,
	items: [{ name: `Piece ${n}`, slug: `piece-${n}` }],
	created_at: `2026-10-0${n}T10:00:00Z`,
	...extra
});

it('keeps orders on this device only, newest first, updating one order in place', () => {
	const storage = memory();
	saveOrder(storage, order(1));
	saveOrder(storage, order(2));
	saveOrder(storage, order(1, { status: 'paid', reference: 'AB12CD34' }));
	expect(readSavedOrders(storage).map((item) => [item.reference, item.status])).toEqual([
		['REF2', 'pending_payment'],
		['AB12CD34', 'paid']
	]);
});

it('keeps a known reference when an early save did not have one yet', () => {
	const storage = memory();
	saveOrder(storage, order(1, { reference: 'AB12CD34' }));
	saveOrder(storage, order(1, { reference: '', status: 'paid' }));
	expect(readSavedOrders(storage)[0]).toMatchObject({ reference: 'AB12CD34', status: 'paid' });
});

it('ignores damaged storage and anything that is not an order', () => {
	const storage = memory();
	storage.setItem('dathrift-orders', '{bad json');
	expect(readSavedOrders(storage)).toEqual([]);
	storage.setItem('dathrift-orders', JSON.stringify([{ token: '../admin' }, order(3)]));
	expect(readSavedOrders(storage).map((item) => item.reference)).toEqual(['REF3']);
});

it('keeps at most the 30 most recent orders', () => {
	const storage = memory();
	for (let n = 1; n <= 35; n += 1)
		saveOrder(storage, order(n, { created_at: new Date(Date.UTC(2026, 0, n)).toISOString() }));
	const saved = readSavedOrders(storage);
	expect(saved).toHaveLength(30);
	expect(saved[0].reference).toBe('REF35');
});

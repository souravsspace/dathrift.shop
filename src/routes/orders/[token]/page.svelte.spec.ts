import { page } from 'vitest/browser';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import OrderPage from './+page.svelte';

const token = '00000000-0000-4000-8000-0000000000aa';

const order = {
	reference: 'AB12CD34',
	status: 'paid' as const,
	subtotal_bdt: 2300,
	shipping_bdt: 80,
	total_bdt: 2380,
	preview_only: true,
	area: 'TEST ONLY — Central area',
	phone_hint: '••••••••678',
	created_at: '2026-10-06 10:00:00',
	expires_at: '2026-10-06 10:15:00',
	fulfillment: { state: 'dispatched', courier: 'Steadfast', tracking_code: 'TEST-TRACK-1' },
	items: [
		{ name: 'TEST ONLY — Cream midi dress', slug: 'test-cream-midi-dress', price_bdt: 1450 },
		{ name: 'TEST ONLY — Olive cotton shirt', slug: 'test-olive-cotton-shirt', price_bdt: 850 }
	]
};

it('reports a provider-verified payment, totals and dispatch tracking', async () => {
	render(OrderPage, { data: { order, token } });
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Order AB12CD34');
	await expect.element(page.getByText('Payment confirmed by bKash')).toBeInTheDocument();
	await expect.element(page.getByText('৳2,380')).toBeInTheDocument();
	await expect.element(page.getByText('TEST-TRACK-1')).toBeInTheDocument();
	await expect.element(page.getByText('TEST ONLY order — no real delivery.')).toBeInTheDocument();
});

it('never presents an unverified or held payment as paid', async () => {
	render(OrderPage, {
		data: { order: { ...order, status: 'payment_review' as const, fulfillment: null }, token }
	});
	await expect.element(page.getByText('Payment being checked')).toBeInTheDocument();
	await expect.element(page.getByText('Payment confirmed by bKash')).not.toBeInTheDocument();
});

it('remembers the order on this device with its latest status', async () => {
	window.localStorage.clear();
	render(OrderPage, { data: { order, token } });
	await expect
		.element(page.getByRole('main').getByRole('link', { name: 'Your orders' }))
		.toHaveAttribute('href', '/orders');
	expect(JSON.parse(window.localStorage.getItem('dathrift-orders') ?? '[]')).toEqual([
		{
			token,
			reference: 'AB12CD34',
			status: 'paid',
			total_bdt: 2380,
			items: [
				{ name: 'TEST ONLY — Cream midi dress', slug: 'test-cream-midi-dress' },
				{ name: 'TEST ONLY — Olive cotton shirt', slug: 'test-olive-cotton-shirt' }
			],
			created_at: '2026-10-06T10:00:00Z'
		}
	]);
	window.localStorage.clear();
});

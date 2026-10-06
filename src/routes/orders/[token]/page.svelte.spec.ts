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
	manual: null,
	items: [
		{ name: 'TEST ONLY — Cream midi dress', slug: 'test-cream-midi-dress', price_bdt: 1450 },
		{ name: 'TEST ONLY — Olive cotton shirt', slug: 'test-olive-cotton-shirt', price_bdt: 850 }
	]
};

it('reports a provider-verified payment, totals and dispatch tracking', async () => {
	render(OrderPage, { data: { order, token }, form: null });
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Order AB12CD34');
	await expect.element(page.getByText('Payment confirmed by bKash')).toBeInTheDocument();
	await expect.element(page.getByText('৳2,380')).toBeInTheDocument();
	await expect.element(page.getByText('TEST-TRACK-1')).toBeInTheDocument();
	await expect.element(page.getByText('TEST ONLY order — no real delivery.')).toBeInTheDocument();
});

it('never presents an unverified or held payment as paid', async () => {
	render(OrderPage, {
		data: { order: { ...order, status: 'payment_review' as const, fulfillment: null }, token },
		form: null
	});
	await expect.element(page.getByText('Payment being checked')).toBeInTheDocument();
	await expect.element(page.getByText('Payment confirmed by bKash')).not.toBeInTheDocument();
});

it('remembers the order on this device with its latest status', async () => {
	window.localStorage.clear();
	render(OrderPage, { data: { order, token }, form: null });
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

const manualOrder = {
	...order,
	status: 'pending_payment' as const,
	fulfillment: null,
	shipping_bdt: 135,
	total_bdt: 2435,
	expires_at: new Date(Date.now() + 20 * 60000).toISOString().slice(0, 19).replace('T', ' '),
	manual: {
		pay_to: '01849584594',
		plan: null,
		amount_bdt: null,
		trx_id: null,
		sender_hint: null,
		submitted_at: null
	}
};

it('shows step 3: where to send money, how much, and a timer for the hold', async () => {
	render(OrderPage, { data: { order: manualOrder, token }, form: null });
	await expect.element(page.getByText('Send your bKash payment')).toBeInTheDocument();
	await expect.element(page.getByText('01849-584594')).toBeInTheDocument();
	await expect.element(page.getByRole('timer')).toHaveTextContent(/Pieces held for (19|20):\d\d/);
	await expect
		.element(page.getByRole('button', { name: 'I have sent ৳2,435' }))
		.toBeInTheDocument();
	await page.getByRole('radio', { name: /Delivery charge only/ }).click();
	await expect.element(page.getByRole('button', { name: 'I have sent ৳135' })).toBeInTheDocument();
	await expect
		.element(page.getByText('Pay ৳2,300 in cash when the parcel arrives.'))
		.toBeInTheDocument();
});

it('asks for a transaction ID or sender number before sending anything', async () => {
	render(OrderPage, { data: { order: manualOrder, token }, form: null });
	await page.getByRole('button', { name: /I have sent/ }).click();
	await expect
		.element(page.getByText('Enter the transaction ID or the bKash number you paid from.'))
		.toBeInTheDocument();
	await page.getByRole('textbox', { name: 'bKash transaction ID' }).fill('abc');
	await page.getByRole('button', { name: /I have sent/ }).click();
	await expect
		.element(
			page.getByText('A bKash transaction ID is 8 to 12 letters and numbers, like 8N7A6D5C4B.')
		)
		.toBeInTheDocument();
});

it('after sending, shows what the buyer reported and the cash still due on delivery', async () => {
	render(OrderPage, {
		data: {
			order: {
				...manualOrder,
				status: 'payment_review' as const,
				manual: {
					...manualOrder.manual,
					plan: 'delivery' as const,
					amount_bdt: 135,
					trx_id: '8N7A6D5C4B',
					sender_hint: '••••••••678',
					submitted_at: '2026-10-07 10:00:00'
				}
			},
			token
		},
		form: null
	});
	await expect.element(page.getByText('Payment sent, we are checking it')).toBeInTheDocument();
	await expect.element(page.getByText('8N7A6D5C4B')).toBeInTheDocument();
	await expect.element(page.getByRole('button', { name: /I have sent/ })).not.toBeInTheDocument();
	await expect
		.element(page.getByRole('complementary', { name: 'Order total' }).getByText('Cash on delivery'))
		.toBeInTheDocument();
	await expect.element(page.getByText('Pay ৳2,300 in cash')).toBeInTheDocument();
});

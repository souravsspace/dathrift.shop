import { page } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { leaveFor } from '../../lib/checkout/navigate';
import CheckoutPage from './+page.svelte';

vi.mock('../../lib/checkout/navigate', () => ({ leaveFor: vi.fn() }));

afterEach(() => {
	vi.unstubAllGlobals();
	vi.mocked(leaveFor).mockClear();
	window.localStorage.clear();
});

const areas = [
	{ district: 'test-dhaka', area: 'test-central', name: 'TEST ONLY — Central area', fee_bdt: 80 },
	{ district: 'test-other', area: 'test-town', name: 'TEST ONLY — Other town', fee_bdt: 130 }
];
const quote = {
	items: [{ id: 'test-shirt', slug: 'test-shirt', name: 'TEST ONLY — Shirt', price_bdt: 850 }],
	subtotal_bdt: 850,
	shipping_bdt: 80,
	total_bdt: 930,
	preview_only: true
};

function stubServer(checkout: Response) {
	const fetch = vi.fn(async (url: string) =>
		url === '/api/checkout/quote' ? Response.json(quote) : checkout
	);
	vi.stubGlobal('fetch', fetch);
	return fetch;
}

async function fillAndQuote() {
	await page.getByRole('textbox', { name: 'Name' }).fill('Test Buyer');
	await page.getByRole('textbox', { name: 'Bangladesh phone' }).fill('01712345678');
	await page.getByRole('textbox', { name: 'Address line' }).fill('Test building');
	await page
		.getByRole('combobox', { name: 'Delivery area' })
		.selectOptions('test-dhaka/test-central');
	await page.getByRole('button', { name: 'Check total' }).click();
	await expect.element(page.getByText('৳930').first()).toBeInTheDocument();
}

it('confirms a fresh total, then starts one bKash payment with a stable checkout key', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	const fetch = stubServer(
		Response.json({
			redirect_url: '/checkout/test-wallet?paymentId=TEST1',
			status_url: '/orders/x'
		})
	);
	render(CheckoutPage, { data: { checkout_enabled: true, areas } });
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Checkout');
	await fillAndQuote();
	await page.getByRole('button', { name: 'Pay ৳930 with bKash' }).click();
	await vi.waitFor(() =>
		expect(leaveFor).toHaveBeenCalledWith('/checkout/test-wallet?paymentId=TEST1')
	);
	const [, init] = fetch.mock.calls.find(([url]) => url === '/api/checkout')!;
	expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
		ids: ['test-shirt'],
		address: { district: 'test-dhaka', area: 'test-central' },
		checkout_key: expect.stringMatching(/^[0-9a-f-]{36}$/)
	});
	expect(window.localStorage.getItem('dathrift-cart')).toBe('[]');
});

it('asks the buyer to review the bag when a piece is no longer available', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	stubServer(new Response('Cart unavailable', { status: 409 }));
	render(CheckoutPage, { data: { checkout_enabled: true, areas } });
	await fillAndQuote();
	await page.getByRole('button', { name: 'Pay ৳930 with bKash' }).click();
	await expect
		.element(page.getByRole('alert'))
		.toHaveTextContent('One of these pieces is no longer available');
	expect(leaveFor).not.toHaveBeenCalled();
});

it('keeps payment off when no provider or approved area exists', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	render(CheckoutPage, { data: { checkout_enabled: false, areas: [] } });
	await expect.element(page.getByText('Payment is not enabled')).toBeInTheDocument();
	await expect.element(page.getByRole('button', { name: /with bKash/ })).not.toBeInTheDocument();
});

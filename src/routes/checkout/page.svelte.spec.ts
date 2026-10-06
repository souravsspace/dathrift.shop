import { page } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { leaveFor } from '../../lib/checkout/navigate';
import CheckoutPage from './+page.svelte';

vi.mock('../../lib/checkout/navigate', () => ({ leaveFor: vi.fn() }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), afterNavigate: vi.fn() }));

afterEach(() => {
	vi.unstubAllGlobals();
	vi.mocked(leaveFor).mockClear();
	vi.mocked(goto).mockClear();
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
	await page.getByRole('textbox', { name: 'Phone' }).fill('01712345678');
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
	render(CheckoutPage, { data: { checkout_enabled: true, manual_payment: false, areas } });
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Checkout');
	await fillAndQuote();
	await page.getByRole('button', { name: 'Pay ৳930 with bKash' }).click();
	await vi.waitFor(() =>
		expect(leaveFor).toHaveBeenCalledWith('/checkout/test-wallet?paymentId=TEST1')
	);
	const [, init] = fetch.mock.calls.find(([url]) => url === '/api/checkout') as unknown as [
		string,
		RequestInit
	];
	expect(JSON.parse(String(init.body))).toMatchObject({
		ids: ['test-shirt'],
		address: { district: 'test-dhaka', area: 'test-central' },
		checkout_key: expect.stringMatching(/^[0-9a-f-]{36}$/)
	});
	expect(window.localStorage.getItem('dathrift-cart')).toBe('[]');
});

it('asks the buyer to review the bag when a piece is no longer available', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	stubServer(new Response('Cart unavailable', { status: 409 }));
	render(CheckoutPage, { data: { checkout_enabled: true, manual_payment: false, areas } });
	await fillAndQuote();
	await page.getByRole('button', { name: 'Pay ৳930 with bKash' }).click();
	await expect
		.element(page.getByRole('alert'))
		.toHaveTextContent('One of these pieces is no longer available');
	expect(leaveFor).not.toHaveBeenCalled();
});

it('keeps payment off when no provider or approved area exists', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	render(CheckoutPage, { data: { checkout_enabled: false, manual_payment: false, areas: [] } });
	await expect.element(page.getByText('Payment is not enabled')).toBeInTheDocument();
	await expect.element(page.getByRole('button', { name: /with bKash/ })).not.toBeInTheDocument();
});

it('checks each field with the shared rules and says what to fix, before calling the server', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	const fetch = stubServer(Response.json({}));
	render(CheckoutPage, { data: { checkout_enabled: true, manual_payment: false, areas } });
	await page.getByRole('textbox', { name: 'Phone' }).fill('0255667788');
	await page.getByRole('button', { name: 'Check total' }).click();
	await expect
		.element(page.getByText('Enter an 11-digit Bangladesh mobile number, like 01712345678.'))
		.toBeInTheDocument();
	await expect.element(page.getByText('Enter the name for the delivery.')).toBeInTheDocument();
	await expect.element(page.getByText('Choose a delivery area.')).toBeInTheDocument();
	await expect.element(page.getByRole('textbox', { name: 'Name' })).toHaveFocus();
	await expect
		.element(page.getByRole('textbox', { name: 'Phone' }))
		.toHaveAttribute('aria-invalid', 'true');
	expect(fetch).not.toHaveBeenCalled();
});

it('sends the phone in its national form after a buyer types +880', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	const fetch = stubServer(Response.json({}));
	render(CheckoutPage, { data: { checkout_enabled: true, manual_payment: false, areas } });
	await page.getByRole('textbox', { name: 'Name' }).fill('Test Buyer');
	await page.getByRole('textbox', { name: 'Phone' }).fill('+880 1712-345678');
	await page.getByRole('textbox', { name: 'Address line' }).fill('Test building');
	await page
		.getByRole('combobox', { name: 'Delivery area' })
		.selectOptions('test-dhaka/test-central');
	await page.getByRole('button', { name: 'Check total' }).click();
	await expect.element(page.getByText('৳930').first()).toBeInTheDocument();
	const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
	expect(JSON.parse(String(init.body)).address.phone).toBe('01712345678');
});

it('saves the delivery address on this device and fills it in next time', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	stubServer(Response.json({}));
	const first = render(CheckoutPage, {
		data: { checkout_enabled: true, manual_payment: false, areas }
	});
	await page.getByRole('textbox', { name: 'Name' }).fill('Test Buyer');
	await page.getByRole('textbox', { name: 'Phone' }).fill('01712345678');
	await page.getByRole('textbox', { name: 'Address line' }).fill('Test building');
	await page
		.getByRole('combobox', { name: 'Delivery area' })
		.selectOptions('test-dhaka/test-central');
	await expect
		.element(page.getByRole('checkbox', { name: 'Fill it in automatically next time' }))
		.toBeChecked();
	await page.getByRole('button', { name: 'Save this address' }).click();
	await expect.element(page.getByText('Address saved on this device.')).toBeInTheDocument();
	first.unmount();

	render(CheckoutPage, { data: { checkout_enabled: true, manual_payment: false, areas } });
	await expect.element(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Test Buyer');
	await expect
		.element(page.getByRole('combobox', { name: 'Delivery area' }))
		.toHaveValue('test-dhaka/test-central');
	await expect.element(page.getByText('Filled in from your saved address.')).toBeInTheDocument();
	await page.getByRole('button', { name: 'Forget' }).click();
	expect(window.localStorage.getItem('dathrift-address')).toBeNull();
});

it('remembers the started order on this device so the buyer can find it again', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	stubServer(
		Response.json({
			redirect_url: '/checkout/test-wallet?paymentId=TEST1',
			status_url: '/orders/00000000-0000-4000-8000-000000000001'
		})
	);
	render(CheckoutPage, { data: { checkout_enabled: true, manual_payment: false, areas } });
	await fillAndQuote();
	await page.getByRole('button', { name: 'Pay ৳930 with bKash' }).click();
	await vi.waitFor(() => expect(leaveFor).toHaveBeenCalled());
	expect(JSON.parse(window.localStorage.getItem('dathrift-orders') ?? '[]')).toMatchObject([
		{
			token: '00000000-0000-4000-8000-000000000001',
			status: 'pending_payment',
			total_bdt: 930,
			items: [{ name: 'TEST ONLY — Shirt', slug: 'test-shirt' }]
		}
	]);
});

it('with manual bKash, holds the pieces and opens the order page to pay', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	stubServer(
		Response.json({
			status_url: '/orders/00000000-0000-4000-8000-000000000002',
			manual: true
		})
	);
	render(CheckoutPage, { data: { checkout_enabled: true, manual_payment: true, areas } });
	await fillAndQuote();
	await expect
		.element(page.getByText('Next, send money by bKash.', { exact: false }))
		.toBeInTheDocument();
	await page.getByRole('button', { name: 'Continue to bKash payment' }).click();
	await vi.waitFor(() =>
		expect(goto).toHaveBeenCalledWith('/orders/00000000-0000-4000-8000-000000000002')
	);
	expect(leaveFor).not.toHaveBeenCalled();
	expect(window.localStorage.getItem('dathrift-cart')).toBe('[]');
});

it('groups delivery areas by Steadfast zone', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	render(CheckoutPage, {
		data: {
			checkout_enabled: true,
			manual_payment: true,
			areas: [
				{ district: 'dhaka-city', area: 'all', name: 'Dhaka City', fee_bdt: 75 },
				{ district: 'gazipur', area: 'all', name: 'Gazipur', fee_bdt: 105 },
				{ district: 'sylhet', area: 'all', name: 'Sylhet', fee_bdt: 135 }
			]
		}
	});
	await expect
		.element(page.getByRole('option', { name: 'Dhaka City — ৳75 delivery' }))
		.toBeInTheDocument();
	const groups = [...document.querySelectorAll('optgroup')].map((group) => group.label);
	expect(groups).toEqual(['Inside Dhaka', 'Near Dhaka', 'Outside Dhaka']);
});

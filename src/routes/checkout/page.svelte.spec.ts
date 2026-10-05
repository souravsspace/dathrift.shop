import { page } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CheckoutPage from './+page.svelte';

afterEach(() => {
	vi.unstubAllGlobals();
	window.localStorage.clear();
});

it('shows a local-only delivery total without payment or stock reservation', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	vi.stubGlobal(
		'fetch',
		vi.fn(async () =>
			Response.json({
				items: [
					{ id: 'test-shirt', slug: 'test-shirt', name: 'TEST ONLY — Shirt', price_bdt: 850 }
				],
				subtotal_bdt: 850,
				shipping_bdt: 80,
				total_bdt: 930,
				preview_only: true
			})
		)
	);
	render(CheckoutPage);
	await expect
		.element(page.getByRole('heading', { level: 1 }))
		.toHaveTextContent('Delivery preview');
	await page.getByRole('textbox', { name: 'Name' }).fill('Test Buyer');
	await page.getByRole('textbox', { name: 'Bangladesh phone' }).fill('01712345678');
	await page.getByRole('textbox', { name: 'Address line' }).fill('Test building');
	await page.getByRole('button', { name: 'Check total' }).click();
	await expect.element(page.getByText('৳930')).toBeInTheDocument();
	await expect
		.element(page.getByText('TEST ONLY delivery preview — not an offer to ship.'))
		.toBeInTheDocument();
	await expect.element(page.getByText('Payment is not enabled')).toBeInTheDocument();
});

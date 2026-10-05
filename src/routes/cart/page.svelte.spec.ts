import { page } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CartPage from './+page.svelte';

afterEach(() => {
	vi.unstubAllGlobals();
	window.localStorage.clear();
});

it('shows a fresh server quote and links to checkout without holding stock', async () => {
	window.localStorage.setItem('dathrift-cart', '["test-shirt"]');
	vi.stubGlobal(
		'fetch',
		vi.fn(async () =>
			Response.json({
				items: [
					{
						id: 'test-shirt',
						slug: 'test-olive-cotton-shirt',
						name: 'TEST ONLY — Olive shirt',
						price_bdt: 850
					}
				],
				unavailable: [],
				subtotal_bdt: 850
			})
		)
	);
	render(CartPage);
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Your bag');
	await expect.element(page.getByText('TEST ONLY — Olive shirt')).toBeInTheDocument();
	await expect
		.element(page.getByRole('complementary', { name: 'Bag summary' }).getByText('৳850'))
		.toBeInTheDocument();
	await expect.element(page.getByText('Nothing is held until you pay.')).toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: 'Continue to checkout' }))
		.toHaveAttribute('href', '/checkout');
});

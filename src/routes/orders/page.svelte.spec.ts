import { page } from 'vitest/browser';
import { afterEach, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import OrdersPage from './+page.svelte';

afterEach(() => window.localStorage.clear());

it('lists the orders this device remembers, newest first, each linking to its page', async () => {
	window.localStorage.setItem(
		'dathrift-orders',
		JSON.stringify([
			{
				token: '00000000-0000-4000-8000-000000000001',
				reference: 'AB12CD34',
				status: 'paid',
				total_bdt: 2380,
				items: [{ name: 'Cream midi dress', slug: 'cream-midi-dress' }],
				created_at: '2026-10-06T10:00:00Z'
			},
			{
				token: '00000000-0000-4000-8000-000000000002',
				reference: '',
				status: 'pending_payment',
				total_bdt: 930,
				items: [{ name: 'Olive shirt', slug: 'olive-shirt' }],
				created_at: '2026-10-07T09:00:00Z'
			}
		])
	);
	render(OrdersPage);
	const links = page.getByRole('link', { name: /Order/ });
	await expect
		.element(links.first())
		.toHaveAttribute('href', '/orders/00000000-0000-4000-8000-000000000002');
	await expect.element(page.getByText('Waiting for payment · 7 Oct 2026')).toBeInTheDocument();
	await expect.element(page.getByText('Order AB12CD34')).toBeInTheDocument();
	await expect.element(page.getByText('৳2,380')).toBeInTheDocument();
});

it('explains an empty list on this device', async () => {
	render(OrdersPage);
	await expect.element(page.getByText('No orders on this device yet.')).toBeInTheDocument();
});

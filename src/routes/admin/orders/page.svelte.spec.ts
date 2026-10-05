import { page } from 'vitest/browser';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import OrdersPage from './+page.svelte';

it('lists orders with payment and fulfillment state and links to each', async () => {
	render(OrdersPage, {
		data: {
			actor: 'local-preview',
			orders: [
				{
					id: 'order-1',
					reference: 'ORDER1AB',
					status: 'paid' as const,
					total_bdt: 2380,
					preview_only: true,
					created_at: '2026-10-06 10:00:00',
					item_count: 2,
					fulfillment_state: null
				},
				{
					id: 'order-2',
					reference: 'ORDER2CD',
					status: 'payment_review' as const,
					total_bdt: 930,
					preview_only: true,
					created_at: '2026-10-06 09:00:00',
					item_count: 1,
					fulfillment_state: null
				}
			]
		}
	});
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Orders');
	await expect
		.element(page.getByRole('link', { name: 'Open order ORDER1AB' }))
		.toHaveAttribute('href', '/admin/orders/order-1');
	await expect.element(page.getByText('Needs owner review')).toBeInTheDocument();
	await expect.element(page.getByText('৳2,380')).toBeInTheDocument();
});

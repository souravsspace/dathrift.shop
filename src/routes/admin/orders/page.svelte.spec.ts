import { page } from 'vitest/browser';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import OrdersPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const order = (n: number, overrides: Record<string, unknown> = {}) => ({
	id: `order-${n}`,
	reference: `ORDER${n}AB`,
	status: 'paid' as const,
	total_bdt: 2380,
	preview_only: true,
	created_at: '2026-10-06 10:00:00',
	customer_name: 'Nusrat Jahan',
	phone: '01712345678',
	area: 'TEST ONLY — Central area',
	item_count: 2,
	fulfillment_state: null,
	...overrides
});

const data = (overrides: Record<string, unknown> = {}) => ({
	actor: 'local-preview',
	query: '',
	page: 1,
	page_size: 20,
	total: 2,
	filter: 'all' as const,
	counts: { review: 1, to_ship: 1, shipped: 0, awaiting: 0, closed: 0 },
	items: [order(1), order(2, { status: 'payment_review' as const, total_bdt: 930 })],
	...overrides
});

it('lists orders with the buyer, payment and fulfillment state and links to each', async () => {
	render(OrdersPage, { data: data() });
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Orders');
	await expect
		.element(page.getByRole('link', { name: 'Open order ORDER1AB' }))
		.toHaveAttribute('href', '/admin/orders/order-1');
	await expect.element(page.getByText('Needs owner review')).toBeInTheDocument();
	await expect.element(page.getByText('৳2,380')).toBeInTheDocument();
	await expect.element(page.getByText('Paid · to ship')).toBeInTheDocument();
	await expect.element(page.getByText('6 Oct 2026, 4:00 pm').first()).toBeInTheDocument();
	await expect.element(page.getByText('Nusrat Jahan').first()).toBeInTheDocument();
	await expect
		.element(page.getByRole('navigation', { name: 'Orders pages' }))
		.not.toBeInTheDocument();
});

it('searches orders and pages through them twenty at a time', async () => {
	render(OrdersPage, {
		data: data({ query: 'nusrat', page: 2, total: 45, items: [order(21)] })
	});
	await expect
		.element(page.getByRole('searchbox', { name: 'Find an order' }))
		.toHaveValue('nusrat');
	await expect.element(page.getByText('45 orders match “nusrat”.')).toBeInTheDocument();
	await expect.element(page.getByText('21–40 of 45')).toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: 'Newer' }))
		.toHaveAttribute('href', '/admin/orders?q=nusrat');
	await expect
		.element(page.getByRole('link', { name: 'Older' }))
		.toHaveAttribute('href', '/admin/orders?q=nusrat&page=3');
});

it('says so when no order matches', async () => {
	render(OrdersPage, { data: data({ query: 'velvet', total: 0, items: [] }) });
	await expect.element(page.getByText('No orders match.')).toBeInTheDocument();
});

it('filters by stage and keeps the search in each tab link', async () => {
	render(OrdersPage, {
		data: data({ query: 'nusrat', filter: 'review' as const, total: 1, items: [order(2)] })
	});
	await expect
		.element(page.getByRole('link', { name: /Needs review/ }))
		.toHaveAttribute('aria-current', 'page');
	await expect
		.element(page.getByRole('link', { name: /To ship/ }))
		.toHaveAttribute('href', '/admin/orders?q=nusrat&status=to_ship');
	await expect
		.element(page.getByRole('link', { name: /^All/ }))
		.toHaveAttribute('href', '/admin/orders?q=nusrat');
});

it('searches as staff type, inside the current tab', async () => {
	render(OrdersPage, { data: data({ filter: 'to_ship' as const }) });
	await page.getByRole('searchbox', { name: 'Find an order' }).fill('rafiq');
	await vi.waitFor(() =>
		expect(goto).toHaveBeenCalledWith('/admin/orders?q=rafiq&status=to_ship', {
			replace: true,
			reset: false
		})
	);
});

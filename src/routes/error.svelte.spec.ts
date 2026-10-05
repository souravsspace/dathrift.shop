import { page } from 'vitest/browser';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ErrorPage from './+error.svelte';

const state = vi.hoisted(() => ({
	page: { status: 404, error: { message: 'Product not found' } }
}));
vi.mock('$app/state', () => state);

it('explains a missing piece without exposing internals and keeps it out of the index', async () => {
	render(ErrorPage);
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Not found');
	await expect.element(page.getByRole('link', { name: 'Back to the edit' })).toBeInTheDocument();
	expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
		'noindex'
	);
});

it('treats an outage as temporary rather than an empty shop', async () => {
	Object.assign(state.page, { status: 503, error: { message: 'Catalog unavailable' } });
	render(ErrorPage);
	await expect
		.element(page.getByRole('heading', { level: 1 }))
		.toHaveTextContent('Temporarily unavailable');
	await expect.element(page.getByText('Nothing was charged')).toBeInTheDocument();
});

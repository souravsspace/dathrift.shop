import { page } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AdminPage from './+page.svelte';

afterEach(() => vi.unstubAllGlobals());

it('shows private draft rows and creates a local test draft without publishing it', async () => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (_url: string, options?: RequestInit) =>
			options?.method === 'POST'
				? Response.json(
						{ id: 'test-new', slug: 'test-new-top', publication_state: 'draft' },
						{ status: 201 }
					)
				: Response.json([
						{
							id: 'test-old',
							slug: 'test-old-top',
							name: 'TEST ONLY — Old top',
							category: 'tops',
							price_bdt: 800,
							publication_state: 'draft',
							stock_state: 'available'
						}
					])
		)
	);
	render(AdminPage, { data: { actor: 'local-preview' } });
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Product desk');
	await expect.element(page.getByText('TEST ONLY — Old top')).toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: 'Edit TEST ONLY — Old top' }))
		.toHaveAttribute('href', '/admin/products/test-old');
	await page.getByRole('textbox', { name: 'Name' }).fill('TEST ONLY — New top');
	await page.getByRole('textbox', { name: 'Slug' }).fill('test-new-top');
	await page.getByRole('spinbutton', { name: 'Price in BDT' }).fill('900');
	await page.getByRole('button', { name: 'Create draft' }).click();
	await expect.element(page.getByText('Draft created')).toBeInTheDocument();
});

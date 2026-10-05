import { page } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ProductEditor from './+page.svelte';

afterEach(() => vi.unstubAllGlobals());

it('loads a private draft, saves details, and presents publication only after saving', async () => {
	const calls: string[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, options?: RequestInit) => {
			calls.push(`${options?.method ?? 'GET'} ${url}`);
			if (options?.method === 'PATCH')
				return Response.json({ id: 'test-draft', publication_state: 'draft' });
			if (options?.method === 'POST' && url.endsWith('/external-sale'))
				return Response.json({ product_id: 'test-draft', state: 'sold' });
			if (options?.method === 'POST')
				return Response.json({ id: 'test-draft', publication_state: 'published' });
			return Response.json({
				id: 'test-draft',
				slug: 'test-skirt',
				name: 'TEST ONLY — Skirt',
				category: 'bottoms',
				price_bdt: 900,
				publication_state: 'draft',
				stock_state: 'available',
				brand: null,
				description: 'Local garment',
				condition_notes: 'Small mark',
				size_label: 'M',
				measurements_json: '{"waist_cm":76,"inseam_cm":67}',
				fit_note: 'Relaxed',
				photos: [{ position: 1, r2_key: 'test-only/skirt.webp', alt_text: 'TEST ONLY skirt' }]
			});
		})
	);
	render(ProductEditor, { data: { actor: 'local-preview', id: 'test-draft' } });
	await expect
		.element(page.getByRole('heading', { level: 1 }))
		.toHaveTextContent('TEST ONLY — Skirt');
	await page.getByRole('textbox', { name: 'Condition and flaws' }).fill('Visible repaired hem');
	await page.getByRole('button', { name: 'Save details' }).click();
	await expect.element(page.getByText('Draft details saved')).toBeInTheDocument();
	await page.getByRole('button', { name: 'Publish piece' }).click();
	await expect.element(page.getByText('Piece published')).toBeInTheDocument();
	await page.getByRole('textbox', { name: 'External sale reason' }).fill('Sold in person');
	await page.getByRole('button', { name: 'Mark sold externally' }).click();
	await expect.element(page.getByText('Recorded as sold externally')).toBeInTheDocument();
	expect(calls).toContain('PATCH /admin/api/products/test-draft');
	expect(calls).toContain('POST /admin/api/products/test-draft/publication');
	expect(calls).toContain('POST /admin/api/products/test-draft/external-sale');
});

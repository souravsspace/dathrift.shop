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

it('corrects a published slug and explains the old URL keeps redirecting', async () => {
	const fetch = vi.fn(async (url: string, options?: RequestInit) => {
		if (options?.method === 'POST' && url.endsWith('/slug'))
			return Response.json({ id: 'test-shirt', slug: 'olive-shirt' });
		return Response.json({
			id: 'test-shirt',
			slug: 'olive-shrit',
			name: 'TEST ONLY — Shirt',
			category: 'tops',
			price_bdt: 850,
			publication_state: 'published',
			stock_state: 'available',
			brand: null,
			description: 'Local garment',
			condition_notes: 'Small mark',
			size_label: 'L',
			measurements_json: '{"chest_cm":100,"length_cm":70}',
			fit_note: 'Boxy',
			photos: []
		});
	});
	vi.stubGlobal('fetch', fetch);
	render(ProductEditor, { data: { actor: 'local-preview', id: 'test-shirt' } });
	await page.getByRole('textbox', { name: 'Corrected slug' }).fill('olive-shirt');
	await page.getByRole('button', { name: 'Correct slug' }).click();
	await expect
		.element(page.getByText('Slug corrected. The old URL now redirects here.'))
		.toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: 'View public page' }))
		.toHaveAttribute('href', '/products/olive-shirt');
	expect(fetch).toHaveBeenCalledWith(
		'/admin/api/products/test-shirt/slug',
		expect.objectContaining({ method: 'POST', body: JSON.stringify({ slug: 'olive-shirt' }) })
	);
});

const draftWithPhoto = (overrides: Record<string, unknown> = {}) => ({
	id: 'test-draft',
	slug: 'test-skirt',
	name: 'TEST ONLY — Skirt',
	category: 'bottoms',
	price_bdt: 900,
	publication_state: 'draft',
	stock_state: 'available',
	featured: false,
	brand: null,
	description: 'Local garment',
	condition_notes: 'Small mark',
	size_label: 'M',
	measurements_json: '{"waist_cm":76,"inseam_cm":67}',
	fit_note: 'Relaxed',
	photos: [],
	...overrides
});

async function pngFile() {
	const canvas = document.createElement('canvas');
	canvas.width = 2400;
	canvas.height = 3000;
	canvas.getContext('2d')!.fillRect(0, 0, 2400, 3000);
	const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
	return new File([blob], 'hem.png', { type: 'image/png' });
}

it('converts any picked image to WebP before uploading it', async () => {
	let uploaded: File | null = null;
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, options?: RequestInit) => {
			if (options?.method === 'POST' && url.endsWith('/photos')) {
				uploaded = (options.body as FormData).get('photo') as File;
				return Response.json(
					{ position: 1, r2_key: 'products/test-draft/a.webp', alt_text: 'TEST ONLY hem' },
					{ status: 201 }
				);
			}
			return Response.json(draftWithPhoto());
		})
	);
	render(ProductEditor, { data: { actor: 'local-preview', id: 'test-draft' } });
	await page.getByLabelText('Add photo').upload(await pngFile());
	await expect.element(page.getByText(/WebP · 1600 × 2000/)).toBeInTheDocument();
	await page.getByRole('textbox', { name: 'Photo description' }).fill('TEST ONLY hem');
	await page.getByRole('button', { name: 'Upload photo' }).click();
	await expect.element(page.getByText('Photo uploaded')).toBeInTheDocument();
	expect(uploaded).not.toBeNull();
	expect(uploaded!.type).toBe('image/webp');
	expect(uploaded!.name).toBe('hem.webp');
});

it('features a published piece on the home page and removes it again', async () => {
	const calls: string[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, options?: RequestInit) => {
			if (options?.method === 'POST' && url.endsWith('/feature')) {
				calls.push(String(options.body));
				const { featured } = JSON.parse(String(options.body)) as { featured: boolean };
				return Response.json(featured ? { id: 'test-draft', featured } : { featured });
			}
			return Response.json(draftWithPhoto({ publication_state: 'published' }));
		})
	);
	render(ProductEditor, { data: { actor: 'local-preview', id: 'test-draft' } });
	await page.getByRole('button', { name: 'Feature on home page' }).click();
	await expect.element(page.getByText('Leads the home page')).toBeInTheDocument();
	await page.getByRole('button', { name: 'Remove from home page' }).click();
	await expect
		.element(page.getByRole('button', { name: 'Feature on home page' }))
		.toBeInTheDocument();
	expect(calls).toEqual(['{"featured":true}', '{"featured":false}']);
});

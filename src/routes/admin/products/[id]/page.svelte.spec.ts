import { page } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import ProductEditor from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

afterEach(() => {
	vi.unstubAllGlobals();
	vi.mocked(goto).mockClear();
});

const categories = [
	{ slug: 'bags', name: 'Bags', measurement_set: 'none' },
	{ slug: 'bottoms', name: 'Bottoms', measurement_set: 'bottom' },
	{ slug: 'tops', name: 'Tops', measurement_set: 'top' }
];

const piece = (overrides: Record<string, unknown> = {}) => ({
	id: 'test-draft',
	slug: 'test-skirt',
	name: 'TEST ONLY — Skirt',
	category: 'bottoms',
	category_name: 'Bottoms',
	measurement_set: 'bottom',
	price_bdt: 900,
	publication_state: 'draft',
	stock_state: 'available',
	featured: false,
	brand: null,
	description: 'Local garment',
	condition_notes: 'Small mark',
	size_label: 'M',
	measurements_json: '{"waist_in":30,"inseam_in":26.5}',
	fit_note: 'Relaxed',
	has_history: false,
	photos: [],
	...overrides
});

type Handler = (options: RequestInit) => Response;

// Routes each request by "METHOD path"; unrouted writes fail loudly.
function editor(product: ReturnType<typeof piece>, routes: Record<string, Handler> = {}) {
	const fetch = vi.fn(async (url: string, options: RequestInit = {}) => {
		const key = `${options.method ?? 'GET'} ${url}`;
		if (routes[key]) return routes[key](options);
		if (key === 'GET /admin/api/categories') return Response.json(categories);
		if (key === `GET /admin/api/products/${product.id}`) return Response.json(product);
		return new Response('Unexpected request', { status: 500 });
	});
	vi.stubGlobal('fetch', fetch);
	render(ProductEditor, { data: { actor: 'local-preview', id: product.id } });
	return fetch;
}

const sentBody = (fetch: ReturnType<typeof editor>, key: string) => {
	const call = fetch.mock.calls.find(([url, options]) => `${options?.method} ${url}` === key);
	return call ? JSON.parse(String(call[1]?.body)) : undefined;
};

it('saves details with measurements in inches, then publishes and records an outside sale', async () => {
	const fetch = editor(piece(), {
		'PATCH /admin/api/products/test-draft': () =>
			Response.json({ id: 'test-draft', publication_state: 'draft' }),
		'POST /admin/api/products/test-draft/publication': () =>
			Response.json({ id: 'test-draft', publication_state: 'published' }),
		'POST /admin/api/products/test-draft/external-sale': () =>
			Response.json({ product_id: 'test-draft', state: 'sold' })
	});
	await expect
		.element(page.getByRole('heading', { level: 1 }))
		.toHaveTextContent('TEST ONLY — Skirt');
	const waist = page.getByRole('spinbutton', { name: 'Waist (in)' });
	await expect.element(waist).toHaveValue(30);
	await expect.element(waist).toHaveAttribute('step', '0.5');
	await expect.element(page.getByRole('spinbutton', { name: 'Price (৳)' })).toHaveValue(900);
	await waist.fill('30.5');
	await page
		.getByRole('textbox', { name: 'Condition and flaws (optional)' })
		.fill('Visible repaired hem');
	await page.getByRole('button', { name: 'Save details' }).click();
	await expect.element(page.getByText('Draft details saved')).toBeInTheDocument();
	expect(sentBody(fetch, 'PATCH /admin/api/products/test-draft')).toMatchObject({
		category: 'bottoms',
		condition_notes: 'Visible repaired hem',
		measurements_json: '{"waist_in":30.5,"inseam_in":26.5}'
	});
	await page.getByRole('button', { name: 'Publish piece' }).click();
	await expect.element(page.getByText('Piece published')).toBeInTheDocument();
	await page.getByRole('textbox', { name: 'External sale reason' }).fill('Sold in person');
	await page.getByRole('button', { name: 'Mark sold externally' }).click();
	await expect.element(page.getByText('Recorded as sold externally')).toBeInTheDocument();
});

it('asks only for the measurements the chosen category needs', async () => {
	const fetch = editor(piece(), {
		'PATCH /admin/api/products/test-draft': () =>
			Response.json({ id: 'test-draft', publication_state: 'draft' })
	});
	const category = page.getByRole('combobox', { name: 'Category' });
	await expect.element(category).toHaveValue('bottoms');
	await category.selectOptions('tops');
	await expect.element(page.getByRole('spinbutton', { name: 'Chest (in)' })).toBeInTheDocument();
	await expect
		.element(page.getByRole('spinbutton', { name: 'Waist (in)' }))
		.not.toBeInTheDocument();
	await category.selectOptions('bags');
	await expect.element(page.getByText('Bags need no measurements.')).toBeInTheDocument();
	await page.getByRole('button', { name: 'Save details' }).click();
	await expect.element(page.getByText('Draft details saved')).toBeInTheDocument();
	expect(sentBody(fetch, 'PATCH /admin/api/products/test-draft')).toMatchObject({
		category: 'bags',
		measurements_json: null
	});
});

it('changes a draft slug without a redirect', async () => {
	const fetch = editor(piece(), {
		'POST /admin/api/products/test-draft/slug': () =>
			Response.json({ id: 'test-draft', slug: 'test-red-skirt' })
	});
	const slug = page.getByRole('textbox', { name: 'Slug' });
	await expect.element(slug).toHaveValue('test-skirt');
	await slug.fill('test-red-skirt');
	await page.getByRole('button', { name: 'Change slug' }).click();
	await expect.element(page.getByText('Slug changed')).toBeInTheDocument();
	await expect.element(page.getByText('/products/test-red-skirt')).toBeInTheDocument();
	expect(sentBody(fetch, 'POST /admin/api/products/test-draft/slug')).toEqual({
		slug: 'test-red-skirt'
	});
});

it('corrects a published slug and explains the old URL keeps redirecting', async () => {
	const fetch = editor(
		piece({
			id: 'test-shirt',
			slug: 'olive-shrit',
			category: 'tops',
			measurement_set: 'top',
			publication_state: 'published',
			measurements_json: '{"chest_in":39.5,"length_in":27.5}'
		}),
		{
			'POST /admin/api/products/test-shirt/slug': () =>
				Response.json({ id: 'test-shirt', slug: 'olive-shirt' })
		}
	);
	await page.getByRole('textbox', { name: 'Corrected slug' }).fill('olive-shirt');
	await page.getByRole('button', { name: 'Correct slug' }).click();
	await expect
		.element(page.getByText('Slug corrected. The old URL now redirects here.'))
		.toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: 'View public page' }))
		.toHaveAttribute('href', '/products/olive-shirt');
	expect(sentBody(fetch, 'POST /admin/api/products/test-shirt/slug')).toEqual({
		slug: 'olive-shirt'
	});
});

const photo = (n: number) => ({
	position: n,
	r2_key: `products/test-draft/${n}.webp`,
	alt_text: `TEST ONLY view ${n}`
});

it('makes any photo the cover the shop shows first', async () => {
	const photos = [1, 2, 3].map(photo);
	const fetch = editor(piece({ photos }), {
		'POST /admin/api/products/test-draft/photos/cover': () =>
			Response.json(
				[photos[2], photos[0], photos[1]].map((item, i) => ({ ...item, position: i + 1 }))
			)
	});
	const figures = () =>
		[...document.querySelectorAll('.admin-photo-grid img')].map((img) => img.getAttribute('alt'));
	await expect.element(page.getByText('Cover', { exact: true })).toBeInTheDocument();
	expect(figures()).toEqual(['TEST ONLY view 1', 'TEST ONLY view 2', 'TEST ONLY view 3']);
	await page.getByRole('button', { name: 'Make photo 3 the cover' }).click();
	await expect.element(page.getByText('Cover photo changed')).toBeInTheDocument();
	expect(figures()).toEqual(['TEST ONLY view 3', 'TEST ONLY view 1', 'TEST ONLY view 2']);
	expect(sentBody(fetch, 'POST /admin/api/products/test-draft/photos/cover')).toEqual({
		r2_key: 'products/test-draft/3.webp'
	});
	await expect
		.element(page.getByRole('button', { name: 'Make photo 1 the cover' }))
		.not.toBeInTheDocument();
});

it('stops taking photos at ten and accepts HEIC files', async () => {
	editor(piece({ photos: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(photo) }));
	await expect.element(page.getByText('9 of 10 photos')).toBeInTheDocument();
	expect(document.querySelector('#photo-file')?.getAttribute('accept')).toContain('.heic');
	vi.unstubAllGlobals();
	document.body.innerHTML = '';
	editor(piece({ photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(photo) }));
	await expect.element(page.getByText('10 of 10 photos')).toBeInTheDocument();
	await expect.element(page.getByLabelText('Add photo')).not.toBeInTheDocument();
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
	editor(piece(), {
		'POST /admin/api/products/test-draft/photos': (options) => {
			uploaded = (options.body as FormData).get('photo') as File;
			return Response.json(
				{ position: 1, r2_key: 'products/test-draft/a.webp', alt_text: '' },
				{ status: 201 }
			);
		}
	});
	await page.getByLabelText('Add photo').upload(await pngFile());
	await expect.element(page.getByText(/WebP · 1600 × 2000/)).toBeInTheDocument();
	await page.getByRole('button', { name: 'Upload photo' }).click();
	await expect.element(page.getByText('Photo uploaded')).toBeInTheDocument();
	expect(uploaded).not.toBeNull();
	expect(uploaded!.type).toBe('image/webp');
	expect(uploaded!.name).toBe('hem.webp');
});

it('features a published piece on the home page and removes it again', async () => {
	const calls: string[] = [];
	editor(piece({ publication_state: 'published' }), {
		'POST /admin/api/products/test-draft/feature': (options) => {
			calls.push(String(options.body));
			const { featured } = JSON.parse(String(options.body)) as { featured: boolean };
			return Response.json({ id: 'test-draft', featured });
		}
	});
	await page.getByRole('button', { name: 'Feature on home page' }).click();
	await expect.element(page.getByText('Leads the home page')).toBeInTheDocument();
	await page.getByRole('button', { name: 'Remove from home page' }).click();
	await expect
		.element(page.getByRole('button', { name: 'Feature on home page' }))
		.toBeInTheDocument();
	expect(calls).toEqual(['{"featured":true}', '{"featured":false}']);
});

it('edits a live piece in place and explains what a live page needs', async () => {
	let status = 200;
	const fetch = editor(piece({ publication_state: 'published', photos: [photo(1)] }), {
		'PATCH /admin/api/products/test-draft': () =>
			status === 200
				? Response.json({ id: 'test-draft', publication_state: 'published' })
				: new Response('Incomplete product', { status })
	});
	const price = page.getByRole('spinbutton', { name: 'Price (৳)' });
	await expect.element(price).toBeEnabled();
	await price.fill('850');
	await page.getByRole('button', { name: 'Save live page' }).click();
	await expect.element(page.getByText('Live page updated')).toBeInTheDocument();
	expect(sentBody(fetch, 'PATCH /admin/api/products/test-draft')).toMatchObject({ price_bdt: 850 });
	status = 422;
	await page.getByRole('spinbutton', { name: 'Waist (in)' }).fill('');
	await page.getByRole('button', { name: 'Save live page' }).click();
	await expect
		.element(page.getByRole('alert'))
		.toHaveTextContent('A live piece needs a name, price');
});

it('locks a piece held in checkout and says why', async () => {
	editor(piece({ publication_state: 'published', stock_state: 'reserved', photos: [photo(1)] }));
	await expect
		.element(page.getByText('A buyer is paying for this piece right now.', { exact: false }))
		.toBeInTheDocument();
	await expect.element(page.getByRole('textbox', { name: 'Name' })).toBeDisabled();
	await expect.element(page.getByRole('button', { name: 'Unpublish piece' })).toBeDisabled();
	await expect
		.element(page.getByRole('button', { name: 'Remove photo 1' }))
		.not.toBeInTheDocument();
});

it('removes a photo only after staff confirm it', async () => {
	const photos = [1, 2].map(photo);
	const fetch = editor(piece({ photos }), {
		'DELETE /admin/api/products/test-draft/photos': () =>
			Response.json([{ ...photos[1], position: 1 }])
	});
	await page.getByRole('button', { name: 'Remove photo 1' }).click();
	expect(sentBody(fetch, 'DELETE /admin/api/products/test-draft/photos')).toBeUndefined();
	await page.getByRole('button', { name: 'Keep photo 1' }).click();
	await page.getByRole('button', { name: 'Remove photo 1' }).click();
	await page.getByRole('button', { name: 'Confirm removing photo 1' }).click();
	await expect.element(page.getByText('Photo removed')).toBeInTheDocument();
	expect(sentBody(fetch, 'DELETE /admin/api/products/test-draft/photos')).toEqual({
		r2_key: 'products/test-draft/1.webp'
	});
	const alts = [...document.querySelectorAll('.admin-photo-grid img')].map((img) =>
		img.getAttribute('alt')
	);
	expect(alts).toEqual(['TEST ONLY view 2']);
});

it('keeps the last photo on a live piece', async () => {
	editor(piece({ publication_state: 'published', photos: [photo(1)] }));
	await expect.element(page.getByRole('button', { name: 'Remove photo 1' })).toBeDisabled();
	await expect
		.element(page.getByText('A live piece keeps at least one photo.'))
		.toBeInTheDocument();
});

it('lets staff unpublish a sold piece', async () => {
	editor(piece({ publication_state: 'published', stock_state: 'sold', photos: [photo(1)] }), {
		'POST /admin/api/products/test-draft/publication': () =>
			Response.json({ id: 'test-draft', publication_state: 'draft' })
	});
	await page.getByRole('button', { name: 'Unpublish piece' }).click();
	await expect.element(page.getByText('Piece unpublished')).toBeInTheDocument();
});

it('deletes a never-sold piece after confirmation and returns to the desk', async () => {
	const fetch = editor(piece(), {
		'DELETE /admin/api/products/test-draft': () => Response.json({ outcome: 'deleted' })
	});
	await page.getByRole('button', { name: 'Delete piece' }).click();
	expect(fetch.mock.calls.some(([, options]) => options?.method === 'DELETE')).toBe(false);
	await page.getByRole('button', { name: 'Delete for good' }).click();
	await vi.waitFor(() => expect(goto).toHaveBeenCalledWith('/admin'));
});

it('archives a piece with sales history instead of deleting it', async () => {
	editor(piece({ has_history: true, stock_state: 'sold' }), {
		'DELETE /admin/api/products/test-draft': () => Response.json({ outcome: 'archived' })
	});
	await expect.element(page.getByRole('button', { name: 'Delete piece' })).not.toBeInTheDocument();
	await page.getByRole('button', { name: 'Archive piece' }).click();
	await page.getByRole('button', { name: 'Archive it' }).click();
	await vi.waitFor(() => expect(goto).toHaveBeenCalledWith('/admin'));
});

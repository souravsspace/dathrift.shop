import { page } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import AdminPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

afterEach(() => {
	vi.unstubAllGlobals();
	vi.mocked(goto).mockClear();
});

const rows = [
	{
		id: 'test-old',
		slug: 'test-old-top',
		name: 'TEST ONLY — Old top',
		category: 'tops',
		category_name: 'Tops',
		price_bdt: 800,
		publication_state: 'draft',
		stock_state: 'available'
	}
];
const categories = [
	{ slug: 'bottoms', name: 'Bottoms', measurement_set: 'bottom' },
	{ slug: 'tops', name: 'Tops', measurement_set: 'top' }
];

function desk(overrides: Record<string, () => Response> = {}) {
	const fetch = vi.fn(async (url: string, options?: RequestInit) => {
		const key = `${options?.method ?? 'GET'} ${url}`;
		if (overrides[key]) return overrides[key]();
		if (key === 'GET /admin/api/products') return Response.json(rows);
		if (key === 'GET /admin/api/categories') return Response.json(categories);
		if (key === 'POST /admin/api/products')
			return Response.json(
				{ id: 'test-new', slug: 'test-new-top', publication_state: 'draft' },
				{ status: 201 }
			);
		return new Response('Not found', { status: 404 });
	});
	vi.stubGlobal('fetch', fetch);
	render(AdminPage, { data: { actor: 'local-preview' } });
	return fetch;
}

it('fills the slug from the name, keeps a typed slug, and opens the new draft to finish it', async () => {
	const fetch = desk();
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Product desk');
	await expect.element(page.getByText('TEST ONLY — Old top')).toBeInTheDocument();
	await expect.element(page.getByText('Tops / test-old-top')).toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: 'Edit TEST ONLY — Old top' }))
		.toHaveAttribute('href', '/admin/products/test-old');
	const name = page.getByRole('textbox', { name: 'Name', exact: true });
	const slug = page.getByRole('textbox', { name: 'Slug' });
	await name.fill('TEST ONLY — Green shirt');
	await expect.element(slug).toHaveValue('test-only-green-shirt');
	await slug.fill('test-green-shirt');
	await name.fill('TEST ONLY — Green linen shirt');
	await expect.element(slug).toHaveValue('test-green-shirt');
	await expect
		.element(page.getByRole('combobox', { name: 'Category' }))
		.toHaveTextContent('Bottoms');
	await page.getByRole('combobox', { name: 'Category' }).selectOptions('tops');
	await page.getByRole('spinbutton', { name: 'Price (৳)' }).fill('900');
	await page.getByRole('button', { name: 'Create draft' }).click();
	await vi.waitFor(() => expect(goto).toHaveBeenCalledWith('/admin/products/test-new'));
	expect(fetch).toHaveBeenCalledWith('/admin/api/products', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			name: 'TEST ONLY — Green linen shirt',
			slug: 'test-green-shirt',
			category: 'tops',
			price_bdt: 900
		})
	});
});

it('says plainly when the slug is already used', async () => {
	desk({
		'POST /admin/api/products': () => new Response('Slug unavailable', { status: 409 })
	});
	await page.getByRole('textbox', { name: 'Name', exact: true }).fill('TEST ONLY — Old top');
	await page.getByRole('spinbutton', { name: 'Price (৳)' }).fill('900');
	await page.getByRole('button', { name: 'Create draft' }).click();
	await expect
		.element(page.getByRole('alert'))
		.toHaveTextContent('That slug is already used. Change it and try again.');
	expect(goto).not.toHaveBeenCalled();
});

it('adds a category with its measurements and picks it for the next draft', async () => {
	const fetch = desk({
		'POST /admin/api/categories': () =>
			Response.json({ slug: 'sarees', name: 'Sarees', measurement_set: 'none' }, { status: 201 })
	});
	await expect.element(page.getByText('Waist and inseam')).toBeInTheDocument();
	await page.getByRole('textbox', { name: 'Category name' }).fill('Sarees');
	await page.getByRole('radio', { name: 'No measurements' }).click();
	await page.getByRole('button', { name: 'Add category' }).click();
	await expect.element(page.getByText('Sarees added')).toBeInTheDocument();
	expect(fetch).toHaveBeenCalledWith('/admin/api/categories', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name: 'Sarees', measurement_set: 'none' })
	});
	await expect.element(page.getByRole('combobox', { name: 'Category' })).toHaveValue('sarees');
});

it('shows a list error instead of an empty desk when pieces cannot load', async () => {
	desk({ 'GET /admin/api/products': () => new Response('Catalog unavailable', { status: 503 }) });
	await expect
		.element(page.getByText('Could not load pieces. Refresh to try again.'))
		.toBeInTheDocument();
	await expect.element(page.getByText('No pieces yet')).not.toBeInTheDocument();
});

it('sorts the desk by state, finds a piece by name and shows its cover', async () => {
	const piece = (id: string, name: string, extra: Record<string, unknown>) => ({
		...rows[0],
		id,
		slug: `test-${id}`,
		name,
		cover_key: null,
		...extra
	});
	desk({
		'GET /admin/api/products': () =>
			Response.json([
				piece('a', 'TEST ONLY — Linen shirt', { cover_key: 'products/a/1.webp' }),
				piece('b', 'TEST ONLY — Wool coat', { publication_state: 'published' }),
				piece('c', 'TEST ONLY — Denim skirt', {
					publication_state: 'published',
					stock_state: 'sold'
				})
			])
	});
	await expect.element(page.getByText('3 pieces · 1 live · 1 draft · 1 sold')).toBeInTheDocument();
	await expect
		.element(page.getByRole('img', { name: 'TEST ONLY — Linen shirt' }))
		.toHaveAttribute('src', '/media/products/a/1.webp');
	const listed = () =>
		[...document.querySelectorAll('.desk-row strong')].map((node) => node.textContent);
	await page.getByRole('button', { name: 'Live 1' }).click();
	expect(listed()).toEqual(['TEST ONLY — Wool coat']);
	await page.getByRole('button', { name: 'Sold 1' }).click();
	expect(listed()).toEqual(['TEST ONLY — Denim skirt']);
	await page.getByRole('button', { name: 'All 3' }).click();
	await page.getByRole('searchbox', { name: 'Find a piece' }).fill('linen');
	expect(listed()).toEqual(['TEST ONLY — Linen shirt']);
	await page.getByRole('searchbox', { name: 'Find a piece' }).fill('velvet');
	await expect.element(page.getByText('No pieces match.')).toBeInTheDocument();
});

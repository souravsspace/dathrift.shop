import { page } from 'vitest/browser';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import AdminPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

beforeEach(async () => {
	await page.viewport(1280, 900);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.mocked(goto).mockClear();
});

const row = (overrides: Record<string, unknown> = {}) => ({
	id: 'test-old',
	code: 'OC2026001',
	slug: 'test-old-top',
	name: 'TEST ONLY — Old top',
	category: 'tops',
	category_name: 'Tops',
	price_bdt: 800,
	publication_state: 'draft',
	stock_state: 'available',
	size_label: 'M',
	cover_key: null,
	...overrides
});
const listing = (items = [row()], extra: Record<string, unknown> = {}) => ({
	items,
	total: items.length,
	page: 1,
	page_size: 20,
	counts: { draft: items.length, live: 0, sold: 0, held: 0 },
	...extra
});
const categories = [
	{ slug: 'bottoms', name: 'Bottoms', measurement_set: 'bottom' },
	{ slug: 'tops', name: 'Tops', measurement_set: 'top' }
];

type Handler = (url: URL) => Response;

// Routes each request by "METHOD path"; the list handler also sees the query string.
function desk(overrides: Record<string, Handler> = {}) {
	const fetch = vi.fn(async (input: string, options?: RequestInit) => {
		const url = new URL(input, 'http://127.0.0.1');
		const key = `${options?.method ?? 'GET'} ${url.pathname}`;
		if (overrides[key]) return overrides[key](url);
		if (key === 'GET /admin/api/products') return Response.json(listing());
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

const listRequests = (fetch: ReturnType<typeof desk>) =>
	fetch.mock.calls
		.map(([input, options]) => ({ url: new URL(input, 'http://127.0.0.1'), options }))
		.filter(({ url, options }) => url.pathname === '/admin/api/products' && !options?.method)
		.map(({ url }) => Object.fromEntries(url.searchParams));

it('fills the slug from the name, keeps a typed slug, and opens the new draft to finish it', async () => {
	const fetch = desk();
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Product desk');
	await expect.element(page.getByText('TEST ONLY — Old top')).toBeInTheDocument();
	await expect.element(page.getByText('OC2026001 · Tops · Size M')).toBeInTheDocument();
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

it('asks the server for one state, a search or the next twenty pieces', async () => {
	const fetch = desk({
		'GET /admin/api/products': (url) =>
			Response.json(
				listing(
					[row({ cover_key: url.searchParams.get('page') === '2' ? null : 'products/a/1.webp' })],
					{
						total: 45,
						page: Number(url.searchParams.get('page') ?? 1),
						counts: { draft: 40, live: 3, sold: 2, held: 0 }
					}
				)
			)
	});
	await expect
		.element(page.getByText('45 pieces · 3 live · 40 drafts · 2 sold'))
		.toBeInTheDocument();
	await expect
		.element(page.getByRole('img', { name: 'TEST ONLY — Old top' }))
		.toHaveAttribute('src', '/media/products/a/1.webp');
	await expect.element(page.getByText('1–20 of 45')).toBeInTheDocument();
	await page.getByRole('button', { name: 'Older' }).click();
	await expect.element(page.getByText('21–40 of 45')).toBeInTheDocument();
	await page.getByRole('button', { name: 'Live 3' }).click();
	await page.getByRole('searchbox', { name: 'Find a piece' }).fill('oc2026');
	await vi.waitFor(() =>
		expect(listRequests(fetch).at(-1)).toEqual({ page: '1', status: 'live', q: 'oc2026' })
	);
	expect(listRequests(fetch)).toContainEqual({ page: '2', status: 'all', q: '' });
});

it('says so when no piece matches', async () => {
	desk({
		'GET /admin/api/products': (url) =>
			Response.json(
				url.searchParams.get('q')
					? listing([], { counts: { draft: 1, live: 0, sold: 0, held: 0 } })
					: listing()
			)
	});
	await page.getByRole('searchbox', { name: 'Find a piece' }).fill('velvet');
	await expect.element(page.getByText('No pieces match.')).toBeInTheDocument();
});

it('opens New piece and Categories as sheets on a phone', async () => {
	await page.viewport(390, 844);
	desk();
	await expect.element(page.getByText('TEST ONLY — Old top')).toBeInTheDocument();
	await expect
		.element(page.getByRole('textbox', { name: 'Name', exact: true }))
		.not.toBeInTheDocument();
	await page.getByRole('button', { name: 'New piece' }).click();
	const sheet = page.getByRole('dialog', { name: 'New piece' });
	await expect.element(sheet).toBeVisible();
	await expect.element(sheet.getByRole('textbox', { name: 'Name', exact: true })).toHaveFocus();
	await sheet.getByRole('button', { name: 'Close' }).click();
	await expect.element(sheet).not.toBeInTheDocument();
	await page.getByRole('button', { name: 'Categories' }).click();
	await expect
		.element(
			page
				.getByRole('dialog', { name: 'Categories' })
				.getByRole('textbox', { name: 'Category name' })
		)
		.toBeVisible();
});

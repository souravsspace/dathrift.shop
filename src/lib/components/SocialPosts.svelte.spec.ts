import { page } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '../../routes/layout.css';
import SocialPosts from './SocialPosts.svelte';

afterEach(() => {
	vi.unstubAllGlobals();
});

const product = {
	id: 'test-shirt',
	code: 'OC2026005',
	slug: 'test-denim-shirt',
	name: 'TEST ONLY — Denim shirt',
	brand: 'Levis',
	category_name: 'Shirts',
	size_label: 'M',
	measurements_json: '{"chest_in":21,"length_in":28}',
	condition_notes: 'Small mark',
	description: 'Washed soft, faded just right.',
	fit_note: null,
	price_bdt: 1200,
	publication_state: 'published' as const,
	photos: [{ r2_key: 'test-only/a.webp' }, { r2_key: 'test-only/b.webp' }]
};

type Handler = (options: RequestInit) => Response;

function panel(routes: Record<string, Handler> = {}) {
	const fetch = vi.fn(async (url: string, options: RequestInit = {}) => {
		const key = `${options.method ?? 'GET'} ${url}`;
		if (routes[key]) return routes[key](options);
		if (key === 'GET /admin/api/products/test-shirt/social') return Response.json([]);
		return new Response('Unexpected request', { status: 500 });
	});
	vi.stubGlobal('fetch', fetch);
	const onmessage = vi.fn();
	const onerror = vi.fn();
	render(SocialPosts, { product, onmessage, onerror });
	return { fetch, onmessage, onerror };
}

it('offers eight formats and writes each caption from the listing', async () => {
	panel();
	for (const name of [
		'Instagram post 1:1',
		'Instagram post 4:5',
		'Instagram story',
		'Facebook post 1:1',
		'Facebook post 16:9',
		'Facebook story',
		'Facebook Marketplace',
		'Original size'
	])
		await expect
			.element(page.getByRole('button', { name: new RegExp(`^${name}, `) }))
			.toBeInTheDocument();
	const caption = page.getByLabelText('Caption for Instagram post 1:1');
	await expect.element(caption).toHaveValue(expect.stringContaining('৳1,200'));
	await expect.element(caption).toHaveValue(expect.stringContaining('দাম'));
	await expect.element(page.getByText('Download all 2 (ZIP)')).toBeInTheDocument();
	await page.getByRole('button', { name: /^Instagram story, / }).click();
	await expect
		.element(page.getByLabelText('Sticker text for Instagram story'))
		.toHaveValue('৳1,200 · Size M · Link in bio · DM to order');
	await page.getByRole('button', { name: /^Facebook Marketplace, / }).click();
	await expect
		.element(page.getByLabelText('Title', { exact: true }))
		.toHaveValue('Levis TEST ONLY — Denim shirt');
	await expect.element(page.getByText('Used - good')).toBeInTheDocument();
});

it('saves an edited caption with the listing text it started from, then resets it', async () => {
	let body: Record<string, string> = {};
	const { onmessage } = panel({
		'PUT /admin/api/products/test-shirt/social': (options) => {
			body = JSON.parse(options.body as string);
			return Response.json({ format: body.format, caption: body.caption, basis: body.basis });
		},
		'DELETE /admin/api/products/test-shirt/social': () => Response.json({ format: 'ig-square' })
	});
	const caption = page.getByLabelText('Caption for Instagram post 1:1');
	await expect.element(page.getByRole('button', { name: 'Save text' })).toBeDisabled();
	await caption.fill('Denim shirt, one only');
	await expect.element(page.getByText('Unsaved changes')).toBeInTheDocument();
	await page.getByRole('button', { name: 'Save text' }).click();
	await expect.element(page.getByText('Your edit is saved')).toBeInTheDocument();
	expect(body.format).toBe('ig-square');
	expect(body.caption).toBe('Denim shirt, one only');
	expect(body.basis).toContain('TEST ONLY — Denim shirt');
	expect(onmessage).toHaveBeenCalledWith('Caption saved');
	await expect
		.element(page.getByRole('button', { name: /^Instagram post 1:1, .*edited caption saved/ }))
		.toBeInTheDocument();
	await page.getByRole('button', { name: 'Reset to listing' }).click();
	await expect.element(page.getByText('Written from the listing')).toBeInTheDocument();
	await expect.element(caption).toHaveValue(expect.stringContaining('৳1,200'));
});

it('warns when the listing changed after a caption was saved', async () => {
	panel({
		'GET /admin/api/products/test-shirt/social': () =>
			Response.json([
				{
					format: 'ig-square',
					variant: 'classic',
					caption: 'Old caption ৳900',
					basis: 'older listing'
				}
			])
	});
	await expect
		.element(page.getByLabelText('Caption for Instagram post 1:1'))
		.toHaveValue('Old caption ৳900');
	await expect
		.element(page.getByText('The listing changed after this caption was saved', { exact: false }))
		.toBeInTheDocument();
});

it('switches caption variants, saves each one apart and adds an original-size tab', async () => {
	let body: Record<string, string> = {};
	panel({
		'PUT /admin/api/products/test-shirt/social': (options) => {
			body = JSON.parse(options.body as string);
			return Response.json(body);
		}
	});
	await expect
		.element(page.getByRole('button', { name: /^Original size, up to 2000 px/ }))
		.toBeInTheDocument();
	for (const name of [
		'Classic',
		'Short',
		'English only',
		'Bangla only',
		'Fit details',
		'New drop',
		'Storytelling'
	])
		await expect.element(page.getByRole('button', { name, exact: true })).toBeInTheDocument();
	const caption = page.getByLabelText('Caption for Instagram post 1:1');
	await page.getByRole('button', { name: 'New drop', exact: true }).click();
	await expect.element(caption).toHaveValue(expect.stringMatching(/^New drop\. One piece only\./));
	await caption.fill('Drop edit');
	await page.getByRole('button', { name: 'Save text' }).click();
	await expect.element(page.getByText('Your edit is saved')).toBeInTheDocument();
	expect(body).toMatchObject({ format: 'ig-square', variant: 'drop', caption: 'Drop edit' });
	await page.getByRole('button', { name: 'Storytelling', exact: true }).click();
	await expect
		.element(caption)
		.toHaveValue(expect.stringMatching(/^Washed soft, faded just right\./));
	await expect
		.element(page.getByRole('button', { name: 'New drop, edited caption saved' }))
		.toBeInTheDocument();
});

it('lets staff turn the price tag off for every image', async () => {
	panel();
	await expect.element(page.getByText('Photo 1 carries the price tag.')).toBeInTheDocument();
	await page.getByRole('button', { name: 'Off', exact: true }).click();
	await expect.element(page.getByText('No price tag on any photo.')).toBeInTheDocument();
	await expect
		.element(page.getByRole('button', { name: 'Off', exact: true }))
		.toHaveAttribute('aria-pressed', 'true');
});

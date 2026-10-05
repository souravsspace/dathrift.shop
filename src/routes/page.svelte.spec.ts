import { page } from 'vitest/browser';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Home from './+page.svelte';

it('shows the swing-tag storefront with honest local fixture and sold labels', async () => {
	render(Home, {
		data: {
			products: [
				{
					id: 'test-shirt',
					slug: 'test-olive-cotton-shirt',
					name: 'TEST ONLY — Olive cotton shirt',
					category: 'tops' as const,
					price_bdt: 850,
					stock_state: 'available' as const,
					size_label: 'L',
					condition_notes: 'Light fading at cuffs',
					photo_key: 'test-only/olive-shirt.webp',
					photo_alt: 'Generated test-only olive shirt'
				},
				{
					id: 'test-sold',
					slug: 'test-sold-denim-jacket',
					name: 'TEST ONLY — Sold denim jacket',
					category: 'outerwear' as const,
					price_bdt: 1750,
					stock_state: 'sold' as const,
					size_label: 'M',
					condition_notes: 'Wear at elbows',
					photo_key: 'test-only/denim-jacket.webp',
					photo_alt: 'Generated test-only denim jacket'
				}
			],
			facets: { categories: ['outerwear', 'tops'], sizes: ['L', 'M'] },
			hero: null,
			filters: {},
			filtered: false
		}
	});
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('one of one');
	await expect.element(page.getByText('Local preview · test pieces only')).toBeInTheDocument();
	await expect.element(page.getByText('TEST ONLY — Olive cotton shirt')).toBeInTheDocument();
	await expect
		.element(page.getByRole('img', { name: 'Generated test-only olive shirt' }))
		.toHaveAttribute('src', '/media/test-only/olive-shirt.webp');
	await expect.element(page.getByText('Sold out')).toBeInTheDocument();
});

const shirt = {
	id: 'shirt',
	slug: 'olive-cotton-shirt',
	name: 'Olive cotton shirt',
	category: 'tops' as const,
	price_bdt: 850,
	stock_state: 'available' as const,
	size_label: 'L',
	condition_notes: 'Light fading',
	photo_key: 'products/shirt/1.webp',
	photo_alt: 'Olive shirt on a hanger'
};

it('offers crawlable category links and a no-JavaScript filter form', async () => {
	render(Home, {
		data: {
			products: [shirt],
			facets: { categories: ['tops'], sizes: ['L'] },
			hero: null,
			filters: {},
			filtered: false
		}
	});
	await expect
		.element(page.getByRole('link', { name: 'Tops', exact: true }))
		.toHaveAttribute('href', '/shop/tops');
	await expect.element(page.getByRole('combobox', { name: 'Size' })).toBeInTheDocument();
	await expect.element(page.getByRole('checkbox', { name: 'Available only' })).toBeInTheDocument();
	expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
		'https://dathrift.shop/'
	);
	expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
});

it('keeps filtered variants out of the index', async () => {
	render(Home, {
		data: {
			products: [],
			facets: { categories: ['tops'], sizes: ['L'] },
			hero: null,
			filters: { size: 'XS' },
			filtered: true
		}
	});
	await expect.element(page.getByText('No pieces match these filters.')).toBeInTheDocument();
	// Filtering stays in place on the rack instead of jumping back to the top of the page.
	const form = document.querySelector('form.filters');
	expect(form?.getAttribute('data-sveltekit-reset')).toBe('false');
	// A full page load (no JavaScript yet) still lands back on the filters.
	expect(form?.getAttribute('action')).toBe('/#filters');
	expect(document.getElementById('filters')).not.toBeNull();
	const clear = page.getByRole('link', { name: 'Clear' });
	await expect.element(clear).toHaveAttribute('data-sveltekit-reset', 'false');
	await expect.element(clear).toHaveAttribute('href', '/#filters');
	expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
		'noindex, follow'
	);
});

it('leads with the featured piece on its swing tag', async () => {
	render(Home, {
		data: {
			products: [],
			facets: { categories: [], sizes: [] },
			hero: {
				...shirt,
				photo_alt: 'Featured olive shirt on a hanger',
				featured: true
			},
			filters: {},
			filtered: false
		}
	});
	await expect
		.element(page.getByRole('img', { name: 'Featured olive shirt on a hanger' }))
		.toHaveAttribute('src', '/media/products/shirt/1.webp');
	await expect.element(page.getByText('৳850')).toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: 'See the Olive cotton shirt' }))
		.toHaveAttribute('href', '/products/olive-cotton-shirt');
});

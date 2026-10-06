import { page } from 'vitest/browser';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Home from './+page.svelte';

const listing = {
	brand: null,
	measurements: { chest_in: 41.5, length_in: 28.5 },
	condition_notes: 'Light fading'
};

const shirt = {
	...listing,
	id: 'shirt',
	slug: 'olive-cotton-shirt',
	name: 'Olive cotton shirt',
	category: 'tops' as const,
	category_name: 'Tops',
	price_bdt: 850,
	stock_state: 'available' as const,
	size_label: 'L',
	photo_key: 'products/shirt/1.webp',
	photo_alt: 'Olive shirt on a hanger'
};

const tops = {
	slug: 'tops',
	name: 'Tops',
	measurement_set: 'top' as const,
	count: 12,
	photo_key: 'products/shirt/1.webp',
	photo_alt: 'Olive shirt on a hanger'
};

const facets = { categories: [tops], sizes: ['L'], price: { min: 850, max: 850 } };

it('shows the light storefront with honest local fixture and sold labels', async () => {
	render(Home, {
		data: {
			products: [
				{
					...shirt,
					id: 'test-shirt',
					slug: 'test-olive-cotton-shirt',
					name: 'TEST ONLY — Olive cotton shirt',
					photo_alt: 'Generated test-only olive shirt',
					photo_key: 'test-only/olive-shirt.webp'
				},
				{
					...shirt,
					id: 'test-sold',
					slug: 'test-sold-denim-jacket',
					name: 'TEST ONLY — Sold denim jacket',
					stock_state: 'sold' as const
				}
			],
			facets,
			hero: null
		}
	});
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('one of one');
	await expect.element(page.getByText('Local preview · test pieces only')).toBeInTheDocument();
	await expect.element(page.getByText('TEST ONLY — Olive cotton shirt')).toBeInTheDocument();
	await expect
		.element(page.getByRole('img', { name: 'Generated test-only olive shirt' }))
		.toHaveAttribute('src', '/media/test-only/olive-shirt.webp');
	await expect.element(page.getByText('Sold out')).toBeInTheDocument();
	expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
		'noindex, nofollow'
	);
});

it('offers a search box, category tiles with counts, and the shop link', async () => {
	render(Home, { data: { products: [shirt], facets, hero: null } });
	await expect
		.element(page.getByRole('searchbox', { name: 'Search pieces, brands or piece IDs' }).first())
		.toHaveAttribute('name', 'q');
	const form = document.querySelector('form.hero-search');
	expect(form?.getAttribute('action')).toBe('/shop');
	await expect
		.element(page.getByRole('link', { name: /Tops 12 pieces/ }))
		.toHaveAttribute('href', '/shop/tops');
	await expect.element(page.getByText('Chest 41.5 in')).toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: /Shop all 12 pieces/ }))
		.toHaveAttribute('href', '/shop');
	expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
		'https://dathrift.shop/'
	);
	expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
});

it('leads with the featured piece on its swing tag', async () => {
	render(Home, {
		data: {
			products: [],
			facets: { categories: [], sizes: [], price: { min: 0, max: 0 } },
			hero: { ...shirt, photo_alt: 'Featured olive shirt on a hanger', featured: true }
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

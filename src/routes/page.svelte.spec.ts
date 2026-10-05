import { page } from 'vitest/browser';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Home from './+page.svelte';

it('shows the approved archive direction with honest local fixture and sold labels', async () => {
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
			filters: {},
			filtered: false
		}
	});
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('One of a kind');
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
			filters: { size: 'XS' },
			filtered: true
		}
	});
	await expect.element(page.getByText('No pieces match these filters.')).toBeInTheDocument();
	expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
		'noindex, follow'
	);
});

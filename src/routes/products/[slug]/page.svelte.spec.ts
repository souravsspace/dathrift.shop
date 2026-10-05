import { page } from 'vitest/browser';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ProductPage from './+page.svelte';

const product = {
	id: 'test-sold',
	slug: 'test-sold-denim-jacket',
	name: 'TEST ONLY — Sold denim jacket',
	category: 'outerwear',
	brand: null,
	price_bdt: 1750,
	stock_state: 'sold' as const,
	description: 'Sold-state fixture for local storefront checks.',
	condition_notes: 'Wear at elbows; photographed.',
	size_label: 'M',
	fit_note: 'Regular fit.',
	measurements: { chest_cm: 108, length_cm: 66 },
	photos: [{ key: 'test-only/denim-jacket.webp', alt: 'Generated test-only denim jacket' }]
};

it('keeps sold piece readable with condition and measurements but no buy action', async () => {
	render(ProductPage, { data: { product } });
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent(product.name);
	await expect.element(page.getByText('Wear at elbows; photographed.')).toBeInTheDocument();
	await expect.element(page.getByText('108 cm')).toBeInTheDocument();
	await expect
		.element(page.getByRole('img', { name: 'Generated test-only denim jacket' }))
		.toHaveAttribute('src', '/media/test-only/denim-jacket.webp');
	await expect.element(page.getByText('Sold out')).toBeInTheDocument();
	await expect.element(page.getByRole('button', { name: 'Add to bag' })).not.toBeInTheDocument();
});

it('adds an available piece to the ID-only guest bag without reserving it', async () => {
	window.localStorage.clear();
	render(ProductPage, { data: { product: { ...product, stock_state: 'available' } } });
	await page.getByRole('button', { name: 'Add to bag' }).click();
	await expect.element(page.getByRole('link', { name: 'View bag' })).toBeInTheDocument();
	expect(window.localStorage.getItem('dathrift-cart')).toBe('["test-sold"]');
});

it('shows every photo with alt text and publishes canonical product metadata', async () => {
	render(ProductPage, {
		data: {
			product: {
				...product,
				slug: 'olive-cotton-shirt',
				name: 'Olive cotton shirt',
				stock_state: 'available' as const,
				photos: [
					{ key: 'products/p/front.webp', alt: 'Shirt front' },
					{ key: 'products/p/flaw.webp', alt: 'Close-up of cuff fading' }
				]
			}
		}
	});
	await page.getByRole('button', { name: 'Show photo 2: Close-up of cuff fading' }).click();
	await expect
		.element(page.getByRole('img', { name: 'Close-up of cuff fading' }).first())
		.toHaveAttribute('src', '/media/products/p/flaw.webp');
	expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
		'https://dathrift.shop/products/olive-cotton-shirt'
	);
	const jsonLd = document.head.querySelector('script[type="application/ld+json"]')?.textContent;
	expect(JSON.parse(jsonLd ?? '{}')).toMatchObject({
		'@type': 'Product',
		offers: { priceCurrency: 'BDT', availability: 'https://schema.org/InStock' }
	});
	expect(document.head.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
		'https://dathrift.shop/media/products/p/front.webp'
	);
});

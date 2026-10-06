import { page } from 'vitest/browser';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '../../layout.css';
import ShopPage from './+page.svelte';

// Desktop width: the filters sit in the sidebar rather than a closed phone sheet.
beforeEach(async () => {
	await page.viewport(1280, 900);
});

afterEach(async () => {
	await page.viewport(414, 896);
});

const piece = (n: number) => ({
	id: `p${n}`,
	slug: `piece-${n}`,
	name: `Piece ${n}`,
	brand: null,
	category: 'tops',
	category_name: 'Tops',
	price_bdt: 500 + n,
	stock_state: 'available' as const,
	size_label: 'M',
	condition_notes: null,
	measurements: { chest_in: 40 },
	photo_key: null,
	photo_alt: null
});

const facets = {
	categories: [
		{
			slug: 'bottoms',
			name: 'Bottoms',
			measurement_set: 'bottom' as const,
			count: 1,
			photo_key: null,
			photo_alt: null
		},
		{
			slug: 'tops',
			name: 'Tops',
			measurement_set: 'top' as const,
			count: 30,
			photo_key: null,
			photo_alt: null
		}
	],
	sizes: ['S', 'M', 'L'],
	price: { min: 500, max: 2000 }
};

it('is a plain GET form with search, sizes, price, fit, availability and sort', async () => {
	render(ShopPage, {
		data: {
			products: [piece(1)],
			total: 1,
			page: 1,
			facets,
			filters: {},
			filtered: false,
			category: null,
			categoryName: null
		}
	});
	const form = document.querySelector('form.filters');
	expect(form?.getAttribute('method')).toBe('GET');
	expect(form?.getAttribute('action')).toBe('/shop');
	await expect
		.element(page.getByRole('searchbox', { name: 'Search pieces' }))
		.toHaveAttribute('name', 'q');
	await expect.element(page.getByRole('checkbox', { name: 'M' })).toHaveAttribute('name', 'size');
	await expect
		.element(page.getByRole('spinbutton', { name: 'Min' }))
		.toHaveAttribute('name', 'min_price');
	await expect.element(page.getByRole('spinbutton', { name: 'Chest from' })).toBeInTheDocument();
	await expect.element(page.getByRole('spinbutton', { name: 'Waist from' })).toBeInTheDocument();
	await expect
		.element(page.getByRole('checkbox', { name: /Available only/ }))
		.toHaveAttribute('value', '1');
	await expect.element(page.getByRole('combobox', { name: 'Sort' })).toHaveValue('');
	await expect
		.element(page.getByRole('link', { name: 'All pieces 31' }))
		.toHaveAttribute('aria-current', 'page');
	expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
		'https://dathrift.shop/shop'
	);
});

it('lists active filters as removable chips and keeps filtered variants out of the index', async () => {
	render(ShopPage, {
		data: {
			products: [piece(1)],
			total: 1,
			page: 1,
			facets,
			filters: {
				query: 'olive',
				sizes: ['M', 'L'],
				maxPrice: 1500,
				chestMin: 38,
				availableOnly: true
			},
			filtered: true,
			category: null,
			categoryName: null
		}
	});
	await expect
		.element(page.getByRole('link', { name: 'Remove Size M' }))
		.toHaveAttribute('href', '/shop?q=olive&size=L&max_price=1500&chest_min=38&available=1');
	await expect
		.element(page.getByRole('link', { name: 'Remove “olive”' }))
		.toHaveAttribute('href', '/shop?size=M&size=L&max_price=1500&chest_min=38&available=1');
	await expect.element(page.getByText('Up to ৳1,500')).toBeInTheDocument();
	await expect.element(page.getByText('Chest 38 in or more')).toBeInTheDocument();
	await expect.element(page.getByRole('checkbox', { name: 'M' })).toBeChecked();
	await expect.element(page.getByText('5', { exact: true })).toBeInTheDocument();
	expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
		'noindex, follow'
	);
});

it('offers more pieces with a link that keeps the filters and grows the page', async () => {
	render(ShopPage, {
		data: {
			products: Array.from({ length: 24 }, (_, n) => piece(n)),
			total: 30,
			page: 1,
			facets,
			filters: { sort: 'price-asc' },
			filtered: true,
			category: null,
			categoryName: null
		}
	});
	await expect.element(page.getByText('Showing 24 of 30')).toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: 'Show more pieces' }))
		.toHaveAttribute('href', '/shop?sort=price-asc&page=2');
});

it('gives each category a heading, canonical URL and its own measurement filter', async () => {
	render(ShopPage, {
		data: {
			category: 'tops',
			categoryName: 'Tops',
			products: [],
			total: 0,
			page: 1,
			facets,
			filters: { category: 'tops' },
			filtered: false
		}
	});
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Tops');
	expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
		'https://dathrift.shop/shop/tops'
	);
	await expect
		.element(page.getByRole('link', { name: 'Tops 30' }))
		.toHaveAttribute('aria-current', 'page');
	await expect.element(page.getByRole('spinbutton', { name: 'Chest from' })).toBeInTheDocument();
	await expect
		.element(page.getByRole('spinbutton', { name: 'Waist from' }))
		.not.toBeInTheDocument();
	await expect.element(page.getByText('No pieces match')).toBeInTheDocument();
});

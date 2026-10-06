import { page } from 'vitest/browser';
import { afterEach, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '../../routes/layout.css';
import Browse from './Browse.svelte';
import SiteHeader from './SiteHeader.svelte';

afterEach(async () => {
	await page.viewport(414, 896);
});

it('fits the header on a 320px phone and puts the bag in the thumb-reach tab bar', async () => {
	await page.viewport(320, 640);
	window.localStorage.setItem('dathrift-cart', '["a","b"]');
	render(SiteHeader, { preview: true, current: 'home' });
	const header = document.querySelector('.site-header') as HTMLElement;
	await expect.element(page.getByText('daThriftShop')).toBeVisible();
	await expect.element(page.getByRole('link', { name: 'Search the shop' })).toBeVisible();
	expect(header.scrollWidth).toBeLessThanOrEqual(320);
	const tabs = page.getByRole('navigation', { name: 'Shortcuts' });
	await expect.element(tabs).toBeVisible();
	await expect.element(tabs.getByRole('link', { name: 'Bag, 2 pieces' })).toBeVisible();
	await expect
		.element(tabs.getByRole('link', { name: 'Home' }))
		.toHaveAttribute('aria-current', 'page');
	for (const link of (tabs.element() as HTMLElement).querySelectorAll('a')) {
		const box = link.getBoundingClientRect();
		expect(box.right).toBeLessThanOrEqual(320);
		expect(box.height).toBeGreaterThanOrEqual(44);
	}
	window.localStorage.clear();
});

it('opens the search sheet from the tab bar and suggests pieces as the shopper types', async () => {
	await page.viewport(390, 844);
	const original = window.fetch;
	window.fetch = (async () =>
		Response.json({
			total: 1,
			items: [
				{
					slug: 'olive-shirt',
					name: 'Olive cotton shirt',
					category_name: 'Tops',
					price_bdt: 850,
					size_label: 'L',
					stock_state: 'available',
					photo_key: null,
					photo_alt: null
				}
			]
		})) as typeof fetch;
	render(SiteHeader, {});
	await page
		.getByRole('navigation', { name: 'Shortcuts' })
		.getByRole('link', { name: 'Search' })
		.click();
	const box = page.getByRole('searchbox', { name: 'Search pieces, brands or piece IDs' });
	await expect.element(box).toBeVisible();
	await box.fill('olive');
	await expect
		.element(page.getByRole('link', { name: /Olive cotton shirt/ }))
		.toHaveAttribute('href', '/products/olive-shirt');
	await expect
		.element(page.getByRole('link', { name: /See all 1 result/ }))
		.toHaveAttribute('href', '/shop?q=olive');
	window.fetch = original;
});

it('keeps every category and the filter controls on a 360px phone, 16px so iOS does not zoom', async () => {
	await page.viewport(360, 740);
	render(Browse, {
		action: '/shop',
		title: 'All pieces',
		products: [],
		total: 0,
		page: 1,
		facets: {
			categories: ['Bottoms', 'Dresses', 'Outerwear', 'Tops', 'Sarees', 'Accessories'].map(
				(name) => ({
					slug: name.toLowerCase(),
					name,
					measurement_set: 'top' as const,
					count: 12
				})
			),
			sizes: ['S', 'M', 'L'],
			price: { min: 500, max: 3000 }
		},
		filters: {}
	});
	const browse = document.querySelector('.browse') as HTMLElement;
	expect(browse.scrollWidth).toBeLessThanOrEqual(360);
	for (const chip of document.querySelectorAll('.categories a'))
		expect(chip.getBoundingClientRect().right).toBeLessThanOrEqual(360);
	for (const control of document.querySelectorAll(
		'.filters input:not([type=checkbox]), .filters select'
	))
		expect(parseFloat(getComputedStyle(control).fontSize)).toBeGreaterThanOrEqual(16);
	const open = page.getByRole('button', { name: 'Filters' });
	await expect.element(open).toBeVisible();
	expect((open.element() as HTMLElement).getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
	await open.click();
	const show = page.getByRole('button', { name: 'Show 0 pieces' });
	await expect.element(show).toBeVisible();
	// The panel opens as a bottom sheet pinned to the screen's lower edge.
	const panel = getComputedStyle(document.getElementById('filter-panel') as HTMLElement);
	expect([panel.position, panel.bottom]).toEqual(['fixed', '0px']);
	expect((show.element() as HTMLElement).getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
});

import { page } from 'vitest/browser';
import { afterEach, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '../../routes/layout.css';
import BrowseFilters from './BrowseFilters.svelte';
import SiteHeader from './SiteHeader.svelte';

afterEach(async () => {
	await page.viewport(414, 896);
});

it('fits the header, with its full name and bag, on a 320px phone', async () => {
	await page.viewport(320, 640);
	window.localStorage.setItem('dathrift-cart', '["a","b"]');
	render(SiteHeader, { preview: true });
	const header = document.querySelector('.site-header') as HTMLElement;
	await expect.element(page.getByText('daThriftShop')).toBeVisible();
	await expect.element(page.getByRole('link', { name: 'Bag, 2 pieces' })).toBeVisible();
	expect(header.scrollWidth).toBeLessThanOrEqual(320);
	for (const link of header.querySelectorAll('a'))
		expect(link.getBoundingClientRect().right).toBeLessThanOrEqual(320);
	window.localStorage.clear();
});

it('keeps every category and filter on screen, with 16px controls that do not zoom iOS', async () => {
	await page.viewport(360, 740);
	render(BrowseFilters, {
		action: '/',
		categories: ['Bottoms', 'Dresses', 'Outerwear', 'Tops', 'Sarees', 'Accessories'].map(
			(name) => ({ slug: name.toLowerCase(), name })
		),
		sizes: ['S', 'M', 'L'],
		filters: {}
	});
	const browse = document.querySelector('.browse') as HTMLElement;
	expect(browse.scrollWidth).toBeLessThanOrEqual(360);
	for (const chip of document.querySelectorAll('.categories a'))
		expect(chip.getBoundingClientRect().right).toBeLessThanOrEqual(360);
	for (const control of document.querySelectorAll('.filters select'))
		expect(parseFloat(getComputedStyle(control).fontSize)).toBeGreaterThanOrEqual(16);
	const apply = page.getByRole('button', { name: 'Apply' });
	await expect.element(apply).toBeVisible();
	expect((apply.element() as HTMLElement).getBoundingClientRect().height).toBeGreaterThanOrEqual(
		44
	);
});

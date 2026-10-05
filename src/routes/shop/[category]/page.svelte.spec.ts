import { page } from 'vitest/browser';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CategoryPage from './+page.svelte';

it('gives each category a heading and canonical URL', async () => {
	render(CategoryPage, {
		data: {
			category: 'tops' as const,
			products: [],
			facets: { categories: ['tops'], sizes: [] },
			filters: { category: 'tops' as const },
			filtered: false
		}
	});
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Tops');
	expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
		'https://dathrift.shop/shop/tops'
	);
	await expect
		.element(page.getByRole('link', { name: 'Tops', exact: true }))
		.toHaveAttribute('aria-current', 'page');
});

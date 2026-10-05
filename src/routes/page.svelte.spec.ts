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
					category: 'tops',
					price_bdt: 850,
					stock_state: 'available',
					size_label: 'L',
					condition_notes: 'Light fading at cuffs',
					photo_key: 'test-only/olive-shirt.webp',
					photo_alt: 'Generated test-only olive shirt'
				},
				{
					id: 'test-sold',
					slug: 'test-sold-denim-jacket',
					name: 'TEST ONLY — Sold denim jacket',
					category: 'outerwear',
					price_bdt: 1750,
					stock_state: 'sold',
					size_label: 'M',
					condition_notes: 'Wear at elbows',
					photo_key: 'test-only/denim-jacket.webp',
					photo_alt: 'Generated test-only denim jacket'
				}
			]
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

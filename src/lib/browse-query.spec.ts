import { expect, it } from 'vitest';
import { activeFilterCount, browseQuery } from './browse-query';

it('writes filters back to a stable query string the server reads', () => {
	expect(browseQuery({})).toBe('');
	expect(
		browseQuery({
			query: 'olive shirt',
			sizes: ['M', 'L'],
			minPrice: 500,
			maxPrice: 1500,
			chestMin: 38,
			chestMax: 42.5,
			waistMin: 28,
			waistMax: 32,
			availableOnly: true,
			sort: 'price-asc',
			category: 'tops'
		})
	).toBe(
		'?q=olive+shirt&size=M&size=L&min_price=500&max_price=1500&chest_min=38&chest_max=42.5&waist_min=28&waist_max=32&available=1&sort=price-asc'
	);
	expect(browseQuery({ sort: 'newest' }, 3)).toBe('?page=3');
});

it('counts the filters a shopper has narrowed by, not search or sort', () => {
	expect(activeFilterCount({ query: 'x', sort: 'price-desc' })).toBe(0);
	expect(
		activeFilterCount({ sizes: ['M', 'L'], minPrice: 1, chestMin: 30, availableOnly: true })
	).toBe(5);
});

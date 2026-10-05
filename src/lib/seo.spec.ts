import { expect, it } from 'vitest';
import { productJsonLd } from './seo';

const product = {
	id: 'p1',
	slug: 'olive-cotton-shirt',
	name: 'Olive </script> shirt',
	category: 'tops',
	brand: null,
	price_bdt: 850,
	stock_state: 'available' as const,
	description: 'Olive cotton shirt.',
	photos: [{ key: 'products/p1/a.webp', alt: 'Front' }]
};

it('describes a used one-off garment truthfully without invented data', () => {
	const json = productJsonLd(product);
	expect(json).not.toContain('</script>');
	expect(JSON.parse(json)).toEqual({
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: 'Olive </script> shirt',
		description: 'Olive cotton shirt.',
		sku: 'p1',
		category: 'tops',
		image: ['https://dathrift.shop/media/products/p1/a.webp'],
		offers: {
			'@type': 'Offer',
			url: 'https://dathrift.shop/products/olive-cotton-shirt',
			priceCurrency: 'BDT',
			price: '850',
			itemCondition: 'https://schema.org/UsedCondition',
			availability: 'https://schema.org/InStock'
		}
	});
	const sold = JSON.parse(productJsonLd({ ...product, brand: 'Aarong', stock_state: 'sold' }));
	expect(sold.brand).toEqual({ '@type': 'Brand', name: 'Aarong' });
	expect(sold.offers.availability).toBe('https://schema.org/SoldOut');
	expect(
		JSON.parse(productJsonLd({ ...product, stock_state: 'reserved' })).offers.availability
	).toBe('https://schema.org/OutOfStock');
	expect(json).not.toMatch(/aggregateRating|review|gtin|shippingDetails|hasMerchantReturnPolicy/);
});

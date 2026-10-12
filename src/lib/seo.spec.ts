import { expect, it } from 'vitest';
import {
	collectionJsonLd,
	productDescription,
	productJsonLd,
	productTitle,
	storeJsonLd
} from './seo';

const product = {
	id: 'p1',
	code: 'OC2026001',
	slug: 'olive-cotton-shirt',
	name: 'Olive </script> shirt',
	category: 'shirt',
	category_name: 'Shirt',
	brand: null,
	price_bdt: 850,
	stock_state: 'available' as const,
	description: 'Olive cotton shirt.',
	size_label: 'L',
	measurements: { chest_in: 41.5, length_in: 29 },
	photos: [{ key: 'products/p1/a.webp', alt: 'Front' }]
};

const graph = (json: string) => JSON.parse(json)['@graph'] as Record<string, unknown>[];
const ofType = (json: string, type: string) => graph(json).find((node) => node['@type'] === type);

it('describes a used one-off garment truthfully without invented data', () => {
	const json = productJsonLd(product);
	expect(json).not.toContain('</script>');
	expect(JSON.parse(json)['@context']).toBe('https://schema.org');
	expect(ofType(json, 'Product')).toEqual({
		'@type': 'Product',
		'@id': 'https://dathrift.shop/products/olive-cotton-shirt#product',
		url: 'https://dathrift.shop/products/olive-cotton-shirt',
		name: 'Olive </script> shirt',
		description: 'Olive cotton shirt.',
		sku: 'OC2026001',
		productID: 'OC2026001',
		category: 'Shirt',
		size: 'L',
		itemCondition: 'https://schema.org/UsedCondition',
		additionalProperty: [
			{ '@type': 'PropertyValue', name: 'Chest', value: 41.5, unitCode: 'INH', unitText: 'in' },
			{ '@type': 'PropertyValue', name: 'Length', value: 29, unitCode: 'INH', unitText: 'in' }
		],
		image: ['https://dathrift.shop/media/products/p1/a.webp'],
		offers: {
			'@type': 'Offer',
			url: 'https://dathrift.shop/products/olive-cotton-shirt',
			priceCurrency: 'BDT',
			price: '850',
			itemCondition: 'https://schema.org/UsedCondition',
			availability: 'https://schema.org/InStock',
			eligibleRegion: { '@type': 'Country', name: 'BD' },
			seller: { '@id': 'https://dathrift.shop/#store' }
		}
	});
	const sold = productJsonLd({ ...product, brand: 'Aarong', stock_state: 'sold' });
	expect(ofType(sold, 'Product')?.brand).toEqual({ '@type': 'Brand', name: 'Aarong' });
	expect(ofType(sold, 'Product')?.offers).toMatchObject({
		availability: 'https://schema.org/SoldOut'
	});
	expect(
		ofType(productJsonLd({ ...product, stock_state: 'reserved' }), 'Product')?.offers
	).toMatchObject({ availability: 'https://schema.org/OutOfStock' });
	expect(json).not.toMatch(/aggregateRating|review|gtin|shippingDetails|hasMerchantReturnPolicy/);
});

it('falls back to the facts when a piece has no description or code', () => {
	const bare = ofType(productJsonLd({ ...product, description: null, code: null }), 'Product');
	expect(bare?.sku).toBe('p1');
	expect(bare?.productID).toBeUndefined();
	expect(bare?.description).toBe(productDescription({ ...product, description: null }));
});

it('places each piece in a breadcrumb trail through its category', () => {
	expect(ofType(productJsonLd(product), 'BreadcrumbList')).toEqual({
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dathrift.shop/' },
			{ '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://dathrift.shop/shop' },
			{ '@type': 'ListItem', position: 3, name: 'Shirt', item: 'https://dathrift.shop/shop/shirt' },
			{
				'@type': 'ListItem',
				position: 4,
				name: 'Olive </script> shirt',
				item: 'https://dathrift.shop/products/olive-cotton-shirt'
			}
		]
	});
});

it('titles each piece with the words thrift shoppers search for', () => {
	expect(productTitle({ ...product, name: 'Heritage Hilfiger', brand: 'Hilfiger' })).toBe(
		'Heritage Hilfiger — thrift shirt, size L, ৳850 | daThriftShop'
	);
	expect(productTitle({ ...product, name: 'Blue oxford', brand: 'Uniqlo' })).toBe(
		'Blue oxford — Uniqlo thrift shirt, size L, ৳850 | daThriftShop'
	);
	expect(productTitle({ ...product, name: 'Plain tee', size_label: null })).toBe(
		'Plain tee — thrift shirt, ৳850 | daThriftShop'
	);
});

it('writes a search snippet from the facts, with the owner note after them', () => {
	expect(productDescription({ ...product, name: 'Blue oxford', brand: 'Uniqlo' })).toBe(
		'Pre-loved Uniqlo shirt, size L, chest 41.5 in, length 29 in. One of one for ৳850 at daThriftShop, a thrift clothing shop in Bangladesh. Olive cotton shirt.'
	);
	const long = productDescription({ ...product, description: 'Soft worn cotton. '.repeat(20) });
	expect(long.length).toBeLessThanOrEqual(200);
	expect(long.endsWith('…')).toBe(true);
	expect(productDescription({ ...product, description: null, stock_state: 'sold' })).toBe(
		'Sold: this pre-loved shirt, size L, chest 41.5 in, length 29 in, found a home. Browse more one-of-a-kind thrift clothing at daThriftShop, Bangladesh.'
	);
});

it('introduces the store and its search to search engines', () => {
	const json = storeJsonLd();
	expect(ofType(json, 'OnlineStore')).toMatchObject({
		'@id': 'https://dathrift.shop/#store',
		name: 'daThriftShop',
		url: 'https://dathrift.shop/',
		logo: 'https://dathrift.shop/brand/dathrift-logo.png',
		areaServed: { '@type': 'Country', name: 'Bangladesh' }
	});
	expect(ofType(json, 'WebSite')).toMatchObject({
		'@id': 'https://dathrift.shop/#website',
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: 'https://dathrift.shop/shop?q={search_term_string}'
			},
			'query-input': 'required name=search_term_string'
		}
	});
});

it('lists the pieces on a shop page in order', () => {
	const json = collectionJsonLd({
		name: 'Shirt',
		path: '/shop/shirt',
		description: 'Thrift shirts.',
		items: [
			{ slug: 'a', name: 'A </script>' },
			{ slug: 'b', name: 'B' }
		]
	});
	expect(json).not.toContain('</script>');
	expect(ofType(json, 'CollectionPage')).toMatchObject({
		url: 'https://dathrift.shop/shop/shirt',
		name: 'Shirt',
		description: 'Thrift shirts.',
		isPartOf: { '@id': 'https://dathrift.shop/#website' },
		mainEntity: {
			'@type': 'ItemList',
			numberOfItems: 2,
			itemListElement: [
				{
					'@type': 'ListItem',
					position: 1,
					url: 'https://dathrift.shop/products/a',
					name: 'A </script>'
				},
				{ '@type': 'ListItem', position: 2, url: 'https://dathrift.shop/products/b', name: 'B' }
			]
		}
	});
	expect(ofType(json, 'BreadcrumbList')?.itemListElement).toHaveLength(3);
});

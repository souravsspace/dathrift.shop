import { SITE_ORIGIN } from './site';

type ProductForSeo = {
	id: string;
	slug: string;
	name: string;
	category: string;
	brand: string | null;
	price_bdt: number;
	stock_state: 'available' | 'reserved' | 'sold';
	description: string | null;
	photos: { key: string; alt: string }[];
};

const availability = {
	available: 'https://schema.org/InStock',
	reserved: 'https://schema.org/OutOfStock',
	sold: 'https://schema.org/SoldOut'
};

// Only facts the shop actually holds: no ratings, GTINs, discounts or unapproved policy markup.
export function productJsonLd(product: ProductForSeo): string {
	const data = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.name,
		...(product.description ? { description: product.description } : {}),
		sku: product.id,
		category: product.category,
		...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
		image: product.photos.map((photo) => `${SITE_ORIGIN}/media/${photo.key}`),
		offers: {
			'@type': 'Offer',
			url: `${SITE_ORIGIN}/products/${product.slug}`,
			priceCurrency: 'BDT',
			price: String(product.price_bdt),
			itemCondition: 'https://schema.org/UsedCondition',
			availability: availability[product.stock_state]
		}
	};
	return JSON.stringify(data).replace(/</g, '\\u003c');
}

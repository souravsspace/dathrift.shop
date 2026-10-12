import { SITE_ORIGIN, formatBdt } from './site';

export const SITE_NAME = 'daThriftShop';
export const STORE_DESCRIPTION =
	'Online thrift shop in Bangladesh: one-of-a-kind pre-loved and second-hand clothing with honest condition notes, measurements in inches, bKash payment and delivery across the country.';

type ProductForSeo = {
	id: string;
	code: string | null;
	slug: string;
	name: string;
	category: string;
	category_name: string;
	brand: string | null;
	price_bdt: number;
	stock_state: 'available' | 'reserved' | 'sold';
	description: string | null;
	size_label: string | null;
	measurements: Record<string, number>;
	photos: { key: string; alt: string }[];
};

const availability = {
	available: 'https://schema.org/InStock',
	reserved: 'https://schema.org/OutOfStock',
	sold: 'https://schema.org/SoldOut'
};

const measurementNames: Record<string, string> = {
	chest_in: 'Chest',
	length_in: 'Length',
	waist_in: 'Waist',
	inseam_in: 'Inseam'
};

const STORE_ID = `${SITE_ORIGIN}/#store`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

// JSON-LD sits inside a script tag, so "<" must never close it early.
const ldJson = (graph: object[]) =>
	JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');

const productUrl = (slug: string) => `${SITE_ORIGIN}/products/${slug}`;

function measurementEntries(measurements: Record<string, number>) {
	return Object.entries(measurements).filter(
		([key, value]) => measurementNames[key] && Number.isFinite(value)
	);
}

function breadcrumbs(trail: { name: string; path: string }[]) {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: trail.map((step, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: step.name,
			item: `${SITE_ORIGIN}${step.path}`
		}))
	};
}

// The brand is left out when the piece name already says it ("Heritage Hilfiger").
function brandWord(product: Pick<ProductForSeo, 'brand' | 'name'>) {
	const brand = product.brand?.trim();
	return brand && !product.name.toLowerCase().includes(brand.toLowerCase()) ? brand : null;
}

export function fitFacts(product: Pick<ProductForSeo, 'size_label' | 'measurements'>) {
	return [
		...(product.size_label ? [`size ${product.size_label}`] : []),
		...measurementEntries(product.measurements).map(
			([key, value]) => `${measurementNames[key].toLowerCase()} ${value} in`
		)
	];
}

function clip(text: string, limit: number) {
	if (text.length <= limit) return text;
	const cut = text.slice(0, limit - 1);
	return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.;:—-]+$/, '')}…`;
}

/** Page title: the piece, then the words buyers search for (thrift, category, size, price). */
export function productTitle(product: ProductForSeo) {
	const brand = brandWord(product);
	const kind = [brand, 'thrift', product.category_name.toLowerCase()].filter(Boolean).join(' ');
	const size = product.size_label ? `, size ${product.size_label}` : '';
	return `${product.name} — ${kind}${size}, ${formatBdt(product.price_bdt)} | ${SITE_NAME}`;
}

/** Search snippet built only from listing facts, with the owner's own note after them. */
export function productDescription(product: ProductForSeo) {
	const kind = [product.brand?.trim(), product.category_name.toLowerCase()]
		.filter(Boolean)
		.join(' ');
	const facts = [kind, ...fitFacts(product)].join(', ');
	if (product.stock_state === 'sold')
		return `Sold: this pre-loved ${facts}, found a home. Browse more one-of-a-kind thrift clothing at ${SITE_NAME}, Bangladesh.`;
	const lead = `Pre-loved ${facts}. One of one for ${formatBdt(product.price_bdt)} at ${SITE_NAME}, a thrift clothing shop in Bangladesh.`;
	const note = product.description?.trim().replace(/\s+/g, ' ');
	return clip(note ? `${lead} ${note}` : lead, 200);
}

// Only facts the shop actually holds: no ratings, GTINs, discounts or unapproved policy markup.
export function productJsonLd(product: ProductForSeo): string {
	const url = productUrl(product.slug);
	const measurements = measurementEntries(product.measurements);
	return ldJson([
		{
			'@type': 'Product',
			'@id': `${url}#product`,
			url,
			name: product.name,
			description: product.description?.trim() || productDescription(product),
			sku: product.code ?? product.id,
			...(product.code ? { productID: product.code } : {}),
			category: product.category_name,
			...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
			...(product.size_label ? { size: product.size_label } : {}),
			itemCondition: 'https://schema.org/UsedCondition',
			...(measurements.length
				? {
						additionalProperty: measurements.map(([key, value]) => ({
							'@type': 'PropertyValue',
							name: measurementNames[key],
							value,
							unitCode: 'INH',
							unitText: 'in'
						}))
					}
				: {}),
			image: product.photos.map((photo) => `${SITE_ORIGIN}/media/${photo.key}`),
			offers: {
				'@type': 'Offer',
				url,
				priceCurrency: 'BDT',
				price: String(product.price_bdt),
				itemCondition: 'https://schema.org/UsedCondition',
				availability: availability[product.stock_state],
				eligibleRegion: { '@type': 'Country', name: 'BD' },
				seller: { '@id': STORE_ID }
			}
		},
		breadcrumbs([
			{ name: 'Home', path: '/' },
			{ name: 'Shop', path: '/shop' },
			{ name: product.category_name, path: `/shop/${product.category}` },
			{ name: product.name, path: `/products/${product.slug}` }
		])
	]);
}

/** The store itself and its search box, for the home page. */
export function storeJsonLd(): string {
	return ldJson([
		{
			'@type': 'OnlineStore',
			'@id': STORE_ID,
			name: SITE_NAME,
			url: `${SITE_ORIGIN}/`,
			logo: `${SITE_ORIGIN}/brand/dathrift-logo.png`,
			image: `${SITE_ORIGIN}/brand/dathrift-logo.png`,
			description: STORE_DESCRIPTION,
			areaServed: { '@type': 'Country', name: 'Bangladesh' }
		},
		{
			'@type': 'WebSite',
			'@id': WEBSITE_ID,
			url: `${SITE_ORIGIN}/`,
			name: SITE_NAME,
			description: STORE_DESCRIPTION,
			inLanguage: 'en-BD',
			publisher: { '@id': STORE_ID },
			potentialAction: {
				'@type': 'SearchAction',
				target: {
					'@type': 'EntryPoint',
					urlTemplate: `${SITE_ORIGIN}/shop?q={search_term_string}`
				},
				'query-input': 'required name=search_term_string'
			}
		}
	]);
}

/** A shop page: the pieces it lists, in order, and where it sits in the shop. */
export function collectionJsonLd(page: {
	name: string;
	path: string;
	description: string;
	items: { slug: string; name: string }[];
}): string {
	const url = `${SITE_ORIGIN}${page.path}`;
	return ldJson([
		{
			'@type': 'CollectionPage',
			'@id': url,
			url,
			name: page.name,
			description: page.description,
			isPartOf: { '@id': WEBSITE_ID },
			mainEntity: {
				'@type': 'ItemList',
				numberOfItems: page.items.length,
				itemListElement: page.items.map((item, index) => ({
					'@type': 'ListItem',
					position: index + 1,
					url: productUrl(item.slug),
					name: item.name
				}))
			}
		},
		breadcrumbs([
			{ name: 'Home', path: '/' },
			{ name: 'Shop', path: '/shop' },
			...(page.path === '/shop' ? [] : [{ name: page.name, path: page.path }])
		])
	]);
}

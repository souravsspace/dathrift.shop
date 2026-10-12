import { and, asc, eq, max, min, notLike } from 'drizzle-orm';
import { STORE_DESCRIPTION, SITE_NAME, fitFacts } from '../../seo';
import { SITE_ORIGIN, formatBdt } from '../../site';
import type { Database } from '../db/client';
import { categories, deliveryAreas, products } from '../db/schema';
import { listPublicProducts } from './public-catalog';

/**
 * /llms.txt: a plain Markdown brief for AI assistants and answer engines, so they can describe
 * the shop, how buying works and what is for sale right now. Built from live data on each request.
 */
export async function llmsTxt(db: Database, { manualBkash }: { manualBkash: boolean }) {
	const real = and(eq(products.publicationState, 'published'), notLike(products.slug, 'test-%'));
	const [rails, fees, pieces] = await Promise.all([
		db
			.selectDistinct({ slug: categories.slug, name: categories.name })
			.from(products)
			.innerJoin(categories, eq(categories.slug, products.category))
			.where(real)
			.orderBy(asc(categories.name)),
		db
			.select({ low: min(deliveryAreas.feeBdt), high: max(deliveryAreas.feeBdt) })
			.from(deliveryAreas)
			.where(and(eq(deliveryAreas.active, true), eq(deliveryAreas.previewOnly, false)))
			.get(),
		listPublicProducts(db, { availableOnly: true }, { limit: 200 })
	]);
	const forSale = pieces.filter((piece) => !piece.slug.startsWith('test-'));
	const payment = manualBkash
		? '- Payment is by bKash Send Money to the shop number shown at checkout: the full total, or only the delivery charge with the rest paid in cash on delivery. Staff confirm each payment in the bKash app before the order ships.'
		: '- Payment is by bKash at checkout.';
	const delivery =
		fees?.low != null && fees.high != null
			? `- Delivery anywhere in Bangladesh by courier costs ${formatBdt(fees.low)} to ${formatBdt(fees.high)}, depending on the area, charged once per order.`
			: '- Delivery is by courier within Bangladesh.';
	return [
		`# ${SITE_NAME}`,
		'',
		`> ${STORE_DESCRIPTION}`,
		'',
		`${SITE_NAME} (${SITE_ORIGIN}) sells second-hand clothing where every listing is a single physical piece. When it sells, it is gone; sold pieces keep their pages, marked sold.`,
		'',
		'## How buying works',
		'',
		'- Prices are in Bangladeshi taka (BDT, ৳).',
		'- Each listing gives the size tag, measurements taken by hand in inches (chest or waist, length) and honest condition notes, with real photos.',
		'- Adding to the bag does not hold a piece. Starting payment holds it for 30 minutes.',
		payment,
		delivery,
		'',
		'## Shop',
		'',
		`- [All pieces](${SITE_ORIGIN}/shop)`,
		...rails.map((rail) => `- [${rail.name}](${SITE_ORIGIN}/shop/${rail.slug})`),
		`- Search: ${SITE_ORIGIN}/shop?q={name, brand or piece ID}`,
		'',
		'## Available now',
		'',
		...(forSale.length
			? forSale.map((piece) => {
					const kind = [piece.brand?.trim(), piece.category_name.toLowerCase()]
						.filter(Boolean)
						.join(' ');
					const facts = [kind, ...fitFacts(piece), formatBdt(piece.price_bdt)].join(', ');
					return `- [${piece.name}](${SITE_ORIGIN}/products/${piece.slug}): ${facts}`;
				})
			: ['- Nothing right now. New pieces are added often.']),
		''
	].join('\n');
}

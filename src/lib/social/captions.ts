// Social media captions built from the listing facts, in English and Bangla. Staff may edit
// them; the generated text is kept as the basis so a later listing change can be flagged.
import { SITE_ORIGIN, formatBdt } from '../site';
import type { SocialFormat } from './formats';

export type CaptionPiece = {
	code: string | null;
	slug: string;
	name: string;
	brand: string | null;
	category_name: string | null;
	size_label: string | null;
	measurements: Record<string, number>;
	condition_notes: string | null;
	price_bdt: number;
};

export type MarketplaceFields = {
	title: string;
	price: string;
	condition: string;
	category: string;
	description: string;
};

const measurementNames: Record<string, [english: string, bangla: string]> = {
	chest_in: ['Chest', 'বুক'],
	length_in: ['Length', 'লম্বা'],
	waist_in: ['Waist', 'কোমর'],
	inseam_in: ['Inseam', 'ইনসিম']
};

const FIXED_TAGS = ['#dathriftshop', '#thriftbd', '#prelovedbd', '#thriftshopbangladesh'];

const clean = (value: string | null) => value?.trim() || '';

const hashtag = (value: string | null) => {
	const word = clean(value)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '');
	return word ? `#${word}` : '';
};

export function hashtags(piece: CaptionPiece) {
	const extra = [hashtag(piece.category_name), hashtag(piece.brand)];
	return [...new Set([...FIXED_TAGS, ...extra].filter(Boolean))].join(' ');
}

const measurementLine = (piece: CaptionPiece, language: 0 | 1) =>
	Object.entries(piece.measurements)
		.filter(([key, value]) => measurementNames[key] && value > 0)
		.map(([key, value]) =>
			language === 0
				? `${measurementNames[key][0]} ${value} in`
				: `${measurementNames[key][1]} ${value} ইঞ্চি`
		)
		.join(' · ');

const pieceLink = (piece: CaptionPiece) => `${SITE_ORIGIN}/products/${piece.slug}`;

// One line under the name: brand, category and tagged size.
const factLine = (piece: CaptionPiece) =>
	[
		clean(piece.brand),
		clean(piece.category_name),
		clean(piece.size_label) && `Size ${clean(piece.size_label)}`
	]
		.filter(Boolean)
		.join(' · ');

function postCaption(format: SocialFormat, piece: CaptionPiece) {
	const instagram = format.platform === 'instagram';
	const price = formatBdt(piece.price_bdt);
	const condition = clean(piece.condition_notes);
	const size = clean(piece.size_label);
	const lines = (...items: string[]) => items.filter(Boolean).join('\n');
	return [
		lines(
			piece.name.trim(),
			factLine(piece),
			price,
			measurementLine(piece, 0),
			condition && `Condition: ${condition}`
		),
		lines(
			instagram ? 'Order from the link in bio, or DM us.' : `Order here: ${pieceLink(piece)}`,
			instagram ? '' : 'Or inbox us to order.',
			piece.code ? `Piece ID ${piece.code} · one piece only` : 'One piece only'
		),
		lines(
			`দাম: ${price}`,
			size && `সাইজ: ${size}`,
			measurementLine(piece, 1) && `মাপ: ${measurementLine(piece, 1)}`,
			condition && `কন্ডিশন: ${condition}`,
			instagram
				? 'অর্ডার করতে বায়োর লিংকে যান অথবা ইনবক্স করুন।'
				: 'অর্ডার করতে লিংকে যান অথবা ইনবক্স করুন।',
			'প্রতিটি পিস একটাই, আগে অর্ডার করলে আগে পাবেন।'
		),
		hashtags(piece)
	].join('\n\n');
}

// Stories have no caption field, so this is a short line to paste as a text or link sticker.
export function storyLine(format: SocialFormat, piece: CaptionPiece) {
	const size = clean(piece.size_label);
	return [
		formatBdt(piece.price_bdt),
		size && `Size ${size}`,
		format.platform === 'instagram' ? 'Link in bio · DM to order' : 'Inbox to order'
	]
		.filter(Boolean)
		.join(' · ');
}

// Marketplace titles lead with the brand unless the name already carries it.
const titleFor = (piece: CaptionPiece) => {
	const brand = clean(piece.brand);
	const name = piece.name.trim();
	const title =
		brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name;
	return title.slice(0, 100);
};

export function marketplaceFields(piece: CaptionPiece): MarketplaceFields {
	const condition = clean(piece.condition_notes);
	const description = [
		factLine(piece),
		measurementLine(piece, 0),
		condition && `Condition: ${condition}`,
		'Pre-loved, one piece only. Delivery across Bangladesh, pay with bKash.',
		`Details: ${pieceLink(piece)}`
	]
		.filter(Boolean)
		.join('\n');
	return {
		title: titleFor(piece),
		price: String(piece.price_bdt),
		condition: 'Used - good',
		category: clean(piece.category_name) || 'Clothing',
		description
	};
}

// The editable text for each format. Marketplace keeps its title and description as JSON.
export function generatedText(format: SocialFormat, piece: CaptionPiece) {
	if (format.kind === 'story') return storyLine(format, piece);
	if (format.kind === 'marketplace') {
		const { title, description } = marketplaceFields(piece);
		return JSON.stringify({ title, description });
	}
	return postCaption(format, piece);
}

export function parseMarketplaceText(text: string): { title: string; description: string } {
	try {
		const value = JSON.parse(text) as { title?: unknown; description?: unknown };
		return {
			title: typeof value.title === 'string' ? value.title : '',
			description: typeof value.description === 'string' ? value.description : ''
		};
	} catch {
		return { title: '', description: text };
	}
}

export const INSTAGRAM_CAPTION_LIMIT = 2200;

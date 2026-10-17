import { expect, it } from 'vitest';
import {
	generatedText,
	hashtags,
	marketplaceFields,
	parseMarketplaceText,
	storyLine,
	type CaptionPiece
} from './captions';
import { SOCIAL_FORMATS, type SocialFormatId } from './formats';

const format = (id: SocialFormatId) => SOCIAL_FORMATS.find((item) => item.id === id)!;

const shirt: CaptionPiece = {
	code: 'OC2026005',
	slug: 'levis-denim-shirt',
	name: 'Faded denim shirt',
	brand: "Levi's",
	category_name: 'Shirts',
	size_label: 'M',
	measurements: { chest_in: 21, length_in: 28.5 },
	condition_notes: 'Small mark on left cuff',
	price_bdt: 1200
};

it('builds an English and Bangla Instagram caption without links or phone numbers', () => {
	const caption = generatedText(format('ig-square'), shirt);
	expect(caption).toContain('Faded denim shirt');
	expect(caption).toContain("Levi's · Shirts · Size M");
	expect(caption).toContain('৳1,200');
	expect(caption).toContain('Chest 21 in · Length 28.5 in');
	expect(caption).toContain('Condition: Small mark on left cuff');
	expect(caption).toContain('link in bio');
	expect(caption).toContain('দাম: ৳1,200');
	expect(caption).toContain('মাপ: বুক 21 ইঞ্চি · লম্বা 28.5 ইঞ্চি');
	expect(caption).toContain('Piece ID OC2026005');
	expect(caption).not.toContain('https://');
	expect(caption).not.toMatch(/01\d{9}/);
	expect(caption).not.toMatch(/\n{3,}/);
});

it('puts the piece link in Facebook captions, the same for square and landscape', () => {
	const caption = generatedText(format('fb-square'), shirt);
	expect(caption).toContain('Order here: https://dathrift.shop/products/levis-denim-shirt');
	expect(caption).toContain('Or inbox us to order.');
	expect(generatedText(format('fb-landscape'), shirt)).toBe(caption);
});

it('leaves out blank facts', () => {
	const bare = { ...shirt, brand: null, size_label: null, measurements: {}, condition_notes: ' ' };
	const caption = generatedText(format('ig-portrait'), bare);
	expect(caption).not.toContain('Size');
	expect(caption).not.toContain('Condition');
	expect(caption).not.toContain('মাপ');
	expect(caption).toContain('Shirts\n৳1,200');
});

it('tags category and brand once each', () => {
	expect(hashtags(shirt)).toBe(
		'#dathriftshop #thriftbd #prelovedbd #thriftshopbangladesh #shirts #levis'
	);
});

it('gives stories a short sticker line', () => {
	expect(storyLine(format('ig-story'), shirt)).toBe('৳1,200 · Size M · Link in bio · DM to order');
	expect(generatedText(format('fb-story'), shirt)).toBe('৳1,200 · Size M · Inbox to order');
});

it('fills Marketplace fields and keeps title and description editable as JSON', () => {
	expect(marketplaceFields(shirt)).toMatchObject({
		title: "Levi's Faded denim shirt",
		price: '1200',
		condition: 'Used - good',
		category: 'Shirts'
	});
	expect(marketplaceFields({ ...shirt, name: "Levi's trucker" }).title).toBe("Levi's trucker");
	const text = generatedText(format('fb-marketplace'), shirt);
	expect(parseMarketplaceText(text)).toEqual({
		title: "Levi's Faded denim shirt",
		description: expect.stringContaining('Chest 21 in')
	});
	expect(parseMarketplaceText('plain words')).toEqual({ title: '', description: 'plain words' });
});

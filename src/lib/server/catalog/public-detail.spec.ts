import { localDatabase } from '../testing/local-d1';
import { expect, it } from 'vitest';
import { currentSlugFor, getPublicProductDetail } from './public-detail';

it('keeps drafts private and returns sold garment details with ordered photo descriptions', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: true });
	expect(await getPublicProductDetail(d1, 'test-unpublished-skirt')).toBeNull();
	expect(await getPublicProductDetail(d1, 'test-sold-denim-jacket')).toMatchObject({
		name: 'TEST ONLY — Sold denim jacket',
		stock_state: 'sold',
		condition_notes: 'Wear at elbows; photographed.',
		measurements: { chest_cm: 108, length_cm: 66 },
		photos: [{ key: 'test-only/denim-jacket.webp', alt: 'Generated test-only denim jacket visual' }]
	});
	db.close();
});

it('resolves a corrected slug to the current published URL', async () => {
	const { db, sqlite } = localDatabase();
	sqlite.exec(`INSERT INTO slug_redirects (old_slug, product_id) VALUES ('test-olive-shrit', 'test-shirt'),
		('test-old-skirt', 'test-draft')`);
	expect(await currentSlugFor(db, 'test-olive-shrit')).toBe('test-olive-cotton-shirt');
	expect(await currentSlugFor(db, 'test-old-skirt')).toBeNull();
	expect(await currentSlugFor(db, 'never-existed')).toBeNull();
});

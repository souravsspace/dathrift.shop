import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import { getPublicProductDetail } from './public-detail';

it('keeps drafts private and returns sold garment details with ordered photo descriptions', async () => {
	const db = new DatabaseSync(':memory:');
	for (const file of readdirSync('db/migrations').sort()) {
		db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
	}
	db.exec(readFileSync('db/seed/local.sql', 'utf8'));
	const d1 = {
		prepare: (sql: string) => ({
			bind: (slug: string) => ({ first: async () => db.prepare(sql).get(slug) ?? null })
		})
	};
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

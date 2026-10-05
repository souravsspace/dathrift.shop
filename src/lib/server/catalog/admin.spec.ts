import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import { createDraft, publishProduct, unpublishProduct, updateDraftDetails } from './admin';

it('creates one private draft and available unit atomically, rejecting invalid input', async () => {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');
	for (const file of readdirSync('db/migrations').sort()) {
		db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
	}
	const d1 = {
		prepare: (sql: string) => ({
			bind: (...args: (string | number)[]) => ({ run: () => db.prepare(sql).run(...args) })
		}),
		batch: async (statements: { run(): unknown }[]) => {
			db.exec('BEGIN');
			try {
				const result = statements.map((statement) => statement.run());
				db.exec('COMMIT');
				return result;
			} catch (error) {
				db.exec('ROLLBACK');
				throw error;
			}
		}
	};
	const input = {
		slug: 'test-new-jacket',
		name: 'TEST ONLY — New jacket',
		category: 'outerwear',
		price_bdt: 1300
	};
	await expect(createDraft(d1, { ...input, price_bdt: 0 })).rejects.toThrow('Invalid draft');
	const draft = await createDraft(d1, input);
	expect(draft).toMatchObject({ slug: input.slug, publication_state: 'draft' });
	expect(
		db
			.prepare(
				'SELECT p.slug, p.publication_state, i.state FROM products p JOIN inventory i ON i.product_id = p.id'
			)
			.all()
	).toEqual([{ slug: input.slug, publication_state: 'draft', state: 'available' }]);
	await expect(createDraft(d1, input)).rejects.toThrow();
	expect(db.prepare('SELECT COUNT(*) AS n FROM inventory').get()).toEqual({ n: 1 });
	db.close();
});

it('publishes only a complete photographed draft and can unpublish an available piece', async () => {
	const db = new DatabaseSync(':memory:');
	for (const file of readdirSync('db/migrations').sort()) {
		db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
	}
	const d1 = {
		prepare: (sql: string) => ({
			bind: (...args: (string | number)[]) => ({
				first: async () => db.prepare(sql).get(...args) ?? null,
				all: async () => ({ results: db.prepare(sql).all(...args) }),
				run: async () => db.prepare(sql).run(...args)
			})
		})
	};
	db.exec(
		"INSERT INTO products (id, slug, name, category, price_bdt) VALUES ('a', 'test-top', 'TEST ONLY — Top', 'tops', 500)"
	);
	db.exec("INSERT INTO inventory (product_id) VALUES ('a')");
	await expect(publishProduct(d1, 'a')).rejects.toThrow('Incomplete product');
	db.exec(`UPDATE products SET description = 'Local fixture', condition_notes = 'Small mark',
		size_label = 'S', measurements_json = '{"chest_cm":90,"length_cm":60}', fit_note = 'Regular'
		WHERE id = 'a'`);
	await expect(publishProduct(d1, 'a')).rejects.toThrow('Incomplete product');
	db.exec(
		"INSERT INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('a', 1, 'test-only/top.webp', 'TEST ONLY top')"
	);
	expect(await publishProduct(d1, 'a')).toEqual({ id: 'a', publication_state: 'published' });
	expect(db.prepare("SELECT publication_state FROM products WHERE id = 'a'").get()).toEqual({
		publication_state: 'published'
	});
	expect(await unpublishProduct(d1, 'a')).toEqual({ id: 'a', publication_state: 'draft' });
	db.exec("UPDATE products SET publication_state = 'published' WHERE id = 'a'");
	db.exec("UPDATE inventory SET state = 'sold' WHERE product_id = 'a'");
	await expect(unpublishProduct(d1, 'a')).rejects.toThrow('Product not available');
	db.close();
});

it('updates a draft garment without changing its stable slug or publication state', async () => {
	const db = new DatabaseSync(':memory:');
	for (const file of readdirSync('db/migrations').sort()) {
		db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
	}
	db.exec(readFileSync('db/seed/local.sql', 'utf8'));
	const d1 = {
		prepare: (sql: string) => ({
			bind: (...args: (string | number | null)[]) => ({
				run: async () => db.prepare(sql).run(...args)
			})
		})
	};
	const details = {
		name: 'TEST ONLY — Reworked skirt',
		category: 'bottoms',
		price_bdt: 875,
		brand: null,
		description: 'A local fixture.',
		condition_notes: 'Small mark at hem.',
		size_label: 'M',
		measurements_json: '{"waist_cm":78,"inseam_cm":70}',
		fit_note: 'Relaxed through the leg.'
	};
	await expect(updateDraftDetails(d1, 'test-draft', { ...details, price_bdt: 0 })).rejects.toThrow(
		'Invalid details'
	);
	await updateDraftDetails(d1, 'test-draft', details);
	expect(
		db
			.prepare('SELECT slug, name, price_bdt, publication_state FROM products WHERE id = ?')
			.get('test-draft')
	).toEqual({
		slug: 'test-unpublished-skirt',
		name: details.name,
		price_bdt: 875,
		publication_state: 'draft'
	});
	await expect(updateDraftDetails(d1, 'test-shirt', details)).rejects.toThrow('Draft not found');
	db.close();
});

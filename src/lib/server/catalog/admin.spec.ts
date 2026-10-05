import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import { createDraft } from './admin';

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

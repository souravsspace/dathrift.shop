import { localDatabase } from '../testing/local-d1';
import { expect, it } from 'vitest';
import { createCategory, listCategories } from './categories';

it('lists the starting categories with the measurements each one needs', async () => {
	const { db, sqlite } = localDatabase({ seed: false });
	expect(await listCategories(db)).toEqual([
		{ slug: 'bottoms', name: 'Bottoms', measurement_set: 'bottom' },
		{ slug: 'dresses', name: 'Dresses', measurement_set: 'top' },
		{ slug: 'outerwear', name: 'Outerwear', measurement_set: 'top' },
		{ slug: 'tops', name: 'Tops', measurement_set: 'top' }
	]);
	sqlite.close();
});

it('adds a category with a slug taken from its name, refusing duplicates and bad input', async () => {
	const { db, sqlite } = localDatabase({ seed: false });
	expect(await createCategory(db, { name: ' Sarees ', measurement_set: 'none' })).toEqual({
		slug: 'sarees',
		name: 'Sarees',
		measurement_set: 'none'
	});
	expect((await listCategories(db)).map((category) => category.slug)).toContain('sarees');
	await expect(createCategory(db, { name: 'SAREES', measurement_set: 'none' })).rejects.toThrow(
		'Category exists'
	);
	await expect(createCategory(db, { name: 'Sarees!', measurement_set: 'top' })).rejects.toThrow(
		'Category exists'
	);
	for (const input of [
		{ name: '   ', measurement_set: 'none' },
		{ name: 'Shoes', measurement_set: 'feet' },
		{ name: 'শাড়ি', measurement_set: 'none' },
		{ name: 'x'.repeat(61), measurement_set: 'none' },
		null
	])
		await expect(createCategory(db, input)).rejects.toThrow('Invalid category');
	expect(
		await createCategory(db, { name: 'শাড়ি', slug: 'bangla-sarees', measurement_set: 'none' })
	).toEqual({ slug: 'bangla-sarees', name: 'শাড়ি', measurement_set: 'none' });
	sqlite.close();
});

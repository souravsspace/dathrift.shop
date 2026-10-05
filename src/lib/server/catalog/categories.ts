import { asc } from 'drizzle-orm';
import type { Database } from '../db/client';
import { categories } from '../db/schema';
import { databaseErrorText } from '../db/errors';
import { slugify } from '../../slug';

export type MeasurementSet = 'top' | 'bottom' | 'none';

export type Category = { slug: string; name: string; measurement_set: MeasurementSet };

const measurementSets: MeasurementSet[] = ['top', 'bottom', 'none'];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const columns = {
	slug: categories.slug,
	name: categories.name,
	measurement_set: categories.measurementSet
};

export async function listCategories(db: Database): Promise<Category[]> {
	return db.select(columns).from(categories).orderBy(asc(categories.name));
}

// The slug comes from the name unless staff give one (needed for names without Latin letters).
export async function createCategory(db: Database, input: unknown): Promise<Category> {
	const value = (input ?? {}) as Record<string, unknown>;
	const name = typeof value.name === 'string' ? value.name.trim() : '';
	const slug =
		typeof value.slug === 'string' && value.slug.trim() ? value.slug.trim() : slugify(name, 60);
	const measurementSet = measurementSets.find((set) => set === value.measurement_set);
	if (!name || name.length > 60 || !slugPattern.test(slug) || slug.length > 60 || !measurementSet)
		throw new Error('Invalid category');
	try {
		await db.insert(categories).values({ slug, name, measurementSet });
	} catch (error) {
		if (/UNIQUE constraint failed/.test(databaseErrorText(error)))
			throw new Error('Category exists', { cause: error });
		throw error;
	}
	return { slug, name, measurement_set: measurementSet };
}

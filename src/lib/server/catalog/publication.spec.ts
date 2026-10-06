import { expect, it } from 'vitest';
import { publicationErrors } from './publication';

const photo = { r2_key: 'test-only/top.jpg' };

it('refuses publication without measurements and a photo', () => {
	const product = {
		name: 'Test-only top',
		measurement_set: 'top' as const,
		price_bdt: 1200,
		measurements_json: '{}'
	};

	expect(publicationErrors(product, [])).toEqual(['measurements_json', 'photos']);
	expect(publicationErrors({ ...product, measurement_set: null }, [])).toContain('category');
});

it('treats description, condition, size and fit note as optional', () => {
	const product = {
		name: 'Test-only top',
		measurement_set: 'top' as const,
		price_bdt: 1200,
		description: null,
		condition_notes: null,
		size_label: null,
		measurements_json: '{"chest_in":20.5,"length_in":27}',
		fit_note: null
	};

	expect(publicationErrors(product, [{ r2_key: 'test-only/top.jpg' }])).toEqual([]);
});

it('requires the category measurement set in half inches before publishing', () => {
	const product = {
		name: 'Test-only top',
		measurement_set: 'top' as const,
		price_bdt: 1200,
		description: 'Cotton top used only in tests',
		condition_notes: 'Small mark on left cuff',
		size_label: 'M',
		measurements_json: '{"chest_in":20.5}',
		fit_note: 'Fits relaxed'
	};

	expect(publicationErrors(product, [photo])).toEqual(['measurements_json']);
	expect(
		publicationErrors({ ...product, measurements_json: '{"chest_in":20.5,"length_in":27}' }, [
			photo
		])
	).toEqual([]);
	expect(
		publicationErrors({ ...product, measurements_json: '{"chest_in":20.3,"length_in":27}' }, [
			photo
		])
	).toEqual(['measurements_json']);
	expect(
		publicationErrors({ ...product, measurements_json: '{"chest_cm":52,"length_cm":68}' }, [photo])
	).toEqual(['measurements_json']);
	expect(
		publicationErrors(
			{
				...product,
				measurement_set: 'bottom',
				measurements_json: '{"waist_in":30,"inseam_in":29.5}'
			},
			[photo]
		)
	).toEqual([]);
	expect(
		publicationErrors({ ...product, measurement_set: 'none', measurements_json: null }, [photo])
	).toEqual([]);
});

it('accepts one to ten described photos', () => {
	const product = {
		name: 'Test-only bag',
		measurement_set: 'none' as const,
		price_bdt: 900,
		description: 'Leather bag used only in tests',
		condition_notes: 'Scuff on base',
		size_label: 'One size',
		measurements_json: null,
		fit_note: 'Shoulder strap'
	};
	expect(publicationErrors(product, Array(10).fill(photo))).toEqual([]);
	expect(publicationErrors(product, Array(11).fill(photo))).toEqual(['photos']);
});

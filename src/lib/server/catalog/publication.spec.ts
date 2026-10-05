import { expect, it } from 'vitest';
import { publicationErrors } from './publication';

it('refuses publication without honest garment details and a described photo', () => {
	const product = {
		name: 'Test-only top',
		category: 'tops',
		price_bdt: 1200,
		description: '',
		condition_notes: '',
		size_label: '',
		measurements_json: '{}',
		fit_note: ''
	};

	expect(publicationErrors(product, [])).toEqual([
		'description',
		'condition_notes',
		'size_label',
		'measurements_json',
		'fit_note',
		'photos'
	]);
});

it('requires category-specific centimeter measurements before publishing', () => {
	const product = {
		name: 'Test-only top',
		category: 'tops',
		price_bdt: 1200,
		description: 'Cotton top used only in tests',
		condition_notes: 'Small mark on left cuff',
		size_label: 'M',
		measurements_json: '{"chest_cm":52}',
		fit_note: 'Fits relaxed'
	};
	const photos = [{ r2_key: 'test-only/top.jpg', alt_text: 'Front of test-only top' }];

	expect(publicationErrors(product, photos)).toEqual(['measurements_json']);
	expect(
		publicationErrors({ ...product, measurements_json: '{"chest_cm":52,"length_cm":68}' }, photos)
	).toEqual([]);
	expect(
		publicationErrors(
			{
				...product,
				category: 'bottoms',
				measurements_json: '{"waist_cm":38,"inseam_cm":74}'
			},
			photos
		)
	).toEqual([]);
});

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

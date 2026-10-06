import type { MeasurementSet } from './categories';

type ProductForPublication = {
	name: string;
	// The category's measurement set; null when the category does not exist.
	measurement_set: MeasurementSet | null;
	price_bdt: number;
	measurements_json: string | null;
};

type PhotoForPublication = { r2_key: string };

export const MAX_PHOTOS = 10;

// Garment measurements are in inches, to the nearest half inch.
export const requiredMeasurements: Record<MeasurementSet, string[]> = {
	top: ['chest_in', 'length_in'],
	bottom: ['waist_in', 'inseam_in'],
	none: []
};

export function publicationErrors(
	product: ProductForPublication,
	photos: PhotoForPublication[]
): string[] {
	const errors: string[] = [];
	if (!product.name.trim()) errors.push('name');
	if (!product.measurement_set) errors.push('category');
	if (!Number.isSafeInteger(product.price_bdt) || product.price_bdt <= 0) errors.push('price_bdt');
	if (
		product.measurement_set &&
		!hasMeasurements(product.measurements_json, product.measurement_set)
	)
		errors.push('measurements_json');
	if (
		photos.length < 1 ||
		photos.length > MAX_PHOTOS ||
		photos.some((photo) => !photo.r2_key.trim())
	)
		errors.push('photos');
	return errors;
}

export const isHalfInch = (value: unknown): value is number =>
	typeof value === 'number' && value > 0 && value < 1000 && Number.isInteger(value * 2);

function hasMeasurements(value: string | null, set: MeasurementSet): boolean {
	const required = requiredMeasurements[set];
	if (!required.length) return true;
	if (!value) return false;
	try {
		const measurements: unknown = JSON.parse(value);
		if (measurements === null || typeof measurements !== 'object' || Array.isArray(measurements))
			return false;
		return required.every((key) => isHalfInch((measurements as Record<string, unknown>)[key]));
	} catch {
		return false;
	}
}

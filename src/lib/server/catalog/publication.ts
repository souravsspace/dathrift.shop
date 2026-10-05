type ProductForPublication = {
	name: string;
	category: string;
	price_bdt: number;
	description: string | null;
	condition_notes: string | null;
	size_label: string | null;
	measurements_json: string | null;
	fit_note: string | null;
};

type PhotoForPublication = { r2_key: string; alt_text: string };

export function publicationErrors(
	product: ProductForPublication,
	photos: PhotoForPublication[]
): string[] {
	const errors: string[] = [];
	if (!product.name.trim()) errors.push('name');
	if (!['tops', 'bottoms', 'outerwear', 'dresses'].includes(product.category))
		errors.push('category');
	if (!Number.isSafeInteger(product.price_bdt) || product.price_bdt <= 0) errors.push('price_bdt');
	if (!product.description?.trim()) errors.push('description');
	if (!product.condition_notes?.trim()) errors.push('condition_notes');
	if (!product.size_label?.trim()) errors.push('size_label');
	if (!hasMeasurements(product.measurements_json, product.category))
		errors.push('measurements_json');
	if (!product.fit_note?.trim()) errors.push('fit_note');
	if (
		photos.length < 1 ||
		photos.length > 8 ||
		photos.some((photo) => !photo.r2_key.trim() || !photo.alt_text.trim())
	)
		errors.push('photos');
	return errors;
}

function hasMeasurements(value: string | null, category: string): boolean {
	if (!value) return false;
	try {
		const measurements: unknown = JSON.parse(value);
		if (measurements === null || typeof measurements !== 'object' || Array.isArray(measurements))
			return false;
		const required = category === 'bottoms' ? ['waist_cm', 'inseam_cm'] : ['chest_cm', 'length_cm'];
		return required.every((key) => {
			const measurement = (measurements as Record<string, unknown>)[key];
			return typeof measurement === 'number' && Number.isFinite(measurement) && measurement > 0;
		});
	} catch {
		return false;
	}
}

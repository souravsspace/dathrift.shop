type Address = {
	name: string;
	phone: string;
	line1: string;
	district: string;
	area: string;
};

type ShippingDb = {
	prepare(sql: string): {
		bind(...values: string[]): {
			first(): Promise<Record<string, unknown> | null>;
		};
	};
};

export function normalizeShippingAddress(value: unknown): Address {
	if (!value || typeof value !== 'object') throw new Error('Invalid address');
	const input = value as Record<string, unknown>;
	if (
		['name', 'phone', 'line1', 'district', 'area'].some((field) => typeof input[field] !== 'string')
	)
		throw new Error('Invalid address');
	const address = input as Address;
	if (
		!address.name.trim() ||
		address.name.length > 120 ||
		!address.line1.trim() ||
		address.line1.length > 300 ||
		!/^[a-z0-9-]{1,100}$/.test(address.district) ||
		!/^[a-z0-9-]{1,100}$/.test(address.area)
	)
		throw new Error('Invalid address');
	const phone = address.phone.replace(/\s|-/g, '').replace(/^\+880/, '0');
	if (!/^01[3-9]\d{8}$/.test(phone)) throw new Error('Invalid address');
	return { ...address, phone };
}

export async function quoteShipping(db: ShippingDb, input: unknown) {
	const address = normalizeShippingAddress(input);
	const area = await db
		.prepare(
			`SELECT fee_bdt, preview_only FROM delivery_areas
		 WHERE district_key = ? AND area_key = ? AND active = 1`
		)
		.bind(address.district, address.area)
		.first();
	if (!area) throw new Error('Unsupported area');
	if (!Number.isSafeInteger(area.fee_bdt) || Number(area.fee_bdt) <= 0)
		throw new Error('Unsupported area');
	return {
		phone: address.phone,
		fee_bdt: area.fee_bdt as number,
		preview_only: area.preview_only === 1
	};
}

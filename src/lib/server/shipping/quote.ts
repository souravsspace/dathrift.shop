import { phoneSchema } from '../../checkout/address';
import { and, asc, eq } from 'drizzle-orm';
import type { Database } from '../db/client';
import { deliveryAreas } from '../db/schema';

type Address = {
	name: string;
	phone: string;
	line1: string;
	district: string;
	area: string;
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
	const phone = phoneSchema.safeParse(address.phone);
	if (!phone.success) throw new Error('Invalid address');
	return { ...address, phone: phone.data };
}

export async function quoteShipping(db: Database, input: unknown) {
	const address = normalizeShippingAddress(input);
	const area = await db
		.select({ fee_bdt: deliveryAreas.feeBdt, preview_only: deliveryAreas.previewOnly })
		.from(deliveryAreas)
		.where(
			and(
				eq(deliveryAreas.districtKey, address.district),
				eq(deliveryAreas.areaKey, address.area),
				eq(deliveryAreas.active, true)
			)
		)
		.get();
	if (!area || !Number.isSafeInteger(area.fee_bdt) || area.fee_bdt <= 0)
		throw new Error('Unsupported area');
	return { phone: address.phone, fee_bdt: area.fee_bdt, preview_only: area.preview_only };
}

export async function listDeliveryAreas(db: Database, allowPreview: boolean) {
	return db
		.select({
			district: deliveryAreas.districtKey,
			area: deliveryAreas.areaKey,
			name: deliveryAreas.displayName,
			fee_bdt: deliveryAreas.feeBdt
		})
		.from(deliveryAreas)
		.where(
			and(
				eq(deliveryAreas.active, true),
				allowPreview ? undefined : eq(deliveryAreas.previewOnly, false)
			)
		)
		.orderBy(asc(deliveryAreas.displayName));
}

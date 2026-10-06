import { z } from 'zod';
import { addressSchema } from './address';

// One delivery address the buyer chose to keep, stored only in this browser.
const key = 'dathrift-address';

type AddressStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type SavedAddress = z.output<typeof addressSchema>;

const storedSchema = z.object({ address: addressSchema, autofill: z.boolean() });

export function readSavedAddress(
	storage: AddressStorage
): { address: SavedAddress; autofill: boolean } | null {
	try {
		const result = storedSchema.safeParse(JSON.parse(storage.getItem(key) ?? 'null'));
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

/** Validates, then keeps the address; throws if it does not pass the checkout rules. */
export function saveAddress(
	storage: AddressStorage,
	address: z.input<typeof addressSchema>,
	autofill: boolean
) {
	const saved = { address: addressSchema.parse(address), autofill };
	storage.setItem(key, JSON.stringify(saved));
	return saved;
}

export function forgetAddress(storage: AddressStorage) {
	storage.removeItem(key);
}

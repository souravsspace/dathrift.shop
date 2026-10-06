import { expect, it } from 'vitest';
import { forgetAddress, readSavedAddress, saveAddress } from './saved-address';

const memory = () => {
	const data = new Map<string, string>();
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => void data.set(key, value),
		removeItem: (key: string) => void data.delete(key)
	};
};

const address = {
	name: 'Rahim Uddin',
	phone: '01712345678',
	line1: 'House 4, Road 7',
	areaKey: 'dhaka/dhanmondi'
};

it('remembers one checked delivery address on this device, with the auto-fill choice', () => {
	const storage = memory();
	expect(readSavedAddress(storage)).toBeNull();
	saveAddress(storage, { ...address, phone: '+880 1712 345678' }, true);
	expect(readSavedAddress(storage)).toEqual({ address, autofill: true });
	saveAddress(storage, address, false);
	expect(readSavedAddress(storage)?.autofill).toBe(false);
	forgetAddress(storage);
	expect(readSavedAddress(storage)).toBeNull();
});

it('refuses to save an invalid address and ignores damaged storage', () => {
	const storage = memory();
	expect(() => saveAddress(storage, { ...address, phone: '123' }, true)).toThrow();
	storage.setItem('dathrift-address', '{"address":{"name":""},"autofill":true}');
	expect(readSavedAddress(storage)).toBeNull();
	storage.setItem('dathrift-address', 'not json');
	expect(readSavedAddress(storage)).toBeNull();
});

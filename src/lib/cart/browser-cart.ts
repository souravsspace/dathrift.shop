const key = 'dathrift-cart';
type CartStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function readCartIds(storage: CartStorage): string[] {
	try {
		const value: unknown = JSON.parse(storage.getItem(key) ?? '[]');
		if (!Array.isArray(value)) return [];
		if (value.some((id) => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id))) return [];
		return [...new Set(value)];
	} catch {
		return [];
	}
}

export function addCartId(storage: CartStorage, id: string): string[] {
	if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error('Invalid product ID');
	const ids = [...new Set([...readCartIds(storage), id])];
	storage.setItem(key, JSON.stringify(ids));
	return ids;
}

export function removeCartId(storage: CartStorage, id: string): string[] {
	const ids = readCartIds(storage).filter((item) => item !== id);
	storage.setItem(key, JSON.stringify(ids));
	return ids;
}

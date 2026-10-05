type PhotoInput = {
	bytes: Uint8Array;
	contentType: string;
	position: number;
	altText: string;
};

type PhotoDb = {
	prepare(sql: string): {
		bind(...values: (string | number)[]): {
			run(): Promise<{ meta?: { changes: number }; changes?: number | bigint }>;
		};
	};
};

type PhotoBucket = {
	put(
		key: string,
		bytes: Uint8Array,
		options: { httpMetadata: { contentType: string } }
	): Promise<unknown>;
	delete(key: string): Promise<unknown>;
};

function extension(bytes: Uint8Array, contentType: string): string | null {
	if (
		contentType === 'image/jpeg' &&
		bytes.length >= 3 &&
		bytes[0] === 0xff &&
		bytes[1] === 0xd8 &&
		bytes[2] === 0xff
	)
		return 'jpg';
	if (
		contentType === 'image/png' &&
		bytes.length >= 8 &&
		[137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)
	)
		return 'png';
	if (
		contentType === 'image/webp' &&
		bytes.length >= 12 &&
		String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
		String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
	)
		return 'webp';
	return null;
}

export async function addProductPhoto(
	db: PhotoDb,
	bucket: PhotoBucket,
	id: string,
	input: PhotoInput
) {
	const ext = extension(input.bytes, input.contentType);
	if (
		!/^[a-zA-Z0-9-]{1,80}$/.test(id) ||
		!Number.isSafeInteger(input.position) ||
		input.position < 1 ||
		input.position > 8 ||
		!input.altText.trim() ||
		input.altText.length > 240 ||
		input.bytes.length < 16 ||
		input.bytes.length > 8 * 1024 * 1024 ||
		!ext
	)
		throw new Error('Invalid photo');
	const key = `products/${id}/${crypto.randomUUID()}.${ext}`;
	await bucket.put(key, input.bytes, { httpMetadata: { contentType: input.contentType } });
	try {
		const result = await db
			.prepare(
				`INSERT INTO product_photos (product_id, position, r2_key, alt_text)
			 SELECT id, ?, ?, ? FROM products
			 WHERE id = ? AND publication_state = 'draft'
			 AND EXISTS (SELECT 1 FROM inventory WHERE product_id = ? AND state = 'available')`
			)
			.bind(input.position, key, input.altText.trim(), id, id)
			.run();
		if (Number(result.meta?.changes ?? result.changes ?? 0) !== 1)
			throw new Error('Draft not available');
	} catch (error) {
		await bucket.delete(key);
		throw error;
	}
	return { position: input.position, r2_key: key, alt_text: input.altText.trim() };
}

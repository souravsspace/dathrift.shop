// Hands rendered post images to staff: one file, a ZIP of all, or the phone's share sheet.
export function saveBlob(blob: Blob, name: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = name;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function zipFiles(files: File[]): Promise<Blob> {
	const { zipSync } = await import('fflate');
	const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
	// PNG and JPEG are already compressed, so they are stored as they are.
	for (const file of files)
		entries[file.name] = [new Uint8Array(await file.arrayBuffer()), { level: 0 }];
	return new Blob([zipSync(entries) as Uint8Array<ArrayBuffer>], { type: 'application/zip' });
}

// Phones can save straight to the gallery or open Instagram through the share sheet.
export const canShareFiles = (files: File[]) =>
	typeof navigator !== 'undefined' && !!navigator.canShare?.({ files });

export async function shareFiles(files: File[]) {
	try {
		await navigator.share({ files });
		return true;
	} catch (error) {
		// Closing the share sheet is not a failure.
		if (error instanceof DOMException && error.name === 'AbortError') return false;
		throw error;
	}
}

// Draws product photos into Instagram and Facebook post sizes in the admin browser. The whole
// photo always shows (never cropped); the space around it is the shop's paper colour. The cover
// carries a small swing tag with the price, and stories a larger one with how to order.
import type { SocialFormat } from './formats';

export type TagFacts = { price: string; size: string; code: string; cta: string };

const PAPER = '#faf7f1';
const IVORY = '#fbebd6';
const INK = '#04241a';
const INK_SOFT = '#3d5a4d';
const MOSS = '#1d5c44';
const GOLD = '#d3b07f';
const GOLD_DEEP = '#8a6a3a';
const SANS = "Archivo, 'Noto Sans Bengali', system-ui, sans-serif";
const MONO = "'Martian Mono', ui-monospace, monospace";

export const JPEG_QUALITY = 0.95;

// Largest rectangle with the photo's shape that fits the frame, centred.
export function containRect(
	width: number,
	height: number,
	frameWidth: number,
	frameHeight: number
) {
	const scale = Math.min(frameWidth / width, frameHeight / height);
	const w = Math.round(width * scale);
	const h = Math.round(height * scale);
	return {
		x: Math.round((frameWidth - w) / 2),
		y: Math.round((frameHeight - h) / 2),
		width: w,
		height: h
	};
}

type Line = { text: string; font: string; color: string; gap: number };

function drawTag(context: CanvasRenderingContext2D, format: SocialFormat, facts: TagFacts) {
	const story = format.kind === 'story';
	// One unit is a pixel on a 1080 px short edge; story tags are drawn half as large again.
	const u = (Math.min(format.width, format.height) / 1080) * (story ? 1.5 : 1);
	const lines: Line[] = [
		{ text: 'daThriftShop', font: `500 ${20 * u}px ${MONO}`, color: INK_SOFT, gap: 0 },
		{ text: facts.price, font: `800 ${68 * u}px ${SANS}`, color: INK, gap: 14 * u },
		{ text: facts.size, font: `600 ${30 * u}px ${SANS}`, color: INK, gap: 10 * u },
		{ text: facts.code, font: `500 ${18 * u}px ${MONO}`, color: INK_SOFT, gap: 12 * u },
		{ text: story ? facts.cta : '', font: `700 ${24 * u}px ${SANS}`, color: MOSS, gap: 18 * u }
	].filter((line) => line.text);
	const sizes = lines.map((line) => {
		context.font = line.font;
		const metrics = context.measureText(line.text);
		return {
			width: metrics.width,
			ascent: metrics.actualBoundingBoxAscent,
			descent: metrics.actualBoundingBoxDescent
		};
	});
	const pad = 34 * u;
	const cut = 24 * u;
	const hole = 10 * u;
	const holeTop = 34 * u;
	const width = Math.max(220 * u, ...sizes.map((size) => size.width)) + pad * 2;
	const textHeight = sizes.reduce(
		(sum, size, index) => sum + size.ascent + size.descent + lines[index].gap,
		0
	);
	const height = holeTop + hole + 22 * u + textHeight + pad;
	const margin = Math.round(Math.min(format.width, format.height) * 0.045);
	const x = margin;
	const y = format.height - margin - height;

	// The thread rises from the eyelet out of the top of the tag.
	context.strokeStyle = GOLD_DEEP;
	context.lineWidth = 2 * u;
	context.beginPath();
	context.moveTo(x + width / 2, y + holeTop);
	context.lineTo(x + width / 2, y - 44 * u);
	context.stroke();

	// A die-cut tag with clipped top corners and a punched hole (even-odd fill leaves it open).
	context.save();
	context.shadowColor = 'rgba(2, 20, 14, 0.32)';
	context.shadowBlur = 26 * u;
	context.shadowOffsetY = 10 * u;
	context.beginPath();
	context.moveTo(x + cut, y);
	context.lineTo(x + width - cut, y);
	context.lineTo(x + width, y + cut);
	context.lineTo(x + width, y + height);
	context.lineTo(x, y + height);
	context.lineTo(x, y + cut);
	context.closePath();
	context.moveTo(x + width / 2 + hole, y + holeTop);
	context.arc(x + width / 2, y + holeTop, hole, 0, Math.PI * 2);
	context.fillStyle = IVORY;
	context.fill('evenodd');
	context.restore();

	context.strokeStyle = GOLD;
	context.lineWidth = 4 * u;
	context.beginPath();
	context.arc(x + width / 2, y + holeTop, hole + 2 * u, 0, Math.PI * 2);
	context.stroke();

	let baseline = y + holeTop + hole + 22 * u;
	context.textAlign = 'center';
	context.textBaseline = 'alphabetic';
	lines.forEach((line, index) => {
		baseline += line.gap + sizes[index].ascent;
		context.font = line.font;
		context.fillStyle = line.color;
		context.fillText(line.text, x + width / 2, baseline);
		baseline += sizes[index].descent;
	});
}

export function drawSocialImage(
	context: CanvasRenderingContext2D,
	format: SocialFormat,
	photo: CanvasImageSource & { width: number; height: number },
	tag: TagFacts | null
) {
	context.fillStyle = PAPER;
	context.fillRect(0, 0, format.width, format.height);
	const place = containRect(photo.width, photo.height, format.width, format.height);
	context.imageSmoothingEnabled = true;
	context.imageSmoothingQuality = 'high';
	context.drawImage(photo, place.x, place.y, place.width, place.height);
	if (tag) drawTag(context, format, tag);
}

// Canvas text needs the brand faces (and the taka glyph) loaded before the first draw.
let fontsReady: Promise<unknown> | undefined;
const loadFonts = () =>
	(fontsReady ??= Promise.all([
		document.fonts.load(`800 68px ${SANS}`, '৳0'),
		document.fonts.load(`600 30px ${SANS}`, 'Size'),
		document.fonts.load(`500 20px ${MONO}`, 'daThriftShop')
	]).catch(() => undefined));

export async function loadPhoto(url: string) {
	const response = await fetch(url);
	if (!response.ok) throw new Error('Could not load photo');
	return createImageBitmap(await response.blob());
}

export async function renderSocialImage(
	format: SocialFormat,
	photo: ImageBitmap,
	tag: TagFacts | null,
	type: 'image/png' | 'image/jpeg',
	quality = JPEG_QUALITY
): Promise<Blob> {
	await loadFonts();
	const canvas = document.createElement('canvas');
	canvas.width = format.width;
	canvas.height = format.height;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas unavailable');
	drawSocialImage(context, format, photo, tag);
	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
	if (!blob) throw new Error('Could not export image');
	return blob;
}

import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import '../routes/layout.css';
import SwingTag from './components/SwingTag.svelte';

const label = createRawSnippet(() => ({ render: () => '<p>TEST ONLY tag</p>' }));

const angle = (element: Element) => {
	const transform = getComputedStyle(element).transform;
	if (!transform || transform === 'none') return 0;
	const [a, b] = new DOMMatrixReadOnly(transform).toFloat64Array();
	return (Math.atan2(b, a) * 180) / Math.PI;
};

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

it('swings once on arrival, smoothly, ignoring pointer jitter, and settles straight', async () => {
	render(SwingTag, { children: label });
	const hanger = document.querySelector('.hang') as HTMLElement;
	const swinger = document.querySelector('.swinger') as HTMLElement;
	const box = hanger.getBoundingClientRect();
	const at = (x: number) => ({
		clientX: box.left + x,
		clientY: box.top + 40,
		pointerType: 'mouse'
	});

	hanger.dispatchEvent(new PointerEvent('pointerenter', at(10)));
	const samples: number[] = [];
	for (let i = 0; i < 90; i++) {
		// A restless mouse wiggling across the tag must not restart or jolt the swing.
		hanger.dispatchEvent(
			new PointerEvent('pointermove', { ...at(10 + (i % 2) * 40), bubbles: true })
		);
		if (i % 15 === 0) hanger.dispatchEvent(new PointerEvent('pointerenter', at(box.width - 10)));
		await frame();
		samples.push(angle(swinger));
	}
	const peak = Math.max(...samples.map(Math.abs));
	expect(peak).toBeGreaterThan(2);
	expect(peak).toBeLessThanOrEqual(7);
	const biggestStep = Math.max(...samples.slice(1).map((value, i) => Math.abs(value - samples[i])));
	expect(biggestStep).toBeLessThan(2);
	await new Promise((resolve) => setTimeout(resolve, 900));
	expect(Math.abs(angle(swinger))).toBeLessThan(0.05);
});

it('pivots the tag on the top of its thread, where it is hooked', () => {
	render(SwingTag, { children: label });
	const swinger = document.querySelector('.swinger') as HTMLElement;
	const thread = document.querySelector('.thread') as HTMLElement;
	const originY = parseFloat(getComputedStyle(swinger).transformOrigin.split(' ')[1]);
	const threadTop = thread.getBoundingClientRect().top - swinger.getBoundingClientRect().top;
	expect(Math.abs(originY - threadTop)).toBeLessThan(1);
});

it('does not swing for touch, which taps straight through to the piece', async () => {
	render(SwingTag, { children: label });
	const hanger = document.querySelector('.hang') as HTMLElement;
	hanger.dispatchEvent(
		new PointerEvent('pointerenter', { clientX: 5, clientY: 5, pointerType: 'touch' })
	);
	for (let i = 0; i < 10; i++) await frame();
	expect(angle(document.querySelector('.swinger') as HTMLElement)).toBe(0);
});

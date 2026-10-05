import { expect, it } from 'vitest';
import { fitWithin } from './to-webp';

it('scales the long edge down to 2000px and keeps the aspect ratio', () => {
	expect(fitWithin(4032, 3024)).toEqual({ width: 2000, height: 1500 });
	expect(fitWithin(3000, 6000)).toEqual({ width: 1000, height: 2000 });
});

it('never upscales small photos', () => {
	expect(fitWithin(1200, 1600)).toEqual({ width: 1200, height: 1600 });
	expect(fitWithin(2000, 1)).toEqual({ width: 2000, height: 1 });
});

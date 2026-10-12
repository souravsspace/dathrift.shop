import { expect, it } from 'vitest';
import { slugInput, slugify } from './slug';

it('turns a piece or category name into a URL slug', () => {
	expect(slugify('TEST ONLY — Rust corduroy trousers')).toBe('test-only-rust-corduroy-trousers');
	expect(slugify('Café Ñame')).toBe('cafe-name');
	expect(slugify('  --Hello__World!! 2 ')).toBe('hello-world-2');
	expect(slugify("Levi's 501")).toBe('levis-501');
});

it('returns an empty slug when nothing Latin is left, and stays within the length limit', () => {
	expect(slugify('শাড়ি')).toBe('');
	const long = slugify('word '.repeat(40), 30);
	expect(long.length).toBeLessThanOrEqual(30);
	expect(long).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});

it('cleans a slug as staff type it, keeping the hyphen they are typing', () => {
	expect(slugInput('Phone Shirt 2')).toBe('phone-shirt-2');
	expect(slugInput('blue-')).toBe('blue-');
	expect(slugInput('blue ')).toBe('blue-');
	expect(slugInput('--Blue  Shirt__')).toBe('blue-shirt-');
	expect(slugInput('Café')).toBe('cafe');
	expect(slugInput('শাড়ি')).toBe('');
});

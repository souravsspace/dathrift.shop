import { expect, it } from 'vitest';
import { addressSchema, isMobile, normalizePhone } from './address';

it('normalizes Bangladesh numbers written with a country code, spaces, dashes or Bangla digits', () => {
	expect(normalizePhone('+880 1712-345678')).toBe('01712345678');
	expect(normalizePhone('8801712345678')).toBe('01712345678');
	expect(normalizePhone('00880 1712 345678')).toBe('01712345678');
	expect(normalizePhone('০১৭১২৩৪৫৬৭৮')).toBe('01712345678');
	expect(normalizePhone('(017) 1234-5678')).toBe('01712345678');
});

it('accepts mobile numbers on every operator prefix, 013 to 019, and nothing else', () => {
	for (const prefix of ['013', '014', '015', '016', '017', '018', '019'])
		expect(isMobile(`${prefix}12345678`)).toBe(true);
	expect(isMobile('01212345678')).toBe(false);
	expect(isMobile('0171234567')).toBe(false);
	expect(isMobile('017123456789')).toBe(false);
	// Landlines are not accepted: the courier calls or texts a mobile.
	expect(isMobile('0255667788')).toBe(false);
	expect(isMobile('0312345678')).toBe(false);
});

it('validates the delivery form and reports a clear message per field', () => {
	const ok = addressSchema.safeParse({
		name: '  Rahim Uddin ',
		phone: '+880 1712 345678',
		line1: ' House 4, Road 7 ',
		areaKey: 'dhaka/dhanmondi'
	});
	expect(ok.success && ok.data).toEqual({
		name: 'Rahim Uddin',
		phone: '01712345678',
		line1: 'House 4, Road 7',
		areaKey: 'dhaka/dhanmondi'
	});
	const bad = addressSchema.safeParse({ name: ' ', phone: '12345', line1: '', areaKey: '' });
	expect(bad.success).toBe(false);
	if (bad.success) return;
	const fields = bad.error.issues.map((issue) => [issue.path[0], issue.message]);
	expect(Object.fromEntries(fields)).toEqual({
		name: 'Enter the name for the delivery.',
		phone: 'Enter an 11-digit Bangladesh mobile number, like 01712345678.',
		line1: 'Enter the house, road and area.',
		areaKey: 'Choose a delivery area.'
	});
});

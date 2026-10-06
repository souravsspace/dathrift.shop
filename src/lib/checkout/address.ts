import { z } from 'zod';

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

/** Digits only, Bangla numerals as ASCII, and +880 / 880 / 00880 written as the national 0. */
export function normalizePhone(value: string) {
	const digits = value
		.replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)))
		.replace(/[\s\-().]/g, '');
	return digits.replace(/^(?:\+|00)?880/, '0');
}

/** A Bangladesh mobile number: 01, an operator digit 3-9, then 8 digits (11 digits in all). */
export const isMobile = (phone: string) => /^01[3-9]\d{8}$/.test(phone);

export const PHONE_MESSAGE = 'Enter an 11-digit Bangladesh mobile number, like 01712345678.';

export const phoneSchema = z.string().transform(normalizePhone).refine(isMobile, {
	message: PHONE_MESSAGE
});

export const addressSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Enter the name for the delivery.')
		.max(120, 'Keep the name under 120 characters.'),
	phone: phoneSchema,
	line1: z
		.string()
		.trim()
		.min(1, 'Enter the house, road and area.')
		.max(300, 'Keep the address under 300 characters.'),
	areaKey: z.string().min(1, 'Choose a delivery area.')
});

export type AddressInput = z.input<typeof addressSchema>;

import { expect, it } from 'vitest';
import { manualProofSchema, normalizeTrxId } from './manual-proof';

const messages = (input: unknown) => {
	const result = manualProofSchema.safeParse(input);
	return result.success
		? {}
		: Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
};

it('tidies a pasted transaction ID', () => {
	expect(normalizeTrxId(' 8n7a 6d5c-4b ')).toBe('8N7A6D5C4B');
});

it('accepts a transaction ID, a sender number, or both, with the amount choice', () => {
	expect(
		manualProofSchema.parse({ plan: 'full', trx_id: '8n7a6d5c4b', sender_number: '' })
	).toEqual({ plan: 'full', trx_id: '8N7A6D5C4B', sender_number: null });
	expect(
		manualProofSchema.parse({ plan: 'delivery', trx_id: '', sender_number: '+880 1812-345678' })
	).toEqual({ plan: 'delivery', trx_id: null, sender_number: '01812345678' });
	expect(
		manualProofSchema.parse({ plan: 'full', trx_id: 'BFT7K2LM9P', sender_number: '01712345678' })
	).toEqual({ plan: 'full', trx_id: 'BFT7K2LM9P', sender_number: '01712345678' });
});

it('says what is missing or wrong, field by field', () => {
	expect(messages({ plan: '', trx_id: '', sender_number: '' })).toEqual({
		plan: 'Choose how much you sent.',
		trx_id: 'Enter the transaction ID or the bKash number you paid from.'
	});
	expect(messages({ plan: 'full', trx_id: 'abc', sender_number: '' })).toEqual({
		trx_id: 'A bKash transaction ID is 8 to 12 letters and numbers, like 8N7A6D5C4B.'
	});
	expect(messages({ plan: 'full', trx_id: '', sender_number: '0255667788' })).toEqual({
		sender_number: 'Enter an 11-digit Bangladesh mobile number, like 01712345678.'
	});
});
